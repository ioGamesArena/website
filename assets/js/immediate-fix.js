/**
 * 立即修复图片显示问题
 * 这个脚本会立即执行，不等待DOM加载完成
 */

(function() {
    'use strict';
    
    function immediateImageFix() {
        console.log('立即修复图片显示问题...');
        
        // 查找所有有data-src但src是占位符的图片
        const images = document.querySelectorAll('img[data-src]');
        let fixedCount = 0;
        
        images.forEach((img, index) => {
            const dataSrc = img.dataset.src;
            
            // 如果有data-src且当前src是占位符或空的
            if (dataSrc && (!img.src || img.src.startsWith('data:image/svg+xml'))) {
                // 直接设置src
                img.src = dataSrc;
                img.style.opacity = '1';
                img.classList.remove('loading');
                img.classList.add('loaded');
                fixedCount++;
                
                // 添加错误处理
                img.onerror = function() {
                    console.warn('图片加载失败:', dataSrc);
                    this.style.opacity = '0.5';
                    this.alt = '图片加载失败';
                };
                
                img.onload = function() {
                    this.style.opacity = '1';
                    this.classList.add('loaded');
                    this.classList.remove('loading');
                };
            }
        });
        
        console.log(`立即修复了 ${fixedCount} 个图片`);
    }
    
    // 立即执行
    immediateImageFix();
    
    // 也在DOM加载完成后执行一次
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', immediateImageFix);
    }
    
    // 在页面完全加载后再执行一次
    window.addEventListener('load', function() {
        setTimeout(immediateImageFix, 100);
    });
    
})();
