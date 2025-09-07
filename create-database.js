// PostgreSQL 데이터베이스 생성
const { Client } = require('pg');

async function createDatabase() {
  // postgres 시스템 데이터베이스에 연결해서 새 데이터베이스 생성
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'admin',
    port: 5555,
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL 시스템 DB 연결 성공');

    // admin_golf 데이터베이스 생성
    try {
      await client.query('CREATE DATABASE admin_golf');
      console.log('✅ admin_golf 데이터베이스 생성 완료');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('📊 admin_golf 데이터베이스가 이미 존재합니다');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ 데이터베이스 생성 실패:', error.message);
  } finally {
    await client.end();
  }
}

createDatabase();