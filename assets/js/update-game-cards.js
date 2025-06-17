/**
 * 批量更新游戏卡片脚本
 * 为所有游戏卡片添加图片优化功能
 */

document.addEventListener('DOMContentLoaded', function() {
    updateGameCards();
});

function updateGameCards() {
    // 查找所有游戏卡片
    const gameCards = document.querySelectorAll('a[href*="/games/"]');
    
    gameCards.forEach((card, index) => {
        updateSingleCard(card, index);
    });
    
    console.log(`已更新 ${gameCards.length} 个游戏卡片`);
}

function updateSingleCard(card, index) {
    // 添加game-card类
    if (!card.classList.contains('game-card')) {
        card.classList.add('game-card');
    }
    
    // 查找图片元素
    const img = card.querySelector('img');
    if (!img) return;
    
    // 查找图片容器
    let imageContainer = img.parentElement;
    if (!imageContainer.classList.contains('image-container')) {
        imageContainer.classList.add('image-container');
    }
    
    // 更新图片属性
    updateImageAttributes(img, index);
    
    // 添加加载指示器
    addLoadingIndicator(imageContainer);
}

function updateImageAttributes(img, index) {
    // 确保有正确的data-src设置
    if (!img.dataset.src) {
        if (img.src && !img.src.startsWith('data:')) {
            img.dataset.src = img.src;
        }
    }

    // 添加必要的类
    img.classList.add('responsive-image');
    if (!img.classList.contains('loading') && !img.classList.contains('loaded')) {
        img.classList.add('loading');
    }

    // 设置优先级（前8个图片为高优先级）
    if (index < 8) {
        img.dataset.priority = 'high';
    }

    // 添加懒加载属性
    img.loading = 'lazy';

    // 确保有alt属性
    if (!img.alt) {
        const gameTitle = extractGameTitle(img);
        img.alt = `${gameTitle} Thumbnail`;
    }
}

function extractGameTitle(img) {
    // 从父元素中提取游戏标题
    const card = img.closest('a');
    const titleElement = card.querySelector('h3');
    return titleElement ? titleElement.textContent.trim() : 'Game';
}

function addLoadingIndicator(container) {
    // 检查是否已经有加载指示器
    if (container.querySelector('.image-loading-indicator')) {
        return;
    }
    
    // 创建加载指示器
    const indicator = document.createElement('div');
    indicator.className = 'image-loading-indicator';
    indicator.style.display = 'none'; // 初始隐藏
    
    container.style.position = 'relative';
    container.appendChild(indicator);
    
    // 监听图片加载状态
    const img = container.querySelector('img');
    if (img) {
        // 显示加载指示器
        img.addEventListener('loadstart', () => {
            indicator.style.display = 'block';
        });
        
        // 隐藏加载指示器
        img.addEventListener('load', () => {
            indicator.style.display = 'none';
        });
        
        img.addEventListener('error', () => {
            indicator.style.display = 'none';
        });
    }
}

// 为动态添加的内容提供更新功能
function updateNewCards() {
    const newCards = document.querySelectorAll('a[href*="/games/"]:not(.game-card)');
    newCards.forEach((card, index) => {
        updateSingleCard(card, index);
    });
}

// 导出函数供其他脚本使用
window.updateGameCards = updateGameCards;
window.updateNewCards = updateNewCards;
