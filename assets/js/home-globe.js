import * as THREE from 'three';
import { OrbitControls } from '../vendor/three/OrbitControls.js';
import { SphericalWind, positionFromDegrees, windColor } from './home-wind.js';

const stage = document.getElementById('globe-stage');
const status = document.getElementById('globe-status');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const resources = new URL('../globe/', import.meta.url);
// Presentation settings, not atmospheric parameters. Every particle uses the same clock.
const TIME_SCALE = 24000;
const TRAIL_POINTS = 56;

async function fetchResource(filename, type) {
    const response = await fetch(new URL(filename, resources));
    if (!response.ok) {
        throw new Error('Could not load ' + filename + ' (' + response.status + ').');
    }
    if (type === 'json') {
        return response.json();
    }
    return response.arrayBuffer();
}

function buildWindTexture(field, maximum) {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 360;
    const context = canvas.getContext('2d');
    const pixels = context.createImageData(canvas.width, canvas.height);
    for (let row = 0; row < canvas.height; row += 1) {
        const latitude = 90 - (row + 0.5) * 180 / canvas.height;
        for (let column = 0; column < canvas.width; column += 1) {
            const longitude = -180 + (column + 0.5) * 360 / canvas.width;
            const velocity = field.sample(positionFromDegrees(longitude, latitude));
            if (velocity === null) {
                throw new Error('Wind texture contains an unfilled interpolation gap.');
            }
            const color = windColor(velocity.speed, maximum);
            const offset = (row * canvas.width + column) * 4;
            pixels.data[offset] = color[0];
            pixels.data[offset + 1] = color[1];
            pixels.data[offset + 2] = color[2];
            pixels.data[offset + 3] = 102;
        }
    }
    context.putImageData(pixels, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    // Terrain gaps are filled in the data; linear filtering keeps the overlay continuous.
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return texture;
}

function makeCoastline(data) {
    const positions = [];
    for (const feature of data.features) {
        let lines;
        if (feature.geometry.type === 'LineString') {
            lines = [feature.geometry.coordinates];
        } else if (feature.geometry.type === 'MultiLineString') {
            lines = feature.geometry.coordinates;
        } else {
            throw new Error('Unsupported coastline geometry.');
        }
        for (const line of lines) {
            for (let index = 1; index < line.length; index += 1) {
                const start = positionFromDegrees(line[index - 1][0], line[index - 1][1]);
                const end = positionFromDegrees(line[index][0], line[index][1]);
                positions.push(start.x * 1.003, start.y * 1.003, start.z * 1.003);
                positions.push(end.x * 1.003, end.y * 1.003, end.z * 1.003);
            }
        }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xc4e2ec, transparent: true, opacity: 0.32, depthWrite: false }));
}

function makeAtmosphere() {
    const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `
            varying vec3 surfaceNormal;
            varying vec3 viewPosition;
            void main() {
                vec4 positionInView = modelViewMatrix * vec4(position, 1.0);
                viewPosition = positionInView.xyz;
                surfaceNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * positionInView;
            }
        `,
        fragmentShader: `
            varying vec3 surfaceNormal;
            varying vec3 viewPosition;
            void main() {
                float rim = pow(1.0 - max(dot(normalize(surfaceNormal), normalize(-viewPosition)), 0.0), 3.0);
                gl_FragColor = vec4(0.22, 0.54, 0.82, rim * 0.36);
            }
        `
    });
    return new THREE.Mesh(new THREE.SphereGeometry(1.018, 96, 64), material);
}

function makeCityMarkers(scene, camera, configuration) {
    const markers = [];
    let activeMarker = null;
    let staticView = false;
    const card = document.createElement('section');
    card.id = 'city-card';
    card.className = 'city-card glass';
    card.hidden = true;
    card.setAttribute('aria-labelledby', 'city-card-title');
    const title = document.createElement('h2');
    title.id = 'city-card-title';
    const role = document.createElement('p');
    role.className = 'city-card-role';
    const description = document.createElement('p');
    description.className = 'city-card-description';
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'city-card-close';
    closeButton.textContent = '×';
    card.append(title, role, description, closeButton);
    // Keep the card above the overlapping profile glass without raising the globe.
    document.body.appendChild(card);

    function closeCard(restoreFocus) {
        if (activeMarker === null) {
            return;
        }
        const previousMarker = activeMarker;
        previousMarker.label.setAttribute('aria-expanded', 'false');
        activeMarker = null;
        card.hidden = true;
        if (restoreFocus) {
            previousMarker.label.focus({ preventScroll: true });
        }
    }

    function updateLanguage() {
        const language = window.getCurrentLang();
        for (const marker of markers) {
            let cityName = marker.city.name;
            let cityRole = marker.city.role;
            if (language === 'zh') {
                cityName = marker.city.nameZh;
                cityRole = marker.city.roleZh;
            }
            marker.label.lang = language;
            marker.name.textContent = cityName;
            marker.role.textContent = cityRole;
            marker.label.setAttribute('aria-label', cityName + ' · ' + cityRole);
        }
        card.lang = language;
        closeButton.setAttribute('aria-label', 'Close city introduction');
        if (language === 'zh') {
            closeButton.setAttribute('aria-label', '关闭城市介绍');
        }
        if (activeMarker !== null) {
            title.textContent = activeMarker.name.textContent;
            role.textContent = activeMarker.role.textContent;
            description.textContent = activeMarker.city.description[language];
        }
        update();
    }

    for (const city of configuration.cities) {
        const coordinate = positionFromDegrees(city.longitude, city.latitude);
        const normal = new THREE.Vector3(coordinate.x, coordinate.y, coordinate.z);
        let color = 0xf4d69a;
        if (city.name === 'Seattle') {
            color = 0xbce6ff;
        }
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.007, 12, 8), new THREE.MeshBasicMaterial({ color }));
        dot.position.copy(normal).multiplyScalar(1.015);
        scene.add(dot);
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.013, 0.016, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75, side: THREE.DoubleSide }));
        ring.position.copy(normal).multiplyScalar(1.013);
        ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        scene.add(ring);
        const label = document.createElement('button');
        label.type = 'button';
        label.className = 'city-label city-label--' + city.name.toLowerCase();
        label.setAttribute('aria-controls', card.id);
        label.setAttribute('aria-expanded', 'false');
        const text = document.createElement('span');
        text.className = 'city-label-text';
        const name = document.createElement('strong');
        const cityRole = document.createElement('small');
        text.append(name, cityRole);
        label.appendChild(text);
        stage.appendChild(label);
        const marker = { normal, label, name, role: cityRole, city };
        markers.push(marker);
        label.addEventListener('click', function () {
            if (activeMarker === marker) {
                closeCard(false);
                return;
            }
            closeCard(false);
            activeMarker = marker;
            label.setAttribute('aria-expanded', 'true');
            card.hidden = false;
            updateLanguage();
            closeButton.focus({ preventScroll: true });
        });
    }

    function update() {
        camera.updateMatrixWorld();
        const bounds = stage.getBoundingClientRect();
        for (const marker of markers) {
            // Perspective uses the tangent horizon; the static image is orthographic.
            let horizon = 1;
            let surfaceRadius = 1.015;
            if (staticView) {
                horizon = 0;
                surfaceRadius = 1;
            }
            const facing = marker.normal.dot(camera.position) > horizon;
            marker.label.hidden = !facing;
            if (!facing) {
                if (activeMarker === marker) {
                    closeCard(false);
                }
                continue;
            }
            const projected = marker.normal.clone().multiplyScalar(surfaceRadius).project(camera);
            const x = (projected.x * 0.5 + 0.5) * stage.clientWidth;
            const y = (-projected.y * 0.5 + 0.5) * stage.clientHeight;
            marker.label.style.transform = 'translate(' + (x - 22) + 'px, ' + (y - 22) + 'px)';
            if (activeMarker === marker) {
                const screenY = bounds.top + y;
                if (screenY < 0 || screenY > window.innerHeight) {
                    closeCard(false);
                    continue;
                }
                const maximumLeft = document.documentElement.clientWidth - card.offsetWidth - 16;
                const left = Math.max(16, Math.min(bounds.left + x - card.offsetWidth / 2, maximumLeft));
                const textHeight = marker.label.firstElementChild.offsetHeight;
                const top = Math.max(16, screenY - textHeight - 19 - card.offsetHeight);
                card.style.left = left + 'px';
                card.style.top = top + 'px';
            }
        }
    }

    function useStaticView() {
        closeCard(false);
        // Match the fallback renderer's 442 px radius on its 1000 px square.
        const halfExtent = 500 / 442;
        camera = new THREE.OrthographicCamera(-halfExtent, halfExtent, halfExtent, -halfExtent, 0.1, 30);
        const view = positionFromDegrees(configuration.view.longitude, configuration.view.latitude);
        camera.position.set(view.x * 3.35, view.y * 3.35, view.z * 3.35);
        camera.lookAt(0, 0, 0);
        staticView = true;
        stage.classList.add('is-static');
        update();
    }

    closeButton.addEventListener('click', function () { closeCard(true); });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && activeMarker !== null) {
            closeCard(true);
        }
    });
    document.addEventListener('pointerdown', function (event) {
        if (!card.contains(event.target) && !event.target.closest('.city-label, .language-btn')) {
            closeCard(false);
        }
    });
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.registerLanguageChangeHandler(updateLanguage);
    updateLanguage();
    return { update, useStaticView };
}

function makeParticles(field) {
    let count = 6400;
    if (window.matchMedia('(max-width: 760px)').matches) {
        count = 2800;
    }
    const particles = [];
    const segmentCount = count * (TRAIL_POINTS - 1);
    const positions = new Float32Array(segmentCount * 6);
    const alphas = new Float32Array(segmentCount * 2);
    const geometry = new THREE.BufferGeometry();
    const positionAttribute = new THREE.BufferAttribute(positions, 3);
    positionAttribute.setUsage(THREE.DynamicDrawUsage);
    const alphaAttribute = new THREE.BufferAttribute(alphas, 1);
    alphaAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', positionAttribute);
    geometry.setAttribute('trailAlpha', alphaAttribute);
    const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        vertexShader: `
            attribute float trailAlpha;
            varying float alpha;
            void main() {
                alpha = trailAlpha;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying float alpha;
            void main() { gl_FragColor = vec4(0.81, 0.94, 1.0, alpha); }
        `
    });
    const mesh = new THREE.LineSegments(geometry, material);
    mesh.frustumCulled = false;

    function resetParticle(particle, prefill) {
        let seed = null;
        while (seed === null) {
            const longitude = Math.random() * 360;
            const latitude = Math.asin(Math.random() * 2 - 1) * 180 / Math.PI;
            const candidate = positionFromDegrees(longitude, latitude);
            if (field.sample(candidate) !== null) {
                seed = candidate;
            }
        }
        particle.position = seed;
        particle.trail = [seed];
        particle.age = 0;
        // Staggered lifetimes keep valid areas populated; randomness never changes velocity.
        particle.lifetime = 6 + Math.random() * 6;
        if (prefill) {
            for (let index = 1; index < TRAIL_POINTS; index += 1) {
                const previous = field.advance(particle.trail[0], -TIME_SCALE / 60);
                if (previous === null) {
                    break;
                }
                particle.trail.unshift(previous);
            }
            particle.age = Math.random() * particle.lifetime;
        }
    }

    for (let index = 0; index < count; index += 1) {
        const particle = {};
        resetParticle(particle, true);
        particles.push(particle);
    }

    function update(seconds) {
        for (let index = 0; index < particles.length; index += 1) {
            const particle = particles[index];
            if (seconds > 0) {
                particle.age += seconds;
                const next = field.advance(particle.position, seconds * TIME_SCALE);
                if (next === null || particle.age >= particle.lifetime) {
                    resetParticle(particle, false);
                } else {
                    particle.position = next;
                    particle.trail.push(next);
                    if (particle.trail.length > TRAIL_POINTS) {
                        particle.trail.shift();
                    }
                }
            }
            const fade = Math.min(1, particle.age / 0.8, (particle.lifetime - particle.age) / 0.8);
            for (let segment = 0; segment < TRAIL_POINTS - 1; segment += 1) {
                const output = index * (TRAIL_POINTS - 1) + segment;
                const offset = output * 6;
                if (segment >= particle.trail.length - 1) {
                    alphas[output * 2] = 0;
                    alphas[output * 2 + 1] = 0;
                    continue;
                }
                const start = particle.trail[segment];
                const end = particle.trail[segment + 1];
                positions[offset] = start.x * 1.007;
                positions[offset + 1] = start.y * 1.007;
                positions[offset + 2] = start.z * 1.007;
                positions[offset + 3] = end.x * 1.007;
                positions[offset + 4] = end.y * 1.007;
                positions[offset + 5] = end.z * 1.007;
                alphas[output * 2] = fade * segment / TRAIL_POINTS * 0.8;
                alphas[output * 2 + 1] = fade * (segment + 1) / TRAIL_POINTS * 0.8;
            }
        }
        positionAttribute.needsUpdate = true;
        alphaAttribute.needsUpdate = true;
    }
    update(0);
    return { mesh, update };
}

async function initialize() {
    status.textContent = 'Loading interactive globe…';
    const metadata = await fetchResource('wind-500.json', 'json');
    const buffer = await fetchResource(metadata.binaryFile, 'buffer');
    if (metadata.pressureLevelHpa !== 500 || metadata.forecastHour !== 0 || metadata.grid.Ni !== 360 || metadata.grid.Nj !== 181 || metadata.units !== 'm/s') {
        throw new Error('The wind snapshot is not a supported 500 hPa GFS analysis.');
    }
    const field = new SphericalWind(metadata, buffer);
    const places = await fetchResource('places.json', 'json');
    const validDate = new Date(metadata.validTime);
    if (!Number.isFinite(validDate.getTime())) {
        throw new Error('The wind snapshot has an invalid valid time.');
    }
    document.getElementById('globe-time').textContent = validDate.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
    const maximum = metadata.speedRange[1];
    document.getElementById('legend-mid').textContent = (maximum / 2).toFixed(1);
    document.getElementById('legend-max').textContent = maximum.toFixed(1);
    document.getElementById('globe-source').href = metadata.inventoryUrl;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 30);
    const initialView = positionFromDegrees(places.view.longitude, places.view.latitude);
    camera.position.set(initialView.x * 3.35, initialView.y * 3.35, initialView.z * 3.35);
    camera.lookAt(0, 0, 0);
    const cities = makeCityMarkers(scene, camera, places);
    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (error) {
        status.classList.add('is-fallback');
        status.textContent = 'Static snapshot · WebGL unavailable; animation is disabled.';
        console.warn('Globe animation unavailable:', error);
        cities.useStaticView();
        return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-label', 'Interactive Earth with GFS 500 hPa wind. Chengdu: Hometown. Seattle: Undergraduate. Drag to rotate.');
    renderer.domElement.setAttribute('role', 'img');
    stage.appendChild(renderer.domElement);
    const loader = new THREE.TextureLoader();
    const [day, normal, coastline] = await Promise.all([
        loader.loadAsync(new URL('earth-day.jpg', resources).href),
        loader.loadAsync(new URL('earth-normal.jpg', resources).href),
        fetchResource('coastline.json', 'json')
    ]);
    day.colorSpace = THREE.SRGBColorSpace;
    day.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const earth = new THREE.Mesh(
        new THREE.SphereGeometry(1, 128, 96),
        new THREE.MeshPhongMaterial({ map: day, normalMap: normal, normalScale: new THREE.Vector2(0.65, 0.65), color: 0xb7c7d7, specular: 0x182431, shininess: 10 })
    );
    scene.add(earth);
    scene.add(new THREE.AmbientLight(0xd6e9ff, 1.5));
    const light = new THREE.DirectionalLight(0xffffff, 2.1);
    light.position.set(initialView.x * 4 - 2, initialView.y * 4 + 3, initialView.z * 4 + 1);
    scene.add(light);
    const windLayer = new THREE.Mesh(new THREE.SphereGeometry(1.0015, 128, 96), new THREE.MeshBasicMaterial({ map: buildWindTexture(field, maximum), transparent: true, depthWrite: false }));
    scene.add(windLayer);
    scene.add(makeCoastline(coastline));
    scene.add(makeAtmosphere());
    const particles = makeParticles(field);
    scene.add(particles.mesh);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = false;
    controls.autoRotate = false;
    // Let vertical touch gestures scroll the page; horizontal gestures rotate the globe.
    renderer.domElement.style.touchAction = 'pan-y';

    let visible = false;
    let contextLost = false;
    let frame = null;
    let previousTime = null;
    function draw() {
        cities.update();
        if (!contextLost) {
            renderer.render(scene, camera);
        }
    }
    function animate(time) {
        frame = null;
        if (contextLost || !visible || document.hidden || motionPreference.matches) {
            previousTime = null;
            return;
        }
        if (previousTime !== null) {
            // Cap resumed frame time; this affects the animation clock, not the wind data.
            const seconds = Math.min((time - previousTime) / 1000, 0.05);
            particles.update(seconds);
        }
        previousTime = time;
        draw();
        frame = requestAnimationFrame(animate);
    }
    function updateActivity() {
        if (frame !== null) {
            cancelAnimationFrame(frame);
            frame = null;
        }
        previousTime = null;
        if (contextLost) {
            cities.update();
            return;
        }
        status.textContent = 'Drag to rotate · Scroll to explore';
        if (motionPreference.matches) {
            status.textContent = 'Reduced motion · Wind animation paused; drag to rotate.';
        } else if (visible && !document.hidden) {
            frame = requestAnimationFrame(animate);
        }
        draw();
    }
    controls.addEventListener('change', draw);
    const observer = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        updateActivity();
    });
    observer.observe(stage);
    document.addEventListener('visibilitychange', updateActivity);
    motionPreference.addEventListener('change', updateActivity);
    const resize = new ResizeObserver(function () {
        const size = stage.clientWidth;
        renderer.setSize(size, size);
        camera.aspect = 1;
        camera.updateProjectionMatrix();
        draw();
    });
    resize.observe(stage);
    renderer.domElement.addEventListener('webglcontextlost', function (event) {
        event.preventDefault();
        contextLost = true;
        visible = false;
        cities.useStaticView();
        updateActivity();
        stage.classList.remove('is-ready');
        status.classList.add('is-fallback');
        status.textContent = 'Static snapshot · Graphics context lost; reload to resume animation.';
    });
    draw();
    stage.classList.add('is-ready');
    updateActivity();
}

initialize().catch(function (error) {
    status.textContent = 'Globe failed to load: ' + error.message;
    status.classList.add('is-error');
    console.error('Homepage globe:', error);
});
