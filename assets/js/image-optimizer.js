/**
 * 图片优化系统 - Image Optimization System
 * 提供图片懒加载、错误处理、占位符等功能
 */

class ImageOptimizer {
    constructor(options = {}) {
        this.options = {
            // 懒加载配置
            lazyLoad: true,
            rootMargin: '50px',
            threshold: 0.1,
            
            // 占位符配置
            placeholder: options.placeholder || this.generatePlaceholder(),
            showPlaceholder: true,
            
            // 错误处理配置
            retryCount: 3,
            retryDelay: 1000,
            
            // 预加载配置
            preloadImportant: true,
            
            ...options
        };
        
        this.observer = null;
        this.imageCache = new Map();
        this.loadingImages = new Set();
        
        this.init();
    }
    
    init() {
        // 初始化懒加载观察器
        if (this.options.lazyLoad && 'IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                this.handleIntersection.bind(this),
                {
                    rootMargin: this.options.rootMargin,
                    threshold: this.options.threshold
                }
            );
        }
        
        // 处理现有图片
        this.processExistingImages();
        
        // 监听DOM变化
        this.observeDOM();
    }
    
    generatePlaceholder() {
        // 生成SVG占位符
        const svg = `
            <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#grad)"/>
                <text x="50%" y="50%" text-anchor="middle" dy=".3em" 
                      font-family="Inter, sans-serif" font-size="14" fill="#9ca3af">
                    游戏图片
                </text>
                <circle cx="150" cy="80" r="20" fill="#d1d5db" opacity="0.5"/>
                <rect x="120" y="120" width="60" height="8" rx="4" fill="#d1d5db" opacity="0.3"/>
                <rect x="130" y="135" width="40" height="6" rx="3" fill="#d1d5db" opacity="0.2"/>
            </svg>
        `;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }
    
    processExistingImages() {
        const images = document.querySelectorAll('img[data-src], img[src*="onlinegames.io"]');
        images.forEach(img => this.processImage(img));
    }
    
    processImage(img) {
        // 添加错误处理
        this.addErrorHandling(img);
        
        // 添加加载状态
        this.addLoadingState(img);
        
        // 设置懒加载
        if (this.options.lazyLoad) {
            this.setupLazyLoad(img);
        } else {
            this.loadImage(img);
        }
    }
    
    addErrorHandling(img) {
        if (img.dataset.errorHandled) return;
        
        img.dataset.errorHandled = 'true';
        img.dataset.retryCount = '0';
        
        img.addEventListener('error', (e) => {
            this.handleImageError(img);
        });
        
        img.addEventListener('load', () => {
            this.handleImageLoad(img);
        });
    }
    
    addLoadingState(img) {
        // 添加加载状态样式
        img.style.transition = 'opacity 0.3s ease-in-out';
        
        // 如果还没有src，显示占位符
        if (!img.src || img.src === img.dataset.src) {
            if (this.options.showPlaceholder) {
                img.src = this.options.placeholder;
                img.style.opacity = '0.7';
            }
        }
    }
    
    setupLazyLoad(img) {
        if (!this.observer) {
            this.loadImage(img);
            return;
        }
        
        // 保存原始src到data-src
        if (img.src && !img.dataset.src && !img.src.startsWith('data:')) {
            img.dataset.src = img.src;
            if (this.options.showPlaceholder) {
                img.src = this.options.placeholder;
            }
        }
        
        this.observer.observe(img);
    }
    
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                this.loadImage(img);
                this.observer.unobserve(img);
            }
        });
    }
    
    async loadImage(img) {
        const src = img.dataset.src || img.src;
        if (!src || this.loadingImages.has(src)) return;
        
        this.loadingImages.add(src);
        
        try {
            // 检查缓存
            if (this.imageCache.has(src)) {
                this.applyImage(img, src);
                return;
            }
            
            // 预加载图片
            await this.preloadImage(src);
            this.imageCache.set(src, true);
            this.applyImage(img, src);
            
        } catch (error) {
            console.warn('图片加载失败:', src, error);
            this.handleImageError(img);
        } finally {
            this.loadingImages.delete(src);
        }
    }
    
    preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = src;
        });
    }
    
    applyImage(img, src) {
        img.src = src;
        img.style.opacity = '1';
        img.classList.add('loaded');
    }
    
    handleImageError(img) {
        const retryCount = parseInt(img.dataset.retryCount || '0');
        
        if (retryCount < this.options.retryCount) {
            // 重试加载
            img.dataset.retryCount = (retryCount + 1).toString();
            setTimeout(() => {
                this.loadImage(img);
            }, this.options.retryDelay * (retryCount + 1));
        } else {
            // 显示错误占位符
            this.showErrorPlaceholder(img);
        }
    }
    
    showErrorPlaceholder(img) {
        const errorSvg = `
            <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f9fafb" stroke="#e5e7eb" stroke-width="2"/>
                <text x="50%" y="45%" text-anchor="middle" dy=".3em" 
                      font-family="Inter, sans-serif" font-size="12" fill="#6b7280">
                    图片加载失败
                </text>
                <text x="50%" y="60%" text-anchor="middle" dy=".3em" 
                      font-family="Inter, sans-serif" font-size="10" fill="#9ca3af">
                    点击重试
                </text>
                <path d="M140 80 L160 80 M150 70 L150 90 M145 75 L155 75 M145 85 L155 85" 
                      stroke="#d1d5db" stroke-width="2" fill="none"/>
            </svg>
        `;
        
        img.src = `data:image/svg+xml;base64,${btoa(errorSvg)}`;
        img.style.opacity = '0.8';
        img.classList.add('error');
        
        // 添加点击重试功能
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
            img.dataset.retryCount = '0';
            img.classList.remove('error');
            img.style.cursor = 'default';
            this.loadImage(img);
        }, { once: true });
    }
    
    handleImageLoad(img) {
        img.style.opacity = '1';
        img.classList.add('loaded');
        img.classList.remove('loading');
    }
    
    observeDOM() {
        // 监听DOM变化，处理动态添加的图片
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        const images = node.tagName === 'IMG' ? [node] : 
                                     node.querySelectorAll ? node.querySelectorAll('img') : [];
                        images.forEach(img => this.processImage(img));
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // 预加载重要图片
    preloadImportantImages() {
        const importantImages = document.querySelectorAll('img[data-priority="high"]');
        importantImages.forEach(img => {
            const src = img.dataset.src || img.src;
            if (src) {
                this.preloadImage(src).catch(() => {});
            }
        });
    }
    
    // 公共API
    refresh() {
        this.processExistingImages();
    }
    
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    window.imageOptimizer = new ImageOptimizer();
});

// 导出供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageOptimizer;
}
