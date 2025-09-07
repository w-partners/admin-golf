const fs = require('fs');
const path = require('path');

const htmlFiles = [
    'public/tee-time-register.html',
    'public/golf-course-register.html',
    'public/golf-course-edit.html'
];

const commonMenuScript = `    <!-- 공통 퀵메뉴 컴포넌트 -->
    <script src="components/quick-menu.js"></script>`;

htmlFiles.forEach(filePath => {
    try {
        console.log(`🔄 Processing: ${filePath}`);
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 기존 스크립트 태그가 있는 곳 바로 전에 공통 메뉴 스크립트 추가
        if (content.includes('<script>') && !content.includes('components/quick-menu.js')) {
            content = content.replace('<script>', `${commonMenuScript}\n    <script>`);
        }
        
        // 기존 헤더 섹션을 공통 컴포넌트 주석으로 대체
        const headerPatterns = [
            /<!-- ============ 전역 헤더 섹션 ============ -->[\s\S]*?<\/div>\s*?<!-- ============ 퀵 메뉴 섹션 ============ -->[\s\S]*?<\/div>/g,
            /<!-- Global Header -->[\s\S]*?<\/div>\s*?<!-- Quick Menu -->[\s\S]*?<\/div>/g,
            /<div class="global-header">[\s\S]*?<\/div>\s*?<div class="quick-menu">[\s\S]*?<\/div>/g
        ];
        
        headerPatterns.forEach(pattern => {
            if (content.match(pattern)) {
                content = content.replace(pattern, '    <!-- 공통 헤더와 퀵메뉴는 JavaScript로 자동 생성됩니다 -->');
            }
        });
        
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated: ${filePath}`);
        
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
    }
});

console.log('\n🎯 공통 퀵메뉴 적용 완료!');
console.log('📋 적용된 파일들:');
htmlFiles.forEach(file => {
    console.log(`   • ${file}`);
});