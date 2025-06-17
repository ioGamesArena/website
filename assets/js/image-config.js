/**
 * 图片优化统一配置
 * 集中管理所有图片相关的配置和设置
 */

// 图片源配置
const IMAGE_SOURCES = {
    primary: 'https://www.onlinegames.io/media/posts/',
    fallback: [
        'https://cdn.onlinegames.io/media/posts/',
        'https://images.onlinegames.io/media/posts/'
    ],
    local: './assets/images/thumbnails/'
};

// 图片质量配置
const IMAGE_QUALITY = {
    thumbnail: {
        width: 300,
        height: 200,
        quality: 80,
        format: 'webp,jpg'
    },
    preview: {
        width: 600,
        height: 400,
        quality: 85,
        format: 'webp,jpg'
    },
    full: {
        width: 1200,
        height: 800,
        quality: 90,
        format: 'webp,jpg'
    }
};

// 占位符配置
const PLACEHOLDER_CONFIG = {
    // 默认占位符
    default: generatePlaceholder('游戏图片', '#f3f4f6', '#9ca3af'),
    
    // 加载中占位符
    loading: generatePlaceholder('加载中...', '#e5e7eb', '#6b7280'),
    
    // 错误占位符
    error: generatePlaceholder('加载失败', '#fef2f2', '#ef4444'),
    
    // 分类特定占位符
    action: generatePlaceholder('动作游戏', '#fef3c7', '#f59e0b'),
    puzzle: generatePlaceholder('益智游戏', '#ddd6fe', '#8b5cf6'),
    racing: generatePlaceholder('竞速游戏', '#fecaca', '#ef4444'),
    sports: generatePlaceholder('体育游戏', '#bbf7d0', '#10b981'),
    strategy: generatePlaceholder('策略游戏', '#bfdbfe', '#3b82f6'),
    casual: generatePlaceholder('休闲游戏', '#fed7d7', '#f687b3')
};

// 生成SVG占位符
function generatePlaceholder(text, bgColor = '#f3f4f6', textColor = '#9ca3af') {
    const svg = `
        <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad-${Date.now()}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${adjustColor(bgColor, -10)};stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grad-${Date.now()})" rx="8"/>
            <text x="50%" y="50%" text-anchor="middle" dy=".3em" 
                  font-family="Inter, sans-serif" font-size="14" fill="${textColor}">
                ${text}
            </text>
            <circle cx="150" cy="80" r="15" fill="${textColor}" opacity="0.3"/>
            <rect x="120" y="120" width="60" height="6" rx="3" fill="${textColor}" opacity="0.2"/>
            <rect x="130" y="135" width="40" height="4" rx="2" fill="${textColor}" opacity="0.1"/>
        </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// 颜色调整工具函数
function adjustColor(color, amount) {
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);
    let r = (num >> 16) + amount;
    let g = (num >> 8 & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    r = r > 255 ? 255 : r < 0 ? 0 : r;
    g = g > 255 ? 255 : g < 0 ? 0 : g;
    b = b > 255 ? 255 : b < 0 ? 0 : b;
    return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}

// 性能配置
const PERFORMANCE_CONFIG = {
    // 懒加载配置
    lazyLoad: {
        rootMargin: '50px',
        threshold: 0.1,
        enableOnSlowConnection: true
    },
    
    // 预加载配置
    preload: {
        maxConcurrent: 3,
        priorityImages: 8,
        hoverDelay: 200
    },
    
    // 缓存配置
    cache: {
        maxSize: 50,
        expiry: 30 * 60 * 1000, // 30分钟
        enableServiceWorker: true
    },
    
    // 重试配置
    retry: {
        maxAttempts: 3,
        delay: 1000,
        backoffMultiplier: 2
    }
};

// 网络适配配置
const NETWORK_CONFIG = {
    'slow-2g': {
        lazyLoad: { rootMargin: '10px', threshold: 0.05 },
        preload: { maxConcurrent: 1, priorityImages: 3 },
        quality: 'low'
    },
    '2g': {
        lazyLoad: { rootMargin: '20px', threshold: 0.1 },
        preload: { maxConcurrent: 1, priorityImages: 4 },
        quality: 'low'
    },
    '3g': {
        lazyLoad: { rootMargin: '50px', threshold: 0.1 },
        preload: { maxConcurrent: 2, priorityImages: 6 },
        quality: 'medium'
    },
    '4g': {
        lazyLoad: { rootMargin: '100px', threshold: 0.1 },
        preload: { maxConcurrent: 3, priorityImages: 8 },
        quality: 'high'
    }
};

// 设备适配配置
const DEVICE_CONFIG = {
    mobile: {
        imageSize: 'thumbnail',
        lazyLoad: { rootMargin: '30px' },
        preload: { maxConcurrent: 2 }
    },
    tablet: {
        imageSize: 'preview',
        lazyLoad: { rootMargin: '50px' },
        preload: { maxConcurrent: 3 }
    },
    desktop: {
        imageSize: 'preview',
        lazyLoad: { rootMargin: '100px' },
        preload: { maxConcurrent: 4 }
    }
};

// 获取当前设备类型
function getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
}

// 获取网络类型
function getNetworkType() {
    if ('connection' in navigator) {
        return navigator.connection.effectiveType || '4g';
    }
    return '4g';
}

// 获取适配后的配置
function getAdaptiveConfig() {
    const deviceType = getDeviceType();
    const networkType = getNetworkType();
    
    const baseConfig = { ...PERFORMANCE_CONFIG };
    const networkConfig = NETWORK_CONFIG[networkType] || NETWORK_CONFIG['4g'];
    const deviceConfig = DEVICE_CONFIG[deviceType] || DEVICE_CONFIG['desktop'];
    
    // 合并配置
    return {
        ...baseConfig,
        lazyLoad: { ...baseConfig.lazyLoad, ...networkConfig.lazyLoad, ...deviceConfig.lazyLoad },
        preload: { ...baseConfig.preload, ...networkConfig.preload, ...deviceConfig.preload },
        imageSize: deviceConfig.imageSize,
        quality: networkConfig.quality
    };
}

// 图片URL构建器
function buildImageUrl(gameId, size = 'thumbnail', format = 'jpg') {
    const sizeConfig = IMAGE_QUALITY[size] || IMAGE_QUALITY.thumbnail;
    const primaryUrl = `${IMAGE_SOURCES.primary}${gameId}/responsive/${gameId}-xs.${format}`;
    
    return {
        primary: primaryUrl,
        fallbacks: IMAGE_SOURCES.fallback.map(source => 
            `${source}${gameId}/responsive/${gameId}-xs.${format}`
        ),
        local: `${IMAGE_SOURCES.local}${gameId}.${format}`
    };
}

// 根据游戏类别获取占位符
function getPlaceholderByCategory(category) {
    const categoryKey = category.toLowerCase().replace(/[^a-z]/g, '');
    return PLACEHOLDER_CONFIG[categoryKey] || PLACEHOLDER_CONFIG.default;
}

// 导出配置
window.ImageConfig = {
    SOURCES: IMAGE_SOURCES,
    QUALITY: IMAGE_QUALITY,
    PLACEHOLDERS: PLACEHOLDER_CONFIG,
    PERFORMANCE: PERFORMANCE_CONFIG,
    NETWORK: NETWORK_CONFIG,
    DEVICE: DEVICE_CONFIG,
    
    // 工具函数
    getAdaptiveConfig,
    buildImageUrl,
    getPlaceholderByCategory,
    getDeviceType,
    getNetworkType
};

// 自动应用配置
document.addEventListener('DOMContentLoaded', () => {
    const config = getAdaptiveConfig();
    console.log('图片优化配置已加载:', config);
    
    // 应用设备特定的CSS类
    document.body.classList.add(`device-${getDeviceType()}`);
    document.body.classList.add(`network-${getNetworkType()}`);
    
    // 监听网络变化
    if ('connection' in navigator) {
        navigator.connection.addEventListener('change', () => {
            const newNetworkType = getNetworkType();
            document.body.className = document.body.className.replace(/network-\w+/, `network-${newNetworkType}`);
            console.log('网络状况变化:', newNetworkType);
        });
    }
    
    // 监听窗口大小变化
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const newDeviceType = getDeviceType();
            document.body.className = document.body.className.replace(/device-\w+/, `device-${newDeviceType}`);
        }, 250);
    });
});
