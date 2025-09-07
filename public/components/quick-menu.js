// ================================================================
// 파일: quick-menu.js (공통 퀵메뉴 컴포넌트)
// 설명: 모든 페이지에서 사용되는 통합 퀵메뉴
// 기능: 페이지별 활성 상태 관리, 권한별 메뉴 표시
// ================================================================

// 퀵메뉴 HTML 생성
function createQuickMenuHTML(currentPage = '') {
    const menuItems = [
        {
            id: 'tee-times',
            text: '티타임:모두',
            url: 'index.html',
            page: 'index',
            permission: 'all'
        },
        {
            id: 'tee-time-register',
            text: '티타임등록:매니저이상',
            url: 'tee-time-register.html',
            page: 'tee-time-register',
            permission: 'manager'
        },
        {
            id: 'golf-courses',
            text: '골프장리스트/등록:관리자이상',
            url: 'golf-courses.html',
            page: 'golf-courses',
            permission: 'admin'
        },
        {
            id: 'performance',
            text: '실적등록:매니저이상',
            url: '#',
            page: 'performance',
            permission: 'manager'
        },
        {
            id: 'members',
            text: '회원관리:관리자이상',
            url: '#',
            page: 'members',
            permission: 'admin'
        }
    ];

    let quickMenuHTML = '<div class="quick-menu">';
    
    menuItems.forEach(item => {
        const isActive = (currentPage === item.page) ? 'active' : '';
        const onclick = (item.url === '#') ? '' : `onclick="location.href='${item.url}'"`;
        
        quickMenuHTML += `
            <button class="menu-item ${isActive}" ${onclick}>
                ${item.text}
            </button>
        `;
    });
    
    quickMenuHTML += '</div>';
    return quickMenuHTML;
}

// 퀵메뉴 CSS 스타일
function getQuickMenuCSS() {
    return `
        /* ============ 퀵 메뉴 스타일 ============ */
        .quick-menu {
            background: white;
            padding: 12px 24px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            display: flex;
            gap: 20px;
            overflow-x: auto;
            white-space: nowrap;
        }

        .menu-item {
            white-space: nowrap;
            padding: 8px 16px;
            background: #f8f9fa;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            color: #495057;
            transition: all 0.2s;
            text-decoration: none;
        }

        .menu-item:hover {
            background: #e9ecef;
        }

        .menu-item.active {
            background: #007bff;
            color: white;
        }

        .menu-item:disabled {
            background: #e9ecef;
            color: #6c757d;
            cursor: not-allowed;
        }

        /* 모바일 대응 */
        @media (max-width: 768px) {
            .quick-menu {
                padding: 8px 12px;
                gap: 10px;
            }

            .menu-item {
                padding: 6px 12px;
                font-size: 13px;
            }
        }
    `;
}

// 퀵메뉴 초기화 함수
function initQuickMenu(currentPage = '') {
    // CSS 스타일 추가
    const existingStyle = document.getElementById('quick-menu-styles');
    if (!existingStyle) {
        const style = document.createElement('style');
        style.id = 'quick-menu-styles';
        style.textContent = getQuickMenuCSS();
        document.head.appendChild(style);
    }

    // 퀵메뉴 HTML 삽입
    const quickMenuContainer = document.getElementById('quick-menu-container');
    if (quickMenuContainer) {
        quickMenuContainer.innerHTML = createQuickMenuHTML(currentPage);
    } else {
        // 전역 헤더 다음에 퀵메뉴 삽입
        const globalHeader = document.querySelector('.global-header');
        if (globalHeader) {
            const quickMenuDiv = document.createElement('div');
            quickMenuDiv.id = 'quick-menu-container';
            quickMenuDiv.innerHTML = createQuickMenuHTML(currentPage);
            globalHeader.parentNode.insertBefore(quickMenuDiv, globalHeader.nextSibling);
        }
    }

    console.log('🔗 퀵메뉴 초기화 완료:', currentPage);
}

// 전역 헤더 HTML 생성
function createGlobalHeaderHTML() {
    return `
        <div class="global-header">
            <div class="header-left">
                <div class="logo">🏌️</div>
                <div class="company-name">골프장 예약 관리 시스템</div>
            </div>
            <div class="header-right">
                <div class="notification-icon">🔔</div>
                <div class="user-profile">관리자 (01034424668)</div>
                <button class="login-btn" onclick="handleLogout()">로그아웃</button>
            </div>
        </div>
    `;
}

// 전역 헤더 CSS 스타일
function getGlobalHeaderCSS() {
    return `
        /* ============ 전역 헤더 스타일 ============ */
        .global-header {
            background: linear-gradient(135deg, #2c5282 0%, #2b6cb0 100%);
            color: white;
            padding: 12px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .logo {
            font-size: 24px;
        }

        .company-name {
            font-size: 18px;
            font-weight: 600;
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .notification-icon {
            font-size: 20px;
            cursor: pointer;
        }

        .user-profile {
            font-size: 14px;
        }

        .login-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            color: white;
            cursor: pointer;
            font-size: 14px;
        }

        .login-btn:hover {
            background: rgba(255,255,255,0.3);
        }

        /* 모바일 대응 */
        @media (max-width: 768px) {
            .global-header {
                padding: 8px 12px;
                flex-direction: column;
                gap: 8px;
            }
        }
    `;
}

// 통합 헤더 초기화 함수
function initGlobalLayout(currentPage = '') {
    // 기본 CSS 추가
    const existingHeaderStyle = document.getElementById('global-header-styles');
    if (!existingHeaderStyle) {
        const style = document.createElement('style');
        style.id = 'global-header-styles';
        style.textContent = getGlobalHeaderCSS();
        document.head.appendChild(style);
    }

    // 전역 헤더 삽입
    const globalHeaderContainer = document.getElementById('global-header-container');
    if (globalHeaderContainer) {
        globalHeaderContainer.innerHTML = createGlobalHeaderHTML();
    } else {
        // body 시작 부분에 전역 헤더 삽입
        const body = document.body;
        const headerDiv = document.createElement('div');
        headerDiv.id = 'global-header-container';
        headerDiv.innerHTML = createGlobalHeaderHTML();
        body.insertBefore(headerDiv, body.firstChild);
    }

    // 퀵메뉴 초기화
    initQuickMenu(currentPage);

    console.log('🎯 통합 레이아웃 초기화 완료');
}

// 로그아웃 처리 함수
function handleLogout() {
    const confirmed = confirm('로그아웃하시겠습니까?');
    if (confirmed) {
        localStorage.removeItem('user');
        alert('로그아웃되었습니다.');
        window.location.href = '/login.html';
    }
}

// 페이지별 현재 위치 감지
function detectCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    
    const pageMap = {
        'index.html': 'index',
        '': 'index',  // root path
        'golf-courses.html': 'golf-courses',
        'tee-time-register.html': 'tee-time-register',
        'golf-course-register.html': 'golf-courses',
        'performance.html': 'performance',
        'members.html': 'members'
    };
    
    return pageMap[filename] || 'index';
}

// DOM 로드시 자동 초기화
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = detectCurrentPage();
    initGlobalLayout(currentPage);
});