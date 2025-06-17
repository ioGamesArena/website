/**
 * Service Worker for Image Caching
 * 为图片提供离线缓存和优化加载
 */

const CACHE_NAME = 'game-images-v1';
const IMAGE_CACHE_NAME = 'game-images-cache-v1';
const MAX_CACHE_SIZE = 50;
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7天

// 需要缓存的图片域名
const IMAGE_DOMAINS = [
    'www.onlinegames.io',
    'cdn.onlinegames.io',
    'images.onlinegames.io'
];

// 安装事件
self.addEventListener('install', (event) => {
    console.log('Service Worker 安装中...');
    self.skipWaiting();
});

// 激活事件
self.addEventListener('activate', (event) => {
    console.log('Service Worker 激活中...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
                        console.log('删除旧缓存:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // 只处理图片请求
    if (isImageRequest(request)) {
        event.respondWith(handleImageRequest(request));
    }
});

// 判断是否为图片请求
function isImageRequest(request) {
    const url = new URL(request.url);
    
    // 检查域名
    if (!IMAGE_DOMAINS.some(domain => url.hostname.includes(domain))) {
        return false;
    }
    
    // 检查文件扩展名
    const pathname = url.pathname.toLowerCase();
    return pathname.includes('.jpg') || 
           pathname.includes('.jpeg') || 
           pathname.includes('.png') || 
           pathname.includes('.webp') || 
           pathname.includes('.gif');
}

// 处理图片请求
async function handleImageRequest(request) {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // 如果有缓存且未过期，返回缓存
    if (cachedResponse) {
        const cacheTime = await getCacheTime(request.url);
        if (cacheTime && (Date.now() - cacheTime < CACHE_EXPIRY)) {
            console.log('从缓存返回图片:', request.url);
            return cachedResponse;
        }
    }
    
    try {
        // 尝试从网络获取
        const networkResponse = await fetch(request, {
            mode: 'cors',
            credentials: 'omit'
        });
        
        if (networkResponse.ok) {
            // 缓存成功的响应
            await cacheImage(cache, request, networkResponse.clone());
            console.log('从网络获取并缓存图片:', request.url);
            return networkResponse;
        } else {
            throw new Error(`HTTP ${networkResponse.status}`);
        }
    } catch (error) {
        console.warn('网络请求失败:', request.url, error);
        
        // 网络失败时返回缓存（即使过期）
        if (cachedResponse) {
            console.log('网络失败，返回过期缓存:', request.url);
            return cachedResponse;
        }
        
        // 返回占位符图片
        return generatePlaceholderResponse();
    }
}

// 缓存图片
async function cacheImage(cache, request, response) {
    try {
        // 检查缓存大小
        await manageCacheSize(cache);
        
        // 缓存图片和时间戳
        await cache.put(request, response);
        await setCacheTime(request.url, Date.now());
        
    } catch (error) {
        console.warn('缓存图片失败:', request.url, error);
    }
}

// 管理缓存大小
async function manageCacheSize(cache) {
    const keys = await cache.keys();
    
    if (keys.length >= MAX_CACHE_SIZE) {
        // 获取所有缓存项的时间戳
        const cacheItems = await Promise.all(
            keys.map(async (key) => ({
                key,
                time: await getCacheTime(key.url) || 0
            }))
        );
        
        // 按时间排序，删除最旧的项
        cacheItems.sort((a, b) => a.time - b.time);
        const toDelete = cacheItems.slice(0, keys.length - MAX_CACHE_SIZE + 5);
        
        await Promise.all(
            toDelete.map(async (item) => {
                await cache.delete(item.key);
                await deleteCacheTime(item.key.url);
            })
        );
        
        console.log(`清理了 ${toDelete.length} 个旧缓存项`);
    }
}

// 设置缓存时间
async function setCacheTime(url, time) {
    try {
        const db = await openDB();
        const transaction = db.transaction(['cache-times'], 'readwrite');
        const store = transaction.objectStore('cache-times');
        await store.put({ url, time });
    } catch (error) {
        console.warn('设置缓存时间失败:', error);
    }
}

// 获取缓存时间
async function getCacheTime(url) {
    try {
        const db = await openDB();
        const transaction = db.transaction(['cache-times'], 'readonly');
        const store = transaction.objectStore('cache-times');
        const result = await store.get(url);
        return result ? result.time : null;
    } catch (error) {
        console.warn('获取缓存时间失败:', error);
        return null;
    }
}

// 删除缓存时间
async function deleteCacheTime(url) {
    try {
        const db = await openDB();
        const transaction = db.transaction(['cache-times'], 'readwrite');
        const store = transaction.objectStore('cache-times');
        await store.delete(url);
    } catch (error) {
        console.warn('删除缓存时间失败:', error);
    }
}

// 打开IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('image-cache-db', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('cache-times')) {
                db.createObjectStore('cache-times', { keyPath: 'url' });
            }
        };
    });
}

// 生成占位符响应
function generatePlaceholderResponse() {
    const svg = `
        <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f3f4f6"/>
            <text x="50%" y="50%" text-anchor="middle" dy=".3em" 
                  font-family="Arial, sans-serif" font-size="14" fill="#9ca3af">
                图片暂时无法加载
            </text>
        </svg>
    `;
    
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    return new Response(blob, {
        status: 200,
        statusText: 'OK',
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'no-cache'
        }
    });
}

// 监听消息
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'PRELOAD_IMAGES':
            preloadImages(data.urls);
            break;
        case 'CLEAR_CACHE':
            clearImageCache();
            break;
        case 'GET_CACHE_INFO':
            getCacheInfo().then(info => {
                event.ports[0].postMessage(info);
            });
            break;
    }
});

// 预加载图片
async function preloadImages(urls) {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    
    for (const url of urls) {
        try {
            const request = new Request(url, { mode: 'cors', credentials: 'omit' });
            const cachedResponse = await cache.match(request);
            
            if (!cachedResponse) {
                const response = await fetch(request);
                if (response.ok) {
                    await cacheImage(cache, request, response);
                    console.log('预加载图片:', url);
                }
            }
        } catch (error) {
            console.warn('预加载图片失败:', url, error);
        }
    }
}

// 清理图片缓存
async function clearImageCache() {
    try {
        await caches.delete(IMAGE_CACHE_NAME);
        const db = await openDB();
        const transaction = db.transaction(['cache-times'], 'readwrite');
        const store = transaction.objectStore('cache-times');
        await store.clear();
        console.log('图片缓存已清理');
    } catch (error) {
        console.warn('清理缓存失败:', error);
    }
}

// 获取缓存信息
async function getCacheInfo() {
    try {
        const cache = await caches.open(IMAGE_CACHE_NAME);
        const keys = await cache.keys();
        
        return {
            cacheSize: keys.length,
            maxSize: MAX_CACHE_SIZE,
            cacheExpiry: CACHE_EXPIRY
        };
    } catch (error) {
        console.warn('获取缓存信息失败:', error);
        return { cacheSize: 0, maxSize: MAX_CACHE_SIZE, cacheExpiry: CACHE_EXPIRY };
    }
}
