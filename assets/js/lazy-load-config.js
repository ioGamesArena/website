/**
 * 懒加载配置和增强功能
 * 为不同页面提供定制化的懒加载配置
 */

// 懒加载配置选项
const lazyLoadConfigs = {
    // 主页配置 - 更激进的预加载
    homepage: {
        lazyLoad: true,
        rootMargin: '100px', // 提前100px开始加载
        threshold: 0.1,
        preloadImportant: true,
        retryCount: 3,
        retryDelay: 1000,
        showPlaceholder: true
    },
    
    // 分类页面配置 - 平衡性能和体验
    category: {
        lazyLoad: true,
        rootMargin: '50px',
        threshold: 0.1,
        preloadImportant: false,
        retryCount: 2,
        retryDelay: 1500,
        showPlaceholder: true
    },
    
    // 游戏页面配置 - 快速加载
    game: {
        lazyLoad: false, // 游戏页面图片较少，直接加载
        preloadImportant: true,
        retryCount: 3,
        retryDelay: 800,
        showPlaceholder: true
    }
};

// 检测页面类型
function detectPageType() {
    const path = window.location.pathname;
    
    if (path === '/' || path.endsWith('/index.html')) {
        return 'homepage';
    } else if (path.includes('/categories/')) {
        return 'category';
    } else if (path.includes('/games/')) {
        return 'game';
    }
    
    return 'homepage'; // 默认配置
}

// 获取当前页面的配置
function getCurrentConfig() {
    const pageType = detectPageType();
    return lazyLoadConfigs[pageType];
}

// 初始化懒加载
function initializeLazyLoad() {
    const config = getCurrentConfig();
    
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setupLazyLoad(config);
        });
    } else {
        setupLazyLoad(config);
    }
}

function setupLazyLoad(config) {
    // 创建图片优化器实例
    if (window.ImageOptimizer) {
        window.gameImageOptimizer = new window.ImageOptimizer(config);
        
        // 预加载重要图片
        if (config.preloadImportant) {
            setTimeout(() => {
                window.gameImageOptimizer.preloadImportantImages();
            }, 500);
        }
        
        console.log('图片懒加载已启用，配置:', config);
    } else {
        console.warn('ImageOptimizer未找到，使用原生懒加载');
        enableNativeLazyLoad();
    }
}

// 原生懒加载备用方案
function enableNativeLazyLoad() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.remove('loading');
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px',
            threshold: 0.1
        });
        
        images.forEach(img => observer.observe(img));
    } else {
        // 不支持IntersectionObserver的浏览器，直接加载所有图片
        images.forEach(img => {
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.classList.remove('loading');
                img.classList.add('loaded');
            }
        });
    }
}

// 性能监控
function monitorImagePerformance() {
    if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (entry.initiatorType === 'img') {
                    console.log(`图片加载: ${entry.name}, 耗时: ${entry.duration.toFixed(2)}ms`);
                }
            });
        });
        
        observer.observe({ entryTypes: ['resource'] });
    }
}

// 网络状态适配
function adaptToNetworkCondition() {
    if ('connection' in navigator) {
        const connection = navigator.connection;
        const effectiveType = connection.effectiveType;
        
        // 根据网络状况调整配置
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
            // 慢网络：减少预加载，增加懒加载距离
            lazyLoadConfigs.homepage.rootMargin = '20px';
            lazyLoadConfigs.homepage.preloadImportant = false;
            lazyLoadConfigs.category.rootMargin = '10px';
        } else if (effectiveType === '4g') {
            // 快网络：增加预加载
            lazyLoadConfigs.homepage.rootMargin = '200px';
            lazyLoadConfigs.homepage.preloadImportant = true;
        }
        
        console.log(`网络状况: ${effectiveType}, 已调整懒加载配置`);
    }
}

// 内存使用监控
function monitorMemoryUsage() {
    if ('memory' in performance) {
        const memory = performance.memory;
        const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
        const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
        
        console.log(`内存使用: ${usedMB}MB / ${totalMB}MB`);
        
        // 如果内存使用过高，禁用预加载
        if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
            console.warn('内存使用过高，禁用图片预加载');
            if (window.gameImageOptimizer) {
                window.gameImageOptimizer.options.preloadImportant = false;
            }
        }
    }
}

// 页面可见性变化处理
function handleVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // 页面隐藏时暂停图片加载
            if (window.gameImageOptimizer && window.gameImageOptimizer.observer) {
                window.gameImageOptimizer.observer.disconnect();
            }
        } else {
            // 页面显示时恢复图片加载
            if (window.gameImageOptimizer) {
                window.gameImageOptimizer.refresh();
            }
        }
    });
}

// 初始化所有功能
function initialize() {
    adaptToNetworkCondition();
    initializeLazyLoad();
    handleVisibilityChange();
    
    // 开发环境下启用性能监控
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
        monitorImagePerformance();
        setInterval(monitorMemoryUsage, 10000); // 每10秒检查一次内存
    }
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

// 导出配置供其他脚本使用
window.lazyLoadConfigs = lazyLoadConfigs;
window.getCurrentLazyLoadConfig = getCurrentConfig;
