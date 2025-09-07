// PostgreSQL 데이터베이스 초기화
const { Client } = require('pg');

// 데이터베이스 연결 설정
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'admin_golf',
  password: 'admin',
  port: 5555,
});

async function initDatabase() {
  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 골프장 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS golf_courses (
        id SERIAL PRIMARY KEY,
        sequence INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        region VARCHAR(20) NOT NULL,
        address VARCHAR(200) NOT NULL,
        contact VARCHAR(20) NOT NULL,
        oper_status VARCHAR(10) NOT NULL DEFAULT 'API연동',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('📊 golf_courses 테이블 생성 완료');

    // 티타임 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS tee_times (
        id SERIAL PRIMARY KEY,
        golf_course_name VARCHAR(100) NOT NULL,
        region VARCHAR(20) NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        time_part VARCHAR(5) NOT NULL,
        green_fee DECIMAL(10,2) NOT NULL,
        players INTEGER NOT NULL,
        booking_type VARCHAR(10) NOT NULL,
        request TEXT,
        hole VARCHAR(10),
        caddy VARCHAR(10),
        prepay DECIMAL(10,2) DEFAULT 0,
        meal VARCHAR(20),
        cart VARCHAR(20),
        other TEXT,
        status VARCHAR(20) DEFAULT 'AVAILABLE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('🏌️ tee_times 테이블 생성 완료');

    // 기존 샘플 골프장 데이터가 없으면 추가
    const existingCourses = await client.query('SELECT COUNT(*) FROM golf_courses');
    if (parseInt(existingCourses.rows[0].count) === 0) {
      console.log('📂 샘플 골프장 데이터 생성 중...');
      
      const sampleCourses = [
        { sequence: 1, name: '취곡CC', region: '제주', address: '제주시 애월읍', contact: '064-123-4567', oper_status: 'API연동' },
        { sequence: 2, name: '포도CC', region: '제주', address: '제주시 구좌읍', contact: '064-234-5678', oper_status: 'API연동' },
        { sequence: 3, name: '경기북부CC', region: '경기북부', address: '파주시 탄현면', contact: '031-345-6789', oper_status: 'API연동' },
        { sequence: 4, name: '헤이리골프클럽', region: '경기북부', address: '파주시 헤이리마을', contact: '031-456-7890', oper_status: 'API연동' },
        { sequence: 5, name: '경기남부GC', region: '경기남부', address: '용인시 처인구', contact: '031-567-8901', oper_status: 'API연동' },
        { sequence: 6, name: '용인컨트리클럽', region: '경기남부', address: '용인시 기흥구', contact: '031-678-9012', oper_status: 'API연동' }
      ];

      for (const course of sampleCourses) {
        await client.query(`
          INSERT INTO golf_courses (sequence, name, region, address, contact, oper_status)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [course.sequence, course.name, course.region, course.address, course.contact, course.oper_status]);
      }
      console.log(`✅ ${sampleCourses.length}개 골프장 데이터 추가 완료`);
    } else {
      console.log(`📊 기존 골프장 데이터: ${existingCourses.rows[0].count}개`);
    }

    console.log('🎉 데이터베이스 초기화 완료');

  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error.message);
  } finally {
    await client.end();
  }
}

initDatabase();