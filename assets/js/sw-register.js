/**
 * Service Worker 注册和管理
 * 注册图片缓存Service Worker
 */

class ServiceWorkerManager {
    constructor() {
        this.swRegistration = null;
        this.isSupported = 'serviceWorker' in navigator;
        this.init();
    }
    
    async init() {
        if (!this.isSupported) {
            console.log('Service Worker 不被支持');
            return;
        }
        
        try {
            await this.register();
            this.setupEventListeners();
            console.log('Service Worker 管理器初始化完成');
        } catch (error) {
            console.error('Service Worker 初始化失败:', error);
        }
    }
    
    async register() {
        try {
            this.swRegistration = await navigator.serviceWorker.register('/sw-image-cache.js', {
                scope: '/'
            });
            
            console.log('Service Worker 注册成功:', this.swRegistration.scope);
            
            // 监听更新
            this.swRegistration.addEventListener('updatefound', () => {
                console.log('发现 Service Worker 更新');
                this.handleUpdate();
            });
            
        } catch (error) {
            console.error('Service Worker 注册失败:', error);
            throw error;
        }
    }
    
    setupEventListeners() {
        // 监听Service Worker状态变化
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker 控制器已更改');
            window.location.reload();
        });
        
        // 监听消息
        navigator.serviceWorker.addEventListener('message', (event) => {
            this.handleMessage(event);
        });
    }
    
    handleUpdate() {
        const newWorker = this.swRegistration.installing;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 新版本可用，询问用户是否更新
                this.showUpdateNotification();
            }
        });
    }
    
    showUpdateNotification() {
        // 创建更新通知
        const notification = document.createElement('div');
        notification.className = 'sw-update-notification';
        notification.innerHTML = `
            <div class="sw-notification-content">
                <p>发现新版本，是否立即更新？</p>
                <div class="sw-notification-buttons">
                    <button id="sw-update-btn" class="sw-btn-primary">更新</button>
                    <button id="sw-dismiss-btn" class="sw-btn-secondary">稍后</button>
                </div>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .sw-update-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                padding: 16px;
                z-index: 10000;
                max-width: 300px;
            }
            .sw-notification-content p {
                margin: 0 0 12px 0;
                font-size: 14px;
                color: #374151;
            }
            .sw-notification-buttons {
                display: flex;
                gap: 8px;
            }
            .sw-btn-primary, .sw-btn-secondary {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .sw-btn-primary {
                background: #3b82f6;
                color: white;
            }
            .sw-btn-primary:hover {
                background: #2563eb;
            }
            .sw-btn-secondary {
                background: #f3f4f6;
                color: #374151;
            }
            .sw-btn-secondary:hover {
                background: #e5e7eb;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        // 绑定事件
        document.getElementById('sw-update-btn').addEventListener('click', () => {
            this.applyUpdate();
            notification.remove();
        });
        
        document.getElementById('sw-dismiss-btn').addEventListener('click', () => {
            notification.remove();
        });
        
        // 10秒后自动消失
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }
    
    applyUpdate() {
        if (this.swRegistration && this.swRegistration.waiting) {
            this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
    }
    
    handleMessage(event) {
        const { type, data } = event.data;
        
        switch (type) {
            case 'CACHE_UPDATED':
                console.log('缓存已更新:', data);
                break;
            case 'CACHE_ERROR':
                console.warn('缓存错误:', data);
                break;
        }
    }
    
    // 预加载图片
    async preloadImages(urls) {
        if (!this.swRegistration || !this.swRegistration.active) {
            console.warn('Service Worker 未激活，无法预加载');
            return;
        }
        
        this.swRegistration.active.postMessage({
            type: 'PRELOAD_IMAGES',
            data: { urls }
        });
    }
    
    // 清理缓存
    async clearCache() {
        if (!this.swRegistration || !this.swRegistration.active) {
            console.warn('Service Worker 未激活，无法清理缓存');
            return;
        }
        
        this.swRegistration.active.postMessage({
            type: 'CLEAR_CACHE'
        });
    }
    
    // 获取缓存信息
    async getCacheInfo() {
        if (!this.swRegistration || !this.swRegistration.active) {
            return { cacheSize: 0, maxSize: 0, cacheExpiry: 0 };
        }
        
        return new Promise((resolve) => {
            const channel = new MessageChannel();
            
            channel.port1.onmessage = (event) => {
                resolve(event.data);
            };
            
            this.swRegistration.active.postMessage({
                type: 'GET_CACHE_INFO'
            }, [channel.port2]);
        });
    }
    
    // 检查Service Worker状态
    getStatus() {
        if (!this.isSupported) {
            return 'not-supported';
        }
        
        if (!this.swRegistration) {
            return 'not-registered';
        }
        
        if (this.swRegistration.active) {
            return 'active';
        }
        
        if (this.swRegistration.installing) {
            return 'installing';
        }
        
        if (this.swRegistration.waiting) {
            return 'waiting';
        }
        
        return 'unknown';
    }
}

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    window.swManager = new ServiceWorkerManager();
});

// 导出供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServiceWorkerManager;
}
