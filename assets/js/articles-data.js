/**
 * articles-data.js — 全站文章数据（中英双语富文本）
 * 内容来自旧版文章页面，英文拼写/语法已修正。
 * 所有 HTML 均为本站静态可信数据，通过 innerHTML 渲染。
 */
window.ARTICLES_DATA = [
  {
    id: 'seattle-electricity',
    icon: '⚡️',
    title: {
      zh: '西雅图电力从何而来',
      en: "Where's Seattle Electricity Come From"
    },
    description: {
      zh: '用公开资料所制作的英文信息图（课程作业）',
      en: 'Infographic made from open sources (course assignment)'
    },
    date: '2025-06-09',
    type: 'image', // 页内展示图片
    image: '文章/ECOLOGY INFOGRAPHIC.png'
  },
  {
    id: 'enso-bifurcation',
    icon: '📊',
    title: {
      zh: '分析具有延迟反馈的厄尔尼诺-南方涛动再充能振荡器的分叉现象',
      en: 'Analyzing the bifurcation of the ENSO replenishment oscillator with delayed feedback'
    },
    description: {
      zh: '对既往论文的复现与拓展（课程作业）',
      en: 'Reproduction and expansion of another paper (course assignment)'
    },
    date: '2024-10-28',
    type: 'pdf', // 新标签页打开 PDF
    pdf: '文章/383_Final_Project.pdf'
  },
  {
    id: 'atmospheric-river',
    icon: '🌊',
    title: {
      zh: '大气河',
      en: 'Atmospheric River'
    },
    description: {
      zh: '介绍大气河这一特殊自然现象，以及它带来的降水与影响',
      en: 'Introducing the atmospheric river phenomenon and the precipitation it brings'
    },
    date: '2024-02-15',
    type: 'text',
    body: {
      zh: [
        '2022 年 12 月中旬至 2023 年 1 月中旬，由于连续多日的暴雨，加利福尼亚州发生了特大洪水，造成大面积交通中断和停电，2,600 万人处于洪水警戒状态，而所有这些自然灾害都是由强大的大气河一手造成的。大气河是一种特殊的自然现象，可以从数千公里外输送水汽。大气河流的概念是由朱勇和雷金纳德·E·纽厄尔于 1994 年首次提出的，他们发现大气中存在一种细长的带状结构，其输水能力堪比亚马逊河。这太不可思议了！你能想象一条世界上排水量最大的河流从你头顶流过吗？这条天河让我居住的城市西雅图下了大约一周的雨！那一周，我不得不一直打着伞，所有有坡度的街道都变成了一条河流！',
        '根据美国国家海洋和大气管理局（NOAA）的数据，美国西海岸每年约有 30% 至 50% 的降水量是由大气河流事件造成的。大气河流将大量水汽从夏威夷一路输送到美国西海岸，造成卡斯卡特山脉和落基山脉西侧的暴雨。由于夏威夷地区盛产菠萝，所以这条大气河流有一个有趣的名字：菠萝快车。当人们意识到大气河流的重要性后，美国国家海洋和大气管理局开始对其进行研究和预测。1998 年，拉尔夫和他为国家海洋和大气管理局工作的研究团队飞入大气河以收集重要的气象数据。',
        '大气河事件同样导致了西雅图市西部的奥林匹克山区降下大雪。我在华盛顿大学西雅图分校了解到，奥林匹亚山项目的气象学家在奥林匹亚山上设立了气象观测站，以跟踪巨大的降水量，并与卫星数据进行比较。',
        '中国也有大气河事件，在副热带高压和南支槽的共同作用下，长江中下游地区经常出现"暴力梅雨"事件。例如，2021 年 7 月 20 日，郑州出现暴雨。据中国气象局统计，当日下午 4 时至 5 时降水量为 201.9 毫米，造成 292 人死亡。因此，大气河流已成为当今学术界重要的研究方向，在这个气候多变的世界，对大气河流发展的精确预测可以挽救更多的生命。'
      ],
      en: [
        'From mid-December 2022 to mid-January 2023, California experienced a huge flood due to consecutive days of heavy rain, causing widespread traffic disruptions and power outages, and twenty-six million people were under flood alert. All these natural disasters were caused by the strong atmospheric river, a special natural phenomenon that can transport water from thousands of kilometers away. The concept of an atmospheric river was first proposed by Yong Zhu and Reginald E. Newell in 1994, and they found that there is a long and thin ribbon structure in the atmosphere, whose water-carrying capacity can be compared to the Amazon River. That is incredible! Can you imagine a river with the highest discharge in the world flowing over your head? And this sky river made the city where I live, Seattle, rain for about a week! I had to carry an umbrella all the time that week, and the hilly streets turned into rivers.',
        'According to NOAA, about 30 to 50 percent of the annual precipitation on the West Coast of the United States is caused by atmospheric river events. The atmospheric river delivers a huge amount of moisture from Hawaii all the way to the west coast of the United States, causing heavy rains on the west side of the Cascades and the Rocky Mountains. Since the Hawaiian area produces pineapples, this atmospheric river has a funny name: the Pineapple Express. Once people realized the importance of atmospheric rivers, NOAA began researching and predicting them. In 1998, Ralph and his research team working for NOAA flew into the atmospheric river to collect important meteorological data.',
        'The atmospheric river also caused the Olympic Mountain areas on the west of Seattle to receive heavy snowfall. I learned in class that meteorologists in the OLYMPEX program set up meteorological observation stations on the Olympic Mountains to track the huge precipitation amount and compare it with the satellite data.',
        'The atmospheric river also occurs in China. Together with the subtropical high and the southern trough, it causes heavy rains in the middle and lower reaches of the Yangtze River. For example, Zhengzhou experienced heavy rainfall on July 20, 2021. According to the China Meteorological Administration, the precipitation from 4 p.m. to 5 p.m. on that day was 201.9 mm, causing 292 deaths. Therefore, the atmospheric river has become an important research direction nowadays, and precise prediction of the development of the atmospheric river could save more lives in this climate-changing world.'
      ],
      images: [
        { src: '文章/大气河.png', captionZh: '2023 年 12 月 5 日大气河事件卫星图片（图源 Windy.com）', captionEn: 'Satellite picture of an atmospheric river on 5 Dec. 2023 (From Windy.com)' },
        { src: '文章/大气河850hPa.png', captionZh: '2023 年 12 月 5 日大气河事件 850hPa 云中水汽含量（图源 EarthNullSchool）', captionEn: 'Cloud moisture on 850hPa of the atmospheric river on 5 Dec. 2023 (From EarthNullSchool)' },
        { src: '文章/OLYMPEX.png', captionZh: '奥林匹亚山项目示意图', captionEn: 'The OLYMPEX program' }
      ]
    },
  },
  {
    id: 'weather-rumors',
    icon: '🔍',
    title: {
      zh: '天气谣言破谣',
      en: 'Weather Rumors'
    },
    description: {
      zh: '对一则春节期间天气谣言的简要科学分析（2020 年春节）',
      en: 'A brief scientific analysis of a weather rumor during the 2020 Spring Festival'
    },
    date: '2020-02-07',
    type: 'text',
    body: {
      zh: [
        '此文章是对以下谣言内容进行简要的科学分析并进行结论。',
        '谣言内容：紧急通知：成都将在 1 月 25 日出现暴雪，整个春节将处于极度寒冷的天气中，比 2008 年还要冷！以下是天气预报：1 月 25 日，雨夹雪，-1~2℃；1 月 26 日，雨夹雪，-1~0℃；1 月 27 日，雨夹雪，-3~0℃；1 月 28 日，大雪，-5~0℃；1 月 29 日，阵雪，-6~0℃。',
        '出现降水最普遍的原因有三，一是冷锋天气；二是暖锋天气；三是准静止锋。',
        '冷锋分为急性冷锋和缓行冷锋。从上面谣言言论可见从 2020 年 1 月 25 日至 2020 年 2 月 1 日会出现为期 8 天的降水过程，如此之长的降水时间只有冷锋中的缓行冷锋（或称为第一型冷锋）也许可以做到，不过缓行冷锋所带来的降水强度不大，但从谣言言论上来看，在 1 月 28 日会出现大雪天气，大雪是指 5 至 10 毫米的降水量，属于强对流天气，缓行冷锋不可能出现强降水天气。再看温度，温度从 1 月 25 日开始出现了小幅度下降，这符合缓行冷锋过境时的气温变化。在 1 月 28 日以后会出现气温一直低迷的情况，这也符合冷锋过境后的温度状况，只不过这段时间谣言言论指出，这段时间内会出现强降水，并且强降水持续，这并不符合任何冷锋过境时的天气（缓行冷锋过境后会出现高云，急行冷锋过境后会出现晴朗的天气）。由此，我们可以判断出，如此之长的强降水过程和持续低迷的气温并不是冷锋能达到的。',
        '之所以把暖锋天气考虑在内，是因为如谣言言论所述，2 月 1 日会出现一个很明显的升温过程，升温幅度（最高温）达到了 10 摄氏度，只有强劲的暖气团可以做到。如果是暖锋天气，在 2 月 1 日之前根据气温来看都处于冷气团控制下，是高压天气。但是在稳定的冷气团控制下（参考 1 月 28 日至 1 月 31 日的温度）怎么可能会出现强对流天气？并且持续时间非常长。这时，我们可以基本排除暖锋天气，并引出最有可能符合此天气类型的模型——准静止锋。',
        '准静止锋是当冷锋和暖锋实力相当时所形成的移动缓慢而呈静止状态的锋。如果准静止锋的坡度大、地面辐合强，暖气团就会极力地上升形成连续性强降水天气，前提是暖气团需要携带足够的水汽。这貌似符合谣言言论所述的降水过程，但是，其中有一个最大的因素会影响其降水——地形。众所周知，成都属于盆地，冷空气到达成都需要翻过秦岭，但是由于冷空气密度大，下沉很快，到达成都平原的冷空气已经削弱了不少。而暖气团到达成都需要翻过云贵高原，其势力也被削弱。所以，在成都并不可能出现坡度大的准静止锋面去形成持续性的强降水。虽在贵阳等地容易形成准静止锋面，但其特点是坡度小，因而也不会形成长时间的强对流天气，反而更容易形成锋面逆温产生冻雨。',
        '总而言之，从科学角度分析，此谣言漏洞百出，完全不可信。希望大家不信谣、不传谣！实时关注权威机构发布的天气动态。'
      ],
      en: [
        'This article is a brief scientific analysis and conclusion of the following rumor.',
        'Emergency Notice: A SNOWSTORM is expected in Chengdu on Jan 25th, and the entire Spring Festival will be under extremely cold weather, even colder than in 2008! Here is the forecast: Jan 25th, mixed rain and snow, -1~2℃; Jan 26th, mixed rain and snow, -1~0℃; Jan 27th, mixed rain and snow, -3~0℃; Jan 28th, heavy snow, -5~0℃; Jan 29th, snow shower, -6~0℃.',
        'Precipitation is an essential element of the earth\'s water cycle, and its occurrence is influenced by various meteorological factors. In meteorology, precipitation is defined as any form of water that falls from the atmosphere and reaches the ground. The three common reasons for precipitation are cold front weather, warm front weather, and quasi-stationary fronts.',
        'Cold fronts can be classified into acute and slow-moving types. In a cold front precipitation process, the long-lasting slow front is typical, whereas the slow-moving cold front brings about low-intensity precipitation. Heavy snow, which is categorized here as strong convective weather, is not possible during a slow-moving cold front. It is also worth noting that a cold front usually causes a decrease in temperature, which is consistent with the temperature change during the passage of a mild cold front. However, a long period of heavy precipitation and persistently low temperatures beyond the reach of a cold front may occur.',
        'On the other hand, a warm front is characterized by a significant warming trend, which can only be caused by a strong warm air mass. If it is a warm front, it will be under the control of a cold air mass according to the temperature until a high-pressure weather occurs. However, under the control of a stable cold air mass, how can severe convection weather occur for a long time? The answer is: it is impossible.',
        'Lastly, a quasi-stationary front is formed when a cold front and a warm front are equal in strength. The slope of the quasi-stationary front and the ground convergence are significant factors that determine the occurrence of continuous heavy precipitation. However, terrain also plays a role in affecting precipitation. For instance, it is impossible for a quasi-stationary front with a large slope to form continuous heavy precipitation in Chengdu due to its location in a basin. Although it is easy to form a quasi-stationary front in Guiyang, its characteristics make it less likely to form long-lasting strong convection weather. Therefore, it is crucial to keep an eye on weather updates released by authorities to avoid believing and spreading unreliable rumors.'
      ],
      images: [
        { src: '文章/谣言.png', captionZh: '谣言内容原文', captionEn: 'The original rumor content' }
      ]
    },
  },
  {
    id: 'inversion-layer',
    icon: '🌫️',
    title: {
      zh: '产生逆温层的原因',
      en: 'The Causes of the Inversion Layer'
    },
    description: {
      zh: '介绍形成逆温层的三个主要原因',
      en: 'Introducing three main causes of the formation of the inversion layer'
    },
    date: '2020-02-07',
    type: 'text',
    body: {
      zh: [
        '您是否见过一种称为冻雨的现象？这种灾害性天气是由所谓的逆温层引起的，该层是使温度反转的一层大气。在本文中，将讨论引起逆温层的 3 个原因。不过，还有其他原因导致这种现象。',
        '第一个是最常见的原因——晴空辐射。晚上天气晴朗时，由于地面原因，下垫面将迅速失去温度。但是在高层空气中散失热量的速度很慢，然后就出现了逆温层。随着时间的流逝，逆温层将从下垫面到对流层上层越来越宽。例如，由于逆温层在早上最宽，雾霾会在早晨集中，并阻碍空气扩散。因此，这成为在主要区域形成逆温层的最常见原因。',
        '第二个原因是锋面。当冷锋和暖锋形成准静止锋时，就会发生这种情况。这是因为冷空气的密度大，低于暖空气的密度。冷空气量和热空气量之间的过渡区将形成逆温层。例如，中国贵州总是形成逆温层，因为它的地形很容易让准静止锋产生。另外，锋面逆温是最容易引起冻雨的一个原因。',
        '最后一个因素是地形，尤其是盆地和山谷地区。冷空气将在夜间从山上滑落到低海拔地区，并在较低区域托举暖空气以形成地形逆温。科罗拉多大峡谷和美国西部通常具有这种逆温层。另外，在地形逆温过程中会形成山谷风。这种地形逆温在每个山谷和小盆地中都很常见。',
        '简而言之，以上三个原因就是逆温层的常见原因。当然，还有其他原因和条件来形成这种现象。'
      ],
      en: [
        'Have you ever heard of a phenomenon called freezing rain? This hazardous weather is caused by a layer of the atmosphere called the inversion layer, in which the temperature reverses with height. In this article, three causes of the inversion layer will be discussed. However, there are other factors that also contribute to this phenomenon.',
        'The first and most common cause is clear-sky radiative cooling. When the weather is clear at night, the ground quickly loses its heat due to its surface properties. However, the rate at which heat is dissipated in the upper atmosphere is much slower, resulting in the formation of an inversion layer. Over time, the inversion layer becomes wider from the surface to the upper troposphere. For instance, because the inversion layer is widest in the morning, fog and haze tend to concentrate and hinder air diffusion. This is why it is the most common cause of the inversion layer in major regions.',
        'The second cause is fronts. When a cold front and a warm front form a quasi-stationary front, an inversion layer occurs. This is because cold air is denser than warm air. The transition zone between the cold and warm air masses creates the inversion layer. For example, Guizhou province in China always has an inversion layer because the terrain there is easily conducive to quasi-stationary fronts. Additionally, front inversion is the most common cause of freezing rain.',
        'The last factor is terrain, especially in basins and valley areas. Cold air slides down mountains at night and uplifts warm air in lower elevations to form a terrain inversion. The Grand Canyon and the western United States typically have this type of inversion layer. Furthermore, valley winds form during terrain inversions. This type of terrain inversion is common in every valley and small basin.',
        'In summary, the three factors above are the common causes of the inversion layer. Of course, there are other reasons and conditions that also contribute to this phenomenon.'
      ],
      images: [
        { src: '文章/逆温层.png', captionZh: '逆温层示意图', captionEn: 'Schematic of the inversion layer' }
      ]
    },
  },
  {
    id: 'wind-sock',
    icon: '🪁',
    title: {
      zh: '风向袋的优势',
      en: 'The Advantages of Wind Socks'
    },
    description: {
      zh: '介绍风向袋在测量风方面的多重优势',
      en: 'Introducing the multiple advantages of wind socks in measuring wind'
    },
    date: '2020-02-08',
    type: 'text',
    body: {
      zh: [
        '如今，气象学在许多领域变得越来越重要，并且它们的设备也在不断发展，以测量更加准确的数据，以用于近来的气象和航空领域的研究或预测。风向袋是一种常用的测量风的设备，尤其是在机场，因为它具有许多优点，例如用途广泛、标志更清晰、经久耐用。',
        '首先，与风向指示器相比，风向袋具有多种用途。因为风向袋是一个袋子，当风通过时，袋子会沿相反的风向抬起。同时，袋子的角度将显示风的强度。例如，如果风向袋指向南方，并且袋子平坦，则风向为北，风速为 12 m/s。因此，许多地方正在使用此设备测量风。',
        '其次，由于风向袋很大且颜色醒目，因此在很远的距离内很清楚。风向袋的长度通常为 1.5 米，上面印有红色或白色，即使在夜间，由于反射带的缘故，在很大的距离内仍可以看到它。因此，机场经常使用风向袋来调查天气。',
        '第三，风向袋可靠耐用。风向袋是由疏水性材料制成的，这意味着即使外面正在下雨，风向袋仍然可以工作，并且不会生锈。另外，由于袋子很轻，因此它比其他材料更精确地测量风。这就是为什么风向袋可以使用很多年并且仍然可靠的原因。',
        '总之，风向袋是一种可靠、耐用的测量风的设备，在不同的方式和情况下也有许多应用。'
      ],
      en: [
        'Nowadays, meteorology is becoming increasingly important in many fields, and its equipment is constantly evolving to measure more accurate data for research or prediction in meteorology and aviation. The wind sock is a commonly used device to measure wind, especially at airports, because of its many advantages, such as versatility, clear markings, and durability.',
        'Firstly, compared to wind vanes, wind socks have multiple uses. As a bag-like device, when the wind passes through, the bag lifts in the opposite direction of the wind, and the angle of the bag indicates the wind strength. For example, if the wind sock points south and the bag is flat, the wind is blowing north with a speed of 12 m/s. Therefore, many places are using this device to measure wind.',
        'Secondly, because wind socks are large and brightly colored, they are clearly visible from a great distance. The length of a wind sock is typically 1.5 meters and it is printed in red or white, which can still be seen from a great distance even at night due to reflective strips. Therefore, airports often use wind socks to investigate weather.',
        'Thirdly, wind socks are reliable and durable. Wind socks are made of hydrophobic materials, which means that even if it is raining outside, wind socks can still function and will not rust. Additionally, because the bag is lightweight, it can measure wind more accurately than other materials. This is why wind socks can be used for many years and remain reliable.',
        'In conclusion, the wind sock is a reliable and durable device to measure wind, and it has many applications in different ways and situations.'
      ],
      images: [
        { src: '文章/风向袋.jpg', captionZh: '机场风向袋', captionEn: 'A wind sock at an airport' }
      ]
    },
  }
];
