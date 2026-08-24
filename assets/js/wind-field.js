/**
 * wind-field.js — 风场流体背景动效
 *
 * 设计思路（贴近气象学）：
 *  1. 背景流场使用 Perlin curl noise（梯度噪声的旋转梯度 90°）——场本身 C1 连续、
 *     无散度、流线平滑，粒子沿流线流动并留下短拖尾，模拟气象风场图（streamlines）。
 *  2. 鼠标悬停时，在光标处叠加 Rankine 涡旋（Rankine vortex）：
 *     核心区（r < coreRadius）切向速度随 r 线性增长，外围按 1/r 衰减；
 *     旋转方向为逆时针（北半球气旋旋向，符合气象学常识）。
 *  3. 粒子数量与透明度控制在"可见但柔和"的范围，不遮挡页面内容
 *     （canvas z-index 为 1，内容层在 10）。
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 参数配置
  // ---------------------------------------------------------------------------
  var CONFIG = {
    particleCountDesktop: 420,   // 桌面粒子数（高密度流线）
    particleCountMobile: 200,    // 移动端粒子数
    maxAlpha: 0.36,              // 粒子拖尾最高不透明度（易读性上限）
    trailLength: 16,             // 拖尾点数（流线感）
    mouseRadius: 280,            // 光标涡旋影响半径（px）
    coreRadius: 46,              // Rankine 涡旋核心半径（px）
    swirlStrength: 6.0,          // 涡旋切向速度峰值（px/帧）
    baseSpeed: 1.3,              // 背景流场速度系数
    noiseScale: 0.0016,          // 噪声空间尺度（屏坐标 -> 噪声坐标）
    diffusion: 0.055,            // 随机扩散强度（px/帧，破坏流线锁定，防止粒子聚成一条线）
    particleMaxAge: 10.0,        // 粒子最大寿命（秒），到期随机重置位置保持分布均匀
    fadeOutDuration: 1.2,        // 渐隐时长（秒）：寿命结束前逐渐淡出
    fadeInDuration: 0.8,         // 渐入时长（秒）：重置后逐渐淡入
    reducedMotion: false         // 是否尊重 prefers-reduced-motion
  };

  // ---------------------------------------------------------------------------
  // Perlin 梯度噪声（Ken Perlin 2D，C1 连续，无外部依赖）
  // ---------------------------------------------------------------------------
  function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);  // quintic fade（6t^5-15t^4+10t^3）
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // 整数坐标 -> [0,1) 伪随机数（基于 sin 哈希，稳定、无状态）
  function hash2(ix, iy) {
    var h = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453123;
    return h - Math.floor(h);
  }

  // 整数坐标 -> 伪随机梯度方向（8 个方向之一，避免各向异性）
  function grad2(ix, iy, x, y) {
    var h = Math.floor(hash2(ix, iy) * 8);
    var u = (h < 4) ? x : y;
    var v = (h < 4) ? y : x;
    // 折返得到 (+,+) (+,-) (-,+) (-,-) 四象限 + 分量交换，共 8 方向
    var sign = (h & 1) === 0 ? 1 : -1;
    var sign2 = (h & 2) === 0 ? 1 : -1;
    return sign * u + sign2 * v;
  }

  /**
   * perlinValue(x, y) — 2D Perlin 噪声，值域约 [-1, 1]
   */
  function perlinValue(x, y) {
    var x0 = Math.floor(x);
    var y0 = Math.floor(y);
    var xf = x - x0;
    var yf = y - y0;

    var u = fade(xf);
    var v = fade(yf);

    var n00 = grad2(x0, y0, xf, yf);
    var n10 = grad2(x0 + 1, y0, xf - 1, yf);
    var n01 = grad2(x0, y0 + 1, xf, yf - 1);
    var n11 = grad2(x0 + 1, y0 + 1, xf - 1, yf - 1);

    var nx0 = lerp(n00, n10, u);
    var nx1 = lerp(n01, n11, u);
    return lerp(nx0, nx1, v);
  }

  /**
   * curlNoise(x, y) — 无散度流场（Curl of Perlin noise）
   * 将标量噪声场的梯度旋转 90°：
   *   vx = dN/dy, vy = -dN/dx
   * 这样得到的速度场散度为零、处处平滑，流线呈现自然的大尺度气流形态。
   * 梯度使用中心差分（Perlin 场 C1 连续，差分稳定）。
   */
  function curlNoise(x, y) {
    var e = 0.35; // 差分步长（噪声坐标单位，格距 1.0 —— 步长小则平滑、大则更宏观）

    var dNdx = (perlinValue(x + e, y) - perlinValue(x - e, y)) / (2 * e);
    var dNdy = (perlinValue(x, y + e) - perlinValue(x, y - e)) / (2 * e);

    return { x: dNdy, y: -dNdx };
  }

  // ---------------------------------------------------------------------------
  // Rankine 涡旋（台风核心模拟，北半球逆时针）
  // ---------------------------------------------------------------------------
  /**
   * swirlVelocity(dx, dy, r) — 光标涡旋在距光标 (dx, dy) 处的切向速度分量。
   * 逆时针方向（屏幕坐标系 y 向下）：v = (-dy, dx) / r * speed
   * 核心区线性增长（眼壁），外围 1/r 衰减。
   */
  function swirlVelocity(dx, dy, r) {
    if (r < 1e-3) {
      return { x: 0, y: 0 };
    }

    var t = r / CONFIG.coreRadius;
    var speed;

    if (t < 1) {
      speed = CONFIG.swirlStrength * t;             // 核心区：线性增长（眼壁结构）
    } else {
      // 外围按 1/r 衰减，但用 0.75 幂次放缓衰减（更接近真实台风外围风圈）
      speed = CONFIG.swirlStrength / Math.pow(t, 0.75);
    }

    var nx = -dy / r;
    var ny = dx / r;

    return { x: nx * speed, y: ny * speed };
  }

  // ---------------------------------------------------------------------------
  // 粒子
  // ---------------------------------------------------------------------------
  function Particle(canvas) {
    this.reset(canvas);
  }

  Particle.prototype.reset = function (canvas) {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.trail = [];
    this.baseAlpha = CONFIG.maxAlpha * (0.5 + Math.random() * 0.5);
    this.alpha = this.baseAlpha;
    // 渐隐因子（1 = 完全可见，0 = 消失）：
    // 临近寿命时线性衰减到 0，到期重置后从 0 渐入，避免粒子突然消失/闪现
    this.fadeFactor = 0;
    // 每个粒子的寿命随机化（5~15 秒），避免所有粒子同一时刻重置造成闪烁；
    // age 从 0 开始，保证重生后按 fadeInDuration 从透明淡入
    this.lifespan = CONFIG.particleMaxAge * (0.5 + Math.random() * 0.5);
    this.age = 0;
  };

  Particle.prototype.step = function (canvas, mouse, dt) {
    // 寿命管理：粒子到期后随机重置位置，防止长时间运行后
    // 全部粒子被锁死在同一条流线轨道上（"练成一条线"问题）
    this.age += dt;
    if (this.age >= this.lifespan) {
      this.reset(canvas);
      return;
    }

    // 渐隐/渐入因子：临近寿命时淡出（剩余时间 < fadeOutDuration 线性衰减到 0），
    // 刚重置时淡入（age 越小越接近 0 透明度），消失与重生平滑过渡
    var remaining = this.lifespan - this.age;
    if (remaining < CONFIG.fadeOutDuration) {
      this.fadeFactor = Math.max(0, remaining / CONFIG.fadeOutDuration);
    } else {
      // 重生后的淡入（前 fadeInDuration 秒内从 0 渐入）
      this.fadeFactor = Math.min(1, this.age / CONFIG.fadeInDuration + 0.01);
    }

    // 0. 随机扩散：轻微随机扰动破坏流线锁定，让粒子缓慢换轨
    //    （扩散远小于流场速度，视觉上几乎不可察觉，但能保证长期分布均匀）
    var diffuseX = (Math.random() - 0.5) * CONFIG.diffusion;
    var diffuseY = (Math.random() - 0.5) * CONFIG.diffusion;

    // 1. 背景流场（Perlin curl noise）
    var field = curlNoise(this.x * CONFIG.noiseScale, this.y * CONFIG.noiseScale);

    var vx = field.x * CONFIG.baseSpeed + diffuseX;
    var vy = field.y * CONFIG.baseSpeed + diffuseY;

    // 2. 涡旋叠加（Rankine，逆时针）
    //    涡旋中心 = 光标静止位置（vortexX/vortexY），强度 = vortexIntensity（0~1 平滑渐变）
    //    光标移动时涡旋强度快速消散，不会出现"跟在光标后疯转"的效果
    if (mouse.active && mouse.vortexIntensity > 0.01) {
      var dx = this.x - mouse.vortexX;
      var dy = this.y - mouse.vortexY;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CONFIG.mouseRadius) {
        var falloff = 1 - fade(dist / CONFIG.mouseRadius); // 边缘平滑过渡
        var swirl = swirlVelocity(dx, dy, dist);
        var strength = falloff * 1.6 * mouse.vortexIntensity; // 涡旋主导背景流场（乘强度渐入）

        vx += swirl.x * strength;
        vy += swirl.y * strength;

        // 涡旋区内粒子稍亮，突出台风眼壁结构（仍低于易读性上限）
        this.alpha = Math.min(CONFIG.maxAlpha * 1.35, this.alpha + 0.004 * mouse.vortexIntensity);
      } else {
        // 离开涡旋区后 alpha 缓慢回归基线
        this.alpha += (this.baseAlpha - this.alpha) * 0.02;
      }
    }

    // 3. 半隐式欧拉积分（dt 归一化到 60fps 基准）
    var k = dt * 60;
    this.x += vx * k;
    this.y += vy * k;

    // 记录拖尾
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > CONFIG.trailLength) {
      this.trail.shift();
    }

    // 4. 边界环绕（wrap），保持粒子在场内均匀分布
    if (this.x > canvas.width) {
      this.x = 0;
      this.trail = [];
    } else if (this.x < 0) {
      this.x = canvas.width;
      this.trail = [];
    }
    if (this.y > canvas.height) {
      this.y = 0;
      this.trail = [];
    } else if (this.y < 0) {
      this.y = canvas.height;
      this.trail = [];
    }
  };

  // ---------------------------------------------------------------------------
  // 拖尾绘制优化：alpha 量化 + 逐段缓存 strokeStyle
  // 每帧绘制约数千段线段；把连续相同 alpha 桶的线段合并为一次 stroke，
  // 并将 strokeStyle 字符串按 alpha 桶缓存，避免重复创建字符串浪费内存。
  // ---------------------------------------------------------------------------
  var ALPHA_BUCKETS = 12;      // 透明度量化桶数
  var BUCKET_CACHE = [];       // 桶 -> 'rgba(255,255,255,a)' 样式缓存

  function bucketStyle(bucketIndex) {
    if (!BUCKET_CACHE[bucketIndex]) {
      // 桶内 alpha 取桶上限值（视觉差异 <1/12，肉眼不可辨）
      var a = (bucketIndex + 1) / ALPHA_BUCKETS;
      BUCKET_CACHE[bucketIndex] = 'rgba(255, 255, 255, ' + a.toFixed(3) + ')';
    }
    return BUCKET_CACHE[bucketIndex];
  }

  Particle.prototype.draw = function (ctx) {
    var n = this.trail.length;
    if (n < 2) {
      return;
    }

    ctx.lineWidth = 1;
    ctx.lineCap = 'round';

    // 按 alpha 桶分组绘制：同一桶内连续线段合并为一条路径
    var currentBucket = -1;
    ctx.beginPath();

    // 显式 for 循环，保持可读性
    for (var i = 0; i < n - 1; i++) {
      var t = i / (n - 1);
      // fadeFactor：粒子寿命渐隐/渐入整体透明度（消失/重生平滑过渡）
      var alpha = this.alpha * this.fadeFactor * t * t;   // 旧拖尾更快淡出
      var bucket = Math.min(
        ALPHA_BUCKETS - 1,
        Math.floor(alpha / (CONFIG.maxAlpha * 1.35) * ALPHA_BUCKETS)
      );

      if (bucket !== currentBucket) {
        // 换桶：先提交上一桶的路径，再开始新桶
        if (currentBucket !== -1) {
          ctx.strokeStyle = bucketStyle(currentBucket);
          ctx.stroke();
          ctx.beginPath();
        }
        currentBucket = bucket;
      }

      ctx.moveTo(this.trail[i].x, this.trail[i].y);
      ctx.lineTo(this.trail[i + 1].x, this.trail[i + 1].y);
    }

    // 提交最后一桶
    if (currentBucket !== -1) {
      ctx.strokeStyle = bucketStyle(currentBucket);
      ctx.stroke();
    }
  };

  // ---------------------------------------------------------------------------
  // 主循环
  // ---------------------------------------------------------------------------
  function initWindField(canvasId) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) {
      return;
    }

    var ctx = canvas.getContext('2d');
    var particles = [];
    // 鼠标状态：
    //  - x/y: 光标当前位置
    //  - active: 光标是否在页面内
    //  - moved: 本帧内光标是否移动过
    //  - lastMoveTime: 最后一次移动的时间戳
    //  - stillTime: 光标已静止的时长（秒）
    //  - vortexX/vortexY: 涡旋锁定中心（静止位置）
    //  - vortexIntensity: 涡旋强度（0~1，平滑渐入渐出）
    var mouse = { x: 0, y: 0, active: false, moved: false, lastMoveTime: 0, stillTime: 0, vortexX: 0, vortexY: 0, vortexIntensity: 0 };
    var lastTime = performance.now();
    // 涡旋参数：静止多久后触发（秒）、渐入/渐出速度、涡旋半径、锁定开关
    var VORTEX = {
      stillDelay: 1.0,        // 光标静止 1 秒后才触发涡旋
      fadeInSpeed: 1.2,       // 渐入速度（强度/秒）
      fadeOutSpeed: 2.5,      // 渐出速度（强度/秒，移动时快速消散）
      lockCenter: true        // 涡旋锁定在静止位置，不随光标移动
    };

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // 画布尺寸变化后重新初始化粒子分布
      particles = [];
      var count = window.innerWidth < 768
        ? CONFIG.particleCountMobile
        : CONFIG.particleCountDesktop;
      for (var i = 0; i < count; i++) {
        particles.push(new Particle(canvas));
      }
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    window.addEventListener('mousemove', function (event) {
      var wasInactive = !mouse.active;
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      mouse.active = true;
      // 首次进入页面或移动时标记 moved（不立即激活涡旋——需静止 1 秒）
      // 曾在页面内时才需要标记 moved；首次进入时也视为移动，重置静止计时
      mouse.moved = true;
      if (wasInactive) {
        mouse.stillTime = 0;
      }
    });

    // mouseleave 不冒泡：仅在指针真正离开文档时才关闭涡旋，
    // 避免指针在页面内跨元素边界时涡旋被误关闭。
    document.addEventListener('mouseleave', function (event) {
      // relatedTarget 为 null 时表示离开文档/窗口
      if (!event.relatedTarget) {
        mouse.active = false;
        mouse.vortexIntensity = 0;
      }
    });

    // 触摸设备基本支持（悬停视觉有限，仅保证不报错）
    window.addEventListener('touchmove', function (event) {
      if (event.touches.length > 0) {
        mouse.x = event.touches[0].clientX;
        mouse.y = event.touches[0].clientY;
        mouse.active = true;
        mouse.moved = true; // 触摸移动标记，不立即激活涡旋
      }
    });

    // 触摸开始时激活（保持与鼠标静止逻辑一致：静止 1 秒后触发）
    window.addEventListener('touchstart', function (event) {
      if (event.touches.length > 0) {
        mouse.x = event.touches[0].clientX;
        mouse.y = event.touches[0].clientY;
        mouse.active = true;
        mouse.moved = true;
      }
    });

    // 触摸结束时复位涡旋，避免残留在屏幕边缘
    window.addEventListener('touchend', function () {
      mouse.active = false;
    });
    window.addEventListener('touchcancel', function () {
      mouse.active = false;
    });

    // 尊重系统"减少动态效果"设置
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      CONFIG.reducedMotion = true;
    }

    function animate(now) {
      var dt = Math.min((now - lastTime) / 1000, 0.05); // 防止切后台后 dt 过大
      lastTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 涡旋状态机：光标停止移动后，在其静止位置渐入涡旋；
      // 一旦光标重新移动，涡旋立即渐出（移动中始终保持渐出，
      // 杜绝"边移动边转"的疯转效果）。
      if (mouse.active) {
        if (mouse.moved) {
          // 光标移动中：重置计时，涡旋渐出
          mouse.stillTime = 0;
          mouse.lastMoveTime = now;
          mouse.vortexIntensity = Math.max(0, mouse.vortexIntensity - VORTEX.fadeOutSpeed * dt);
          mouse.moved = false;
        } else {
          // 光标静止：累计静止时间
          mouse.stillTime += dt;
          // 渐出进行中时不做渐入（移动后的冷却）；静止达到阈值后渐入
          var sinceMove = (now - mouse.lastMoveTime) / 1000;
          if (sinceMove >= VORTEX.stillDelay && mouse.vortexIntensity < 1) {
            // 达到静止阈值：首次锁定涡旋中心为当前光标位置
            if (mouse.vortexIntensity <= 0.01) {
              mouse.vortexX = mouse.x;
              mouse.vortexY = mouse.y;
            }
            // 渐入涡旋
            mouse.vortexIntensity = Math.min(1, mouse.vortexIntensity + VORTEX.fadeInSpeed * dt);
          } else {
            // 还没到静止阈值：继续渐出（移动冷却期）
            mouse.vortexIntensity = Math.max(0, mouse.vortexIntensity - VORTEX.fadeOutSpeed * dt);
          }
        }
      } else {
        // 光标离开页面：涡旋渐出
        mouse.vortexIntensity = Math.max(0, mouse.vortexIntensity - VORTEX.fadeOutSpeed * dt);
      }

      if (!CONFIG.reducedMotion) {
        for (var i = 0; i < particles.length; i++) {
          particles[i].step(canvas, mouse, dt);
          particles[i].draw(ctx);
        }
      }

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  // 暴露到全局（页面直接内联引用，无模块系统）
  window.WindField = {
    init: initWindField,
    // 测试钩子：单测/视觉验证时可读取流场与涡旋
    _curlNoise: curlNoise,
    _perlinValue: perlinValue,
    _swirlVelocity: swirlVelocity
  };
})();
