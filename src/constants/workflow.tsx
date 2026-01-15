// Workflow 相关的常量与图标定义
import qwenLogo from '../assets/qwen.png';
import deepseekLogo from '../assets/deepseek.png';
import geminiLogo from '../assets/gemini.png';
import xaiLogo from '../assets/xai.svg';
import doubaoLogo from '../assets/doubao.png';

export const MODELS = [
  {
    id: 'qwen-flash',
    name: 'Qwen-Flash',
    vendor: 'Alibaba',
    color: '#8b5cf6',
    logo: qwenLogo,
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M12 2L4 21h16L12 2z" />
      </svg>
    ),
  },
  {
    id: 'deepseek-v3.2',
    name: 'DeepSeek-V3.2',
    vendor: 'DeepSeek',
    color: '#60a5fa',
    logo: deepseekLogo,
    icon: (
      <svg viewBox="0 0 1024 1024" className="w-4 h-4" fill="currentColor">
        <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" />
        <path d="M512 320c106 0 192 86 192 192s-86 192-192 192-192-86-192-192 86-192 192-192z" />
      </svg>
    ),
  },
  {
    id: 'deepseek-v3.2-thinking',
    name: 'DeepSeek-Think',
    vendor: 'DeepSeek',
    color: '#34d399',
    logo: deepseekLogo,
    icon: (
      <svg viewBox="0 0 1024 1024" className="w-4 h-4" fill="currentColor">
        <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" />
        <path d="M512 320c106 0 192 86 192 192s-86 192-192 192-192-86-192-192 86-192 192-192z" />
      </svg>
    ),
  },
  {
    id: 'qwen3-8b',
    name: 'Qwen3-8B',
    vendor: 'Alibaba',
    color: '#a78bfa',
    logo: qwenLogo,
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M12 2L4 21h16L12 2z" />
      </svg>
    ),
  },
  {
    id: 'gemini-3-flash-preview-search',
    name: 'Gemini-3',
    vendor: 'Google',
    color: '#4285f4',
    logo: geminiLogo,
    icon: null,
  },
  {
    id: 'grok-4-1-fast-reasoning',
    name: 'Grok-4',
    vendor: 'xAI',
    color: '#ffffff',
    logo: xaiLogo,
    icon: null,
  },
  {
    id: 'doubao-seed-1.8',
    name: 'Doubao-1.8',
    vendor: 'ByteDance',
    color: '#f43f5e',
    logo: doubaoLogo,
    icon: null,
  },
];

export const STYLE_CATEGORIES = [
  {
    name: '✨ 精选风格',
    styles: [
      {
        id: 'oil_painting_artistic',
        label: '🎨 诗意油画',
        description:
          '极具意境的艺术油画风格。注重要场景构图与宏大空间感，孤独人物剪影、广袤天地意象、光明与黑暗的对话，冷暖色调和谐对比，适合哲学、心理学、情感深度内容。',
        prompt:
          '诗意油画风格，宏大构图，极具空间感，细腻的油画笔触质感，空灵意境，细腻的色彩过渡与渐变，戏剧性的明暗对照法(Chiaroscuro)，冷暖色调和谐搭配，剪影式构图，深远的透视关系，点光源照明，柔和的边缘处理，梦幻诗意的氛围感，沉思内省的情绪表达，象征性的视觉语言，博物馆级艺术品质，厚重的颜料堆叠感',
      },
      {
        id: 'film_cinematic',
        label: '🎬 电影质感',
        description:
          '好莱坞电影级画面。真实摄影，强烈的景深、自然光感和胶片颗粒，适合剧情、悬疑、纪录片。',
        prompt:
          '电影级写实风格，真实摄影质感，35mm镜头，浅景深，自然光照，胶片颗粒感，专业调色，8k高清，电影场景',
      },
      {
        id: 'anime_shinkai',
        label: '🌤️ 新海诚风',
        description:
          '唯美治愈的日系动漫风格。强调光影、天空 render、细腻的云层和清新的色彩，适合治愈、情感、青春类内容。',
        prompt:
          '新海诚风格，高质量日系动漫画风，绚丽的色彩渲染，细腻的光影层次，镜头光晕效果，柔和的色彩过渡，高饱和度与高对比度结合，电影级景深，精细的纹理细节，治愈系色调，温暖的光线氛围，细腻的渐变处理',
      },
      {
        id: 'pixar_3d',
        label: '🧸 皮克斯 3D',
        description:
          '迪士尼/皮克斯动画电影质感。角色圆润可爱，材质细腻，暖色调打光，适合亲子、叙事、轻松娱乐类。',
        prompt:
          '皮克斯3D渲染风格，迪士尼动画风格，圆润的造型设计，Octane渲染，体积光照，柔和的材质纹理，次表面散射，暖色调照明，高饱和度色彩，3D卡通风格，细腻的质感表现',
      },
      {
        id: 'epic_impasto',
        label: '🖌️ 史诗厚涂',
        description:
          '结合3D结构与2D手绘质感。笔触厚重，光影戏剧性强，画面极具史诗感和故事张力，类似顶级欧美动画剧集。',
        prompt:
          '半写实3D动画风格，手绘纹理叠加，厚重的笔触质感，戏剧性电影级光影，强烈的明暗对比，风格化写实渲染，油画式色彩处理，体积雾效果，高保真材质，丰富的细节层次，史诗级氛围营造，顶级动画剧集美学标准',
      },
      {
        id: 'cel_shading',
        label: '🎨 赛璐璐风',
        description:
          '鲜明的色块，清晰的轮廓线，高饱和度色彩，典型的日系二次元插画风格，适合活力、明快的内容。',
        prompt:
          '赛璐璐渲染，日系动漫风格，平涂色块，清晰轮廓线，鲜艳色彩，硬阴影，2D动画风格，高质量插画，日式动漫美学',
      },
      {
        id: 'unreal_engine',
        label: '🎮 3A 游戏大作',
        description:
          '超写实游戏画面。极致的物理材质、光线追踪、动态天气，适合史诗、奇幻、动作类。',
        prompt:
          '虚幻引擎5渲染，3A游戏截图级画质，超写实，光线追踪，全局光照，精细纹理，8k分辨率，史诗奇幻风格',
      },
      {
        id: 'tech_commercial',
        label: '📱 科技广告',
        description:
          '苹果/大疆风格产品广告。极简干净背景，冷色调，强调产品细节和高级感，适合数码、评测、科技资讯。',
        prompt:
          '高科技商业广告风格，苹果美学，干净简洁的背景，影棚布光，锐利焦点，极简主义，产品摄影，精致设计，8k高清',
      },
      {
        id: 'documentary',
        label: '📹 纪实摄影',
        description:
          '真实新闻/纪录片风格。自然光，手持摄影感，强调真实性和临场感，适合新闻资讯、生活记录、Vlog。',
        prompt:
          '纪实摄影风格，原始真实感，自然光照，35mm胶片拍摄感，抓拍瞬间，轻微运动模糊，街头摄影风格',
      },
      {
        id: 'fashion_studio',
        label: '💃 时尚大片',
        description:
          '高端商业摄影。影棚布光，高对比度，干净利落，强调主体质感，适合美妆、时尚、产品展示。',
        prompt:
          '高端时尚摄影，影棚专业布光，干净简洁背景，锐利焦点，专业调色，时尚杂志风格，商业广告级',
      },
      {
        id: 'anime_retro',
        label: '📼 90s 复古动漫',
        description:
          '90年代赛璐璐风格。线条硬朗，赛博朋克或粉彩配色，适合怀旧、蒸汽波、情绪类内容。',
        prompt:
          '90年代复古动漫风格，赛璐璐着色，VHS故障特效，霓虹色彩，美少女战士美学，EVA风格，Lo-Fi氛围',
      },
      {
        id: 'chinese_ink',
        label: '🖌️ 水墨国风',
        description:
          '中国传统水墨画意境。留白、墨色晕染、山水意象，适合历史、古风、文化传播类。',
        prompt:
          '中国传统水墨画风格，水彩晕染，空灵意境，墨色渲染，极简留白，禅意美学，书法笔触',
      },
      {
        id: 'cyberpunk',
        label: '🌆 赛博朋克',
        description:
          '未来科幻。高对比度霓虹色（紫/青），雨夜城市，机械元素，适合科技、游戏、未来话题。',
        prompt:
          '赛博朋克霓虹风格，高对比度色彩，紫青色调主导，强烈的霓虹发光效果，湿润反射质感，雾气与光束，银翼杀手美学，科幻概念艺术风格，暗调高光处理，电子光晕，未来科技质感',
      },
      {
        id: 'claymation',
        label: '🧱 黏土动画',
        description:
          '手工黏土定格动画。有指纹痕迹和材质感，笨拙可爱，适合创意短片、手工DIY内容。',
        prompt:
          '黏土动画风格，手工质感，定格动画美学，柔和影棚灯光，橡皮泥材质，指纹细节，阿德曼动画风格',
      },
    ],
  },
];
