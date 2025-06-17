/**
 * 图片修复脚本 - 立即修复图片显示问题
 */

(function() {
    'use strict';
    
    function fixImages() {
        console.log('开始修复图片显示问题...');
        
        // 查找所有需要修复的图片
        const images = document.querySelectorAll('img');
        let fixedCount = 0;
        
        images.forEach((img, index) => {
            if (shouldFixImage(img)) {
                fixSingleImage(img, index);
                fixedCount++;
            }
        });
        
        console.log(`已修复 ${fixedCount} 个图片`);
        
        // 触发图片优化器重新处理
        if (window.imageOptimizer) {
            setTimeout(() => {
                window.imageOptimizer.refresh();
            }, 100);
        }
    }
    
    function shouldFixImage(img) {
        // 检查是否需要修复
        return (
            // 有data-src但src是占位符或空的
            (img.dataset.src && (!img.src || img.src.startsWith('data:image/svg+xml'))) ||
            // 或者src指向onlinegames.io但没有显示
            (img.src && img.src.includes('onlinegames.io') && !img.complete) ||
            // 或者图片加载失败
            (img.src && img.complete && img.naturalWidth === 0)
        );
    }
    
    function fixSingleImage(img, index) {
        // 如果有data-src，直接使用它
        if (img.dataset.src && img.dataset.src !== img.src) {
            const originalSrc = img.dataset.src;
            
            // 创建新的图片对象来测试加载
            const testImg = new Image();
            testImg.onload = function() {
                img.src = originalSrc;
                img.style.opacity = '1';
                img.classList.remove('loading');
                img.classList.add('loaded');
            };
            testImg.onerror = function() {
                console.warn('图片加载失败:', originalSrc);
                showErrorPlaceholder(img);
            };
            testImg.src = originalSrc;
        }
        
        // 设置优先级
        if (index < 8) {
            img.dataset.priority = 'high';
        }
        
        // 添加必要的类
        img.classList.add('responsive-image');
        if (!img.classList.contains('loaded')) {
            img.classList.add('loading');
        }
    }
    
    function showErrorPlaceholder(img) {
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
            </svg>
        `;
        
        img.src = `data:image/svg+xml;base64,${btoa(errorSvg)}`;
        img.style.opacity = '0.8';
        img.classList.add('error');
        img.style.cursor = 'pointer';
        
        img.addEventListener('click', function() {
            if (img.dataset.src) {
                img.classList.remove('error');
                img.style.cursor = 'default';
                fixSingleImage(img, 0);
            }
        }, { once: true });
    }
    
    // 立即执行修复
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixImages);
    } else {
        fixImages();
    }
    
    // 也在window load事件后执行一次
    window.addEventListener('load', function() {
        setTimeout(fixImages, 500);
    });
    
    // 导出修复函数
    window.fixImages = fixImages;
})();
