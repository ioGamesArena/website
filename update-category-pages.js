/**
 * 批量更新分类页面脚本
 * 为所有分类页面添加图片修复脚本
 */

const fs = require('fs');
const path = require('path');

// 分类目录列表
const categories = [
    '1-player', '2-player', '2d', '3d', 'action', 'adventure', 
    'casual', 'io-games', 'puzzle', 'racing', 'sports', 'strategy'
];

function updateCategoryPage(categoryName) {
    const filePath = path.join(__dirname, 'categories', categoryName, 'index.html');
    
    if (!fs.existsSync(filePath)) {
        console.log(`跳过不存在的文件: ${filePath}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 检查是否已经包含image-fix.js
    if (content.includes('image-fix.js')) {
        console.log(`${categoryName} 已经包含image-fix.js，跳过`);
        return;
    }
    
    // 查找图片优化系统注释的位置
    const searchPattern = '    <!-- 图片优化系统 -->\n    <script src="../../assets/js/image-config.js"></script>';
    const replacement = '    <!-- 图片优化系统 -->\n    <script src="../../assets/js/image-fix.js"></script>\n    <script src="../../assets/js/image-config.js"></script>';
    
    if (content.includes(searchPattern)) {
        content = content.replace(searchPattern, replacement);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ 已更新 ${categoryName}/index.html`);
    } else {
        console.log(`❌ 未找到更新位置: ${categoryName}/index.html`);
    }
}

// 更新所有分类页面
console.log('开始更新分类页面...');
categories.forEach(updateCategoryPage);
console.log('更新完成！');
