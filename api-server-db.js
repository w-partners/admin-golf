// PostgreSQL 기반 API 서버 - 메모리 저장소 없음, 모든 데이터 DB에서 조회
const http = require('http');
const url = require('url');
const { Client } = require('pg');

// PostgreSQL 연결 풀 생성
class DatabasePool {
  constructor() {
    this.pool = [];
    this.config = {
      user: 'postgres',
      host: 'localhost',
      database: 'admin_golf',
      password: 'admin',
      port: 5555,
    };
  }

  async getClient() {
    const client = new Client(this.config);
    await client.connect();
    return client;
  }

  async query(text, params) {
    const client = await this.getClient();
    try {
      return await client.query(text, params);
    } finally {
      await client.end();
    }
  }
}

const db = new DatabasePool();

// POST 데이터 파싱 함수
function getPostData(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

// HTTP 서버 생성
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // 요청 로깅
  console.log(`📨 API 요청: ${method} ${pathname} ${JSON.stringify(parsedUrl.query)}`);

  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // 골프장 목록 API (지역별 가나다순 + 순번순)
    if (pathname === '/api/golf-courses' && method === 'GET') {
      const result = await db.query('SELECT * FROM golf_courses ORDER BY region, sequence');
      
      // 지역별로 그룹화 (가나다순)
      const groupedCourses = {};
      result.rows.forEach(course => {
        if (!groupedCourses[course.region]) {
          groupedCourses[course.region] = [];
        }
        groupedCourses[course.region].push(course);
      });

      // 지역을 가나다순으로 정렬
      const sortedGroupedCourses = {};
      Object.keys(groupedCourses).sort().forEach(region => {
        sortedGroupedCourses[region] = groupedCourses[region];
      });

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(sortedGroupedCourses));
      return;
    }

    // 골프장 삭제 API
    if (pathname.startsWith('/api/golf-courses/') && method === 'DELETE') {
      const courseId = pathname.split('/')[3];
      
      const result = await db.query('DELETE FROM golf_courses WHERE id = $1 RETURNING *', [courseId]);
      
      if (result.rows.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: '골프장을 찾을 수 없습니다' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        message: `${result.rows[0].name} 골프장이 삭제되었습니다`
      }));

      console.log(`🗑️ 골프장 삭제: ${result.rows[0].name} (ID: ${courseId})`);
      return;
    }

    // 골프장 등록 API
    if (pathname === '/api/golf-courses' && method === 'POST') {
      const courseData = await getPostData(req);
      
      const result = await db.query(`
        INSERT INTO golf_courses (sequence, name, region, address, contact, oper_status, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        courseData.sequence,
        courseData.name,
        courseData.region,
        courseData.address,
        courseData.contact,
        courseData.oper_status || 'API연동',
        courseData.notes || ''
      ]);

      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        course: result.rows[0]
      }));

      console.log(`➕ 골프장 등록: ${courseData.name} (${courseData.region})`);
      return;
    }

    // 다음 순번 조회 API
    if (pathname === '/api/golf-courses/next-sequence' && method === 'GET') {
      const result = await db.query('SELECT MAX(sequence) as max_seq FROM golf_courses');
      const nextSequence = (parseInt(result.rows[0].max_seq) || 0) + 1;
      
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ nextSequence }));
      return;
    }

    // 티타임 목록 API (필터링 지원)
    if (pathname === '/api/tee-times' && method === 'GET') {
      const query = parsedUrl.query;
      let sqlQuery = 'SELECT * FROM tee_times WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      // 골프장 필터
      if (query.golfCourse) {
        sqlQuery += ` AND golf_course_name = $${paramIndex}`;
        params.push(query.golfCourse);
        paramIndex++;
      }

      // 지역 필터
      if (query.region) {
        sqlQuery += ` AND region = $${paramIndex}`;
        params.push(query.region);
        paramIndex++;
      }

      // 날짜 필터 (timestamp 필드를 날짜 문자열과 비교)
      if (query.date) {
        sqlQuery += ` AND DATE(date) = $${paramIndex}`;
        params.push(query.date);
        paramIndex++;
      }

      // 시간대 필터
      if (query.timePart) {
        sqlQuery += ` AND time_part = $${paramIndex}`;
        params.push(query.timePart);
        paramIndex++;
      }

      // 예약 타입 필터
      if (query.type && query.type !== 'all') {
        const typeFilter = query.type === 'booking' ? '부킹' : '조인';
        sqlQuery += ` AND booking_type = $${paramIndex}`;
        params.push(typeFilter);
        paramIndex++;
        
        console.log(`🎯 타입 필터 적용: ${query.type} → ${typeFilter}`);
      }

      sqlQuery += ' ORDER BY date, time';

      const result = await db.query(sqlQuery, params);
      
      console.log(`✅ 티타임 조회 결과: ${result.rows.length}건`);
      console.log(`🔍 실행된 쿼리: ${sqlQuery}`);
      console.log(`📋 쿼리 파라미터:`, params);
      
      const responseData = {
        success: true,
        data: result.rows,
        count: result.rows.length
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(responseData));
      return;
    }

    // 티타임 등록 API
    if (pathname === '/api/tee-times' && method === 'POST') {
      const teeTimeData = await getPostData(req);
      
      // 시간대 자동 분류
      function getTimePart(time) {
        if (!time) return '1부';
        const hour = parseInt(time.substring(0, 2)) || 0;
        if (hour < 10) return '1부';
        else if (hour >= 15) return '3부';
        else return '2부';
      }
      
      // 예약 타입 자동 결정
      function getBookingType(players) {
        return parseInt(players) >= 4 ? '부킹' : '조인';
      }

      const result = await db.query(`
        INSERT INTO tee_times (
          golf_course_name, region, date, time, time_part, green_fee, players, 
          booking_type, request, hole, caddy, prepay, meal, cart, other, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `, [
        teeTimeData.golfCourse,
        teeTimeData.region,
        teeTimeData.date,
        teeTimeData.time,
        getTimePart(teeTimeData.time),
        parseFloat(teeTimeData.greenFee) || 0,
        parseInt(teeTimeData.players) || 1,
        getBookingType(teeTimeData.players),
        teeTimeData.request || '',
        teeTimeData.hole || '',
        teeTimeData.caddy || '',
        parseFloat(teeTimeData.prepay) || 0,
        teeTimeData.meal || '',
        teeTimeData.cart || '',
        teeTimeData.other || '',
        'AVAILABLE'
      ]);

      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        data: result.rows[0]
      }));

      console.log(`🏌️ 티타임 등록: ${teeTimeData.golfCourse} (${teeTimeData.date}, ${getTimePart(teeTimeData.time)})`);
      return;
    }

    // 티타임 매트릭스 API (실시간 DB 조회)
    if (pathname === '/api/tee-time-matrix' && method === 'GET') {
      console.log('🔄 실시간 티타임 매트릭스 조회 중...');

      // 1. 모든 골프장 조회
      const coursesResult = await db.query('SELECT * FROM golf_courses ORDER BY region, sequence');
      
      // 2. 모든 티타임 조회하여 카운트 계산
      const teeTimesResult = await db.query(`
        SELECT golf_course_name, region, DATE(date)::text as date_only, time_part, COUNT(*) as count
        FROM tee_times 
        GROUP BY golf_course_name, region, DATE(date), time_part
      `);

      console.log('🔍 매트릭스 집계 데이터:');
      teeTimesResult.rows.forEach(row => {
        console.log(`  - ${row.region}/${row.golf_course_name} ${row.date_only} ${row.time_part}: ${row.count}건`);
      });

      // 3. 매트릭스 데이터 구조 생성 (90일치)
      const matrix = {};
      const startDate = new Date();
      
      coursesResult.rows.forEach(course => {
        const courseKey = `${course.region}_${course.name}`;
        matrix[courseKey] = {
          region: course.region,
          courseName: course.name,
          dates: {}
        };

        // 90일치 날짜 초기화
        for (let i = 0; i < 90; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          const dateStr = currentDate.toISOString().split('T')[0];
          
          matrix[courseKey].dates[dateStr] = {
            part1: 0,
            part2: 0,
            part3: 0
          };
        }
      });

      // 4. 실제 티타임 카운트 적용
      teeTimesResult.rows.forEach(teeTime => {
        const courseKey = `${teeTime.region}_${teeTime.golf_course_name}`;
        const dateStr = teeTime.date_only; // PostgreSQL DATE() 함수로 이미 YYYY-MM-DD 형식
        
        console.log(`🎯 매칭 시도: ${courseKey} - ${dateStr} - ${teeTime.time_part}`);
        
        if (matrix[courseKey] && matrix[courseKey].dates[dateStr]) {
          const partKey = teeTime.time_part === '1부' ? 'part1' : 
                         teeTime.time_part === '2부' ? 'part2' : 'part3';
          matrix[courseKey].dates[dateStr][partKey] = parseInt(teeTime.count);
          console.log(`✅ 매칭 성공: ${courseKey}.${dateStr}.${partKey} = ${teeTime.count}`);
        } else {
          console.log(`❌ 매칭 실패: ${courseKey} not found or ${dateStr} not in range`);
        }
      });

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(matrix));
      
      const totalCourses = Object.keys(matrix).length;
      const totalTeeTimeCount = teeTimesResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
      console.log(`✅ 매트릭스 조회 완료: ${totalCourses}개 골프장, 총 ${totalTeeTimeCount}건 티타임`);
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
server.listen(PORT, async () => {
  console.log(`🌐 PostgreSQL 기반 API 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
  
  try {
    // DB 연결 테스트
    const coursesResult = await db.query('SELECT COUNT(*) as count FROM golf_courses');
    const teeTimesResult = await db.query('SELECT COUNT(*) as count FROM tee_times');
    
    console.log(`📊 골프장 API: http://localhost:${PORT}/api/golf-courses`);
    console.log(`🏌️ 티타임 매트릭스: http://localhost:${PORT}/api/tee-time-matrix`);
    console.log(`⏰ 티타임 등록 API: http://localhost:${PORT}/api/tee-times`);
    console.log(`🎯 등록된 골프장: ${coursesResult.rows[0].count}개`);
    console.log(`📅 등록된 티타임: ${teeTimesResult.rows[0].count}건`);
    console.log(`🔄 모든 데이터는 PostgreSQL에서 실시간 조회됩니다 (메모리 저장소 없음)`);
  } catch (error) {
    console.error('❌ DB 연결 확인 실패:', error.message);
  }
});