/**
 * 图片预加载系统
 * 智能预加载重要图片，提升用户体验
 */

class ImagePreloader {
    constructor(options = {}) {
        this.options = {
            // 预加载策略
            strategy: 'smart', // 'aggressive', 'smart', 'conservative'
            maxConcurrent: 3, // 最大并发预加载数
            priority: ['high', 'medium', 'low'],
            
            // 网络适配
            adaptToConnection: true,
            
            // 缓存设置
            cacheSize: 50,
            cacheExpiry: 30 * 60 * 1000, // 30分钟
            
            ...options
        };
        
        this.preloadQueue = [];
        this.preloadCache = new Map();
        this.activePreloads = new Set();
        this.networkInfo = this.getNetworkInfo();
        
        this.init();
    }
    
    init() {
        this.adaptStrategy();
        this.setupEventListeners();
        this.startPreloading();
    }
    
    getNetworkInfo() {
        if ('connection' in navigator) {
            const conn = navigator.connection;
            return {
                effectiveType: conn.effectiveType,
                downlink: conn.downlink,
                rtt: conn.rtt,
                saveData: conn.saveData
            };
        }
        return { effectiveType: '4g', downlink: 10, rtt: 100, saveData: false };
    }
    
    adaptStrategy() {
        const { effectiveType, saveData } = this.networkInfo;
        
        if (saveData) {
            this.options.strategy = 'conservative';
            this.options.maxConcurrent = 1;
        } else if (effectiveType === 'slow-2g' || effectiveType === '2g') {
            this.options.strategy = 'conservative';
            this.options.maxConcurrent = 1;
        } else if (effectiveType === '3g') {
            this.options.strategy = 'smart';
            this.options.maxConcurrent = 2;
        } else {
            this.options.strategy = 'smart';
            this.options.maxConcurrent = 3;
        }
        
        console.log(`预加载策略: ${this.options.strategy}, 并发数: ${this.options.maxConcurrent}`);
    }
    
    setupEventListeners() {
        // 监听网络变化
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', () => {
                this.networkInfo = this.getNetworkInfo();
                this.adaptStrategy();
            });
        }
        
        // 监听页面可见性
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pausePreloading();
            } else {
                this.resumePreloading();
            }
        });
        
        // 监听鼠标悬停，预加载相关图片
        this.setupHoverPreload();
    }
    
    setupHoverPreload() {
        document.addEventListener('mouseover', (e) => {
            const gameCard = e.target.closest('.game-card');
            if (gameCard) {
                this.preloadRelatedImages(gameCard);
            }
        });
    }
    
    preloadRelatedImages(gameCard) {
        // 预加载同类游戏的图片
        const category = this.extractCategory(gameCard);
        const relatedCards = document.querySelectorAll(`.game-card[data-category="${category}"]`);
        
        relatedCards.forEach((card, index) => {
            if (index < 3) { // 只预加载前3个相关图片
                const img = card.querySelector('img[data-src]');
                if (img) {
                    this.addToQueue(img.dataset.src, 'medium');
                }
            }
        });
    }
    
    extractCategory(gameCard) {
        const categoryElement = gameCard.querySelector('.text-sm');
        return categoryElement ? categoryElement.textContent.trim() : 'unknown';
    }
    
    addToQueue(src, priority = 'low') {
        if (!src || this.preloadCache.has(src) || this.isInQueue(src)) {
            return;
        }
        
        const item = {
            src,
            priority,
            timestamp: Date.now(),
            retries: 0
        };
        
        // 根据优先级插入队列
        const priorityIndex = this.options.priority.indexOf(priority);
        let insertIndex = this.preloadQueue.length;
        
        for (let i = 0; i < this.preloadQueue.length; i++) {
            const itemPriority = this.options.priority.indexOf(this.preloadQueue[i].priority);
            if (priorityIndex < itemPriority) {
                insertIndex = i;
                break;
            }
        }
        
        this.preloadQueue.splice(insertIndex, 0, item);
        this.processQueue();
    }
    
    isInQueue(src) {
        return this.preloadQueue.some(item => item.src === src) || this.activePreloads.has(src);
    }
    
    async processQueue() {
        while (this.preloadQueue.length > 0 && this.activePreloads.size < this.options.maxConcurrent) {
            const item = this.preloadQueue.shift();
            this.preloadImage(item);
        }
    }
    
    async preloadImage(item) {
        const { src, priority } = item;
        
        if (this.activePreloads.has(src)) {
            return;
        }
        
        this.activePreloads.add(src);
        
        try {
            const startTime = performance.now();
            await this.loadImage(src);
            const loadTime = performance.now() - startTime;
            
            // 缓存成功加载的图片
            this.preloadCache.set(src, {
                timestamp: Date.now(),
                loadTime,
                priority
            });
            
            console.log(`预加载成功: ${src} (${loadTime.toFixed(2)}ms)`);
            
            // 清理过期缓存
            this.cleanCache();
            
        } catch (error) {
            console.warn(`预加载失败: ${src}`, error);
            
            // 重试机制
            if (item.retries < 2) {
                item.retries++;
                setTimeout(() => {
                    this.preloadQueue.unshift(item);
                    this.processQueue();
                }, 1000 * (item.retries + 1));
            }
        } finally {
            this.activePreloads.delete(src);
            this.processQueue();
        }
    }
    
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            const timeout = setTimeout(() => {
                reject(new Error('预加载超时'));
            }, 10000); // 10秒超时
            
            img.onload = () => {
                clearTimeout(timeout);
                resolve(img);
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('图片加载失败'));
            };
            
            img.src = src;
        });
    }
    
    cleanCache() {
        const now = Date.now();
        const expiredKeys = [];
        
        for (const [key, value] of this.preloadCache.entries()) {
            if (now - value.timestamp > this.options.cacheExpiry) {
                expiredKeys.push(key);
            }
        }
        
        expiredKeys.forEach(key => this.preloadCache.delete(key));
        
        // 如果缓存过大，删除最旧的条目
        if (this.preloadCache.size > this.options.cacheSize) {
            const entries = Array.from(this.preloadCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            const toDelete = entries.slice(0, entries.length - this.options.cacheSize);
            toDelete.forEach(([key]) => this.preloadCache.delete(key));
        }
    }
    
    startPreloading() {
        // 预加载首屏重要图片
        this.preloadViewportImages();
        
        // 预加载高优先级图片
        this.preloadHighPriorityImages();
        
        // 根据策略预加载更多图片
        if (this.options.strategy === 'aggressive') {
            this.preloadAllVisibleImages();
        }
    }
    
    preloadViewportImages() {
        const viewportHeight = window.innerHeight;
        const images = document.querySelectorAll('img[data-src]');
        
        images.forEach(img => {
            const rect = img.getBoundingClientRect();
            if (rect.top < viewportHeight * 1.5) { // 1.5倍视口高度内
                this.addToQueue(img.dataset.src, 'high');
            }
        });
    }
    
    preloadHighPriorityImages() {
        const highPriorityImages = document.querySelectorAll('img[data-priority="high"]');
        highPriorityImages.forEach(img => {
            if (img.dataset.src) {
                this.addToQueue(img.dataset.src, 'high');
            }
        });
    }
    
    preloadAllVisibleImages() {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            this.addToQueue(img.dataset.src, 'low');
        });
    }
    
    pausePreloading() {
        this.paused = true;
    }
    
    resumePreloading() {
        this.paused = false;
        this.processQueue();
    }
    
    // 公共API
    preload(src, priority = 'medium') {
        this.addToQueue(src, priority);
    }
    
    isPreloaded(src) {
        return this.preloadCache.has(src);
    }
    
    getStats() {
        return {
            cacheSize: this.preloadCache.size,
            queueLength: this.preloadQueue.length,
            activePreloads: this.activePreloads.size,
            strategy: this.options.strategy
        };
    }
    
    destroy() {
        this.preloadQueue = [];
        this.preloadCache.clear();
        this.activePreloads.clear();
    }
}

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    window.imagePreloader = new ImagePreloader();
});

// 导出供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImagePreloader;
}
