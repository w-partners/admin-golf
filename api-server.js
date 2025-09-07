const http = require('http');
const url = require('url');

// 골프장 데이터 (각 지역별 2개씩, 동적 데이터)
const golfCourses = {
  "경기북부": [
    {
      id: 1,
      sequence: 1,
      name: "경기북부CC",
      region: "경기북부",
      address: "경기도 파주시 골프로 1",
      contact: "031-111-1111",
      status: "API연동",
      created_at: "2025-09-01"
    },
    {
      id: 2,
      sequence: 2,
      name: "헤이리골프클럽",
      region: "경기북부",
      address: "경기도 파주시 헤이리로 15",
      contact: "031-111-2222",
      status: "수동",
      created_at: "2025-09-02"
    }
  ],
  "경기남부": [
    {
      id: 3,
      sequence: 3,
      name: "경기남부GC",
      region: "경기남부",
      address: "경기도 수원시 골프로 2",
      contact: "031-222-2222",
      status: "API연동",
      created_at: "2025-09-03"
    },
    {
      id: 4,
      sequence: 4,
      name: "용인컨트리클럽",
      region: "경기남부",
      address: "경기도 용인시 처인구 골프로 25",
      contact: "031-222-3333",
      status: "API연동",
      created_at: "2025-09-04"
    }
  ],
  "경기동부": [
    {
      id: 5,
      sequence: 5,
      name: "경기동부CC",
      region: "경기동부",
      address: "경기도 남양주시 골프로 3",
      contact: "031-333-3333",
      status: "수동",
      created_at: "2025-09-05"
    },
    {
      id: 6,
      sequence: 6,
      name: "가평골프클럽",
      region: "경기동부",
      address: "경기도 가평군 설악면 골프길 88",
      contact: "031-333-4444",
      status: "API연동",
      created_at: "2025-09-06"
    }
  ],
  "강원": [
    {
      id: 7,
      sequence: 7,
      name: "강원CC",
      region: "강원",
      address: "강원도 춘천시 골프로 4",
      contact: "033-444-4444",
      status: "API연동",
      created_at: "2025-09-07"
    },
    {
      id: 8,
      sequence: 8,
      name: "평창힐스CC",
      region: "강원",
      address: "강원도 평창군 대관령면 골프로 77",
      contact: "033-444-5555",
      status: "수동",
      created_at: "2025-09-08"
    }
  ],
  "경상": [
    {
      id: 9,
      sequence: 9,
      name: "경상GC",
      region: "경상",
      address: "경상북도 안동시 골프로 5",
      contact: "054-555-5555",
      status: "수동",
      created_at: "2025-09-09"
    },
    {
      id: 10,
      sequence: 10,
      name: "경주골프리조트",
      region: "경상",
      address: "경상북도 경주시 천북면 골프로 123",
      contact: "054-555-6666",
      status: "API연동",
      created_at: "2025-09-10"
    }
  ],
  "충남": [
    {
      id: 11,
      sequence: 11,
      name: "충남CC",
      region: "충남",
      address: "충청남도 천안시 골프로 6",
      contact: "041-666-6666",
      status: "API연동",
      created_at: "2025-09-11"
    },
    {
      id: 12,
      sequence: 12,
      name: "대천골프클럽",
      region: "충남",
      address: "충청남도 보령시 대천해수욕장로 456",
      contact: "041-666-7777",
      status: "대기",
      created_at: "2025-09-12"
    }
  ],
  "전라": [
    {
      id: 13,
      sequence: 13,
      name: "전라GC",
      region: "전라",
      address: "전라북도 전주시 골프로 7",
      contact: "063-777-7777",
      status: "대기",
      created_at: "2025-09-13"
    },
    {
      id: 14,
      sequence: 14,
      name: "무주골프리조트",
      region: "전라",
      address: "전라북도 무주군 설천면 골프로 999",
      contact: "063-777-8888",
      status: "API연동",
      created_at: "2025-09-14"
    }
  ],
  "제주": [
    {
      id: 15,
      sequence: 15,
      name: "제주CC",
      region: "제주",
      address: "제주특별자치도 제주시 골프로 8",
      contact: "064-888-8888",
      status: "API연동",
      created_at: "2025-09-15"
    },
    {
      id: 16,
      sequence: 16,
      name: "서귀포골프클럽",
      region: "제주",
      address: "제주특별자치도 서귀포시 중문관광로 1234",
      contact: "064-888-9999",
      status: "수동",
      created_at: "2025-09-16"
    }
  ]
};

// 티타임 데이터 (초기값은 모두 0)
const teeTimeMatrix = {};

// 각 골프장에 대해 매트릭스 초기화
Object.keys(golfCourses).forEach(region => {
  golfCourses[region].forEach(course => {
    const courseKey = `${region}_${course.name}`;
    teeTimeMatrix[courseKey] = {
      region: region,
      courseName: course.name,
      dates: {}
    };
    
    // 90일간의 날짜별 1,2,3부 데이터 초기화 (모두 0)
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      teeTimeMatrix[courseKey].dates[dateKey] = {
        part1: 0,  // 1부 (10시 이전)
        part2: 0,  // 2부 (10시-15시)  
        part3: 0   // 3부 (15시 이후)
      };
    }
  });
});

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // POST 데이터 읽기 함수
  function getPostData(req) {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({});
        }
      });
    });
  }

  // 골프장 찾기 함수
  function findGolfCourse(id) {
    for (let region in golfCourses) {
      const course = golfCourses[region].find(c => c.id === parseInt(id));
      if (course) {
        return { region, course };
      }
    }
    return null;
  }

  try {
    // 골프장 목록 API
    if (pathname === '/api/golf-courses' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(golfCourses));
      return;
    }

    // 특정 골프장 조회 API
    if (pathname.startsWith('/api/golf-courses/') && method === 'GET') {
      const id = pathname.split('/')[3];
      const result = findGolfCourse(id);
      
      if (result) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result.course));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: '골프장을 찾을 수 없습니다.' }));
      }
      return;
    }

    // 골프장 삭제 API
    if (pathname.startsWith('/api/golf-courses/') && method === 'DELETE') {
      const id = pathname.split('/')[3];
      const result = findGolfCourse(id);
      
      if (result) {
        // 해당 지역에서 골프장 제거
        const index = golfCourses[result.region].findIndex(c => c.id === parseInt(id));
        golfCourses[result.region].splice(index, 1);
        
        // 티타임 매트릭스에서도 제거
        const courseKey = `${result.region}_${result.course.name}`;
        delete teeTimeMatrix[courseKey];
        
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: '골프장이 삭제되었습니다.' }));
        
        console.log(`🗑️  골프장 삭제: ${result.course.name} (${result.region})`);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: '골프장을 찾을 수 없습니다.' }));
      }
      return;
    }

    // 골프장 수정 API
    if (pathname.startsWith('/api/golf-courses/') && method === 'PUT') {
      const id = pathname.split('/')[3];
      const result = findGolfCourse(id);
      
      if (result) {
        const updateData = await getPostData(req);
        
        // 골프장 정보 업데이트
        Object.assign(result.course, {
          name: updateData.name || result.course.name,
          address: updateData.address || result.course.address,
          contact: updateData.contact || result.course.contact,
          status: updateData.status || result.course.status
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, course: result.course }));
        
        console.log(`✏️  골프장 수정: ${result.course.name} (${result.region})`);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: '골프장을 찾을 수 없습니다.' }));
      }
      return;
    }

    // 골프장 등록 API
    if (pathname === '/api/golf-courses' && method === 'POST') {
      const newCourse = await getPostData(req);
      
      // 새로운 ID 생성 (가장 큰 ID + 1)
      let maxId = 0;
      Object.values(golfCourses).forEach(courses => {
        courses.forEach(course => {
          if (course.id > maxId) maxId = course.id;
        });
      });
      
      const courseData = {
        id: maxId + 1,
        sequence: maxId + 1,
        name: newCourse.name,
        region: newCourse.region,
        address: newCourse.address,
        contact: newCourse.contact,
        status: newCourse.status || 'API연동',
        created_at: new Date().toISOString().split('T')[0]
      };
      
      // 지역별 배열에 추가
      if (!golfCourses[newCourse.region]) {
        golfCourses[newCourse.region] = [];
      }
      golfCourses[newCourse.region].push(courseData);
      
      // 티타임 매트릭스에 추가
      const courseKey = `${newCourse.region}_${newCourse.name}`;
      teeTimeMatrix[courseKey] = {
        region: newCourse.region,
        courseName: newCourse.name,
        dates: {}
      };
      
      // 90일간 날짜 초기화
      const today = new Date();
      for (let i = 0; i < 90; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        
        teeTimeMatrix[courseKey].dates[dateKey] = {
          part1: 0, part2: 0, part3: 0
        };
      }
      
      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, course: courseData }));
      
      console.log(`➕ 골프장 등록: ${courseData.name} (${newCourse.region})`);
      return;
    }

    // 티타임 매트릭스 API
    if (pathname === '/api/tee-time-matrix' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(teeTimeMatrix));
      return;
    }

    // 404 - Not Found
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'API endpoint not found' }));

  } catch (error) {
    console.error('API 오류:', error);
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: '서버 오류가 발생했습니다.' }));
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🌐 API 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
  console.log(`📊 골프장 API: http://localhost:${PORT}/api/golf-courses`);
  console.log(`🏌️ 티타임 매트릭스: http://localhost:${PORT}/api/tee-time-matrix`);
  console.log(`🎯 총 골프장 수: ${Object.values(golfCourses).flat().length}개 (8개 지역 × 2개씩)`);
});