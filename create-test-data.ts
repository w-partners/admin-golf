// 테스트 데이터 생성 스크립트

async function createTestData() {
  const baseUrl = 'http://localhost:3005';
  
  console.log('🎯 테스트 데이터 생성 시작...');
  
  // 골프장별로 티타임 생성
  const golfCourses = [
    { id: 1, name: '오라CC', region: '제주' },
    { id: 2, name: '라헨느CC', region: '제주' },
    { id: 3, name: '블랙스톤CC', region: '제주' },
    { id: 4, name: '파인비치CC', region: '경남' },
    { id: 5, name: '아난티코브CC', region: '경남' },
  ];
  
  const today = new Date();
  let createdCount = 0;
  
  for (const course of golfCourses) {
    // 각 골프장별로 7일간의 데이터 생성
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);
      const dateStr = date.toISOString().split('T')[0];
      
      // 각 날짜별로 3-5개의 티타임 생성
      const times = [
        { time: '07:00', slot: '1부' },
        { time: '08:30', slot: '1부' },
        { time: '11:00', slot: '2부' },
        { time: '13:30', slot: '2부' },
        { time: '15:30', slot: '3부' },
      ];
      
      const numTimes = Math.floor(Math.random() * 3) + 3;
      const selectedTimes = times.slice(0, numTimes);
      
      for (const timeInfo of selectedTimes) {
        const players = Math.random() > 0.5 ? 4 : Math.floor(Math.random() * 3) + 1;
        
        const data = {
          golfCourseId: course.id,
          date: dateStr,
          time: timeInfo.time,
          greenFee: Math.floor(Math.random() * 10 + 10) + 0.5,
          players: players,
          requirements: '',
          holes: 18,
          caddie: true,
          deposit: Math.floor(Math.random() * 5),
          mealIncluded: Math.random() > 0.3,
          cartIncluded: true,
        };
        
        try {
          const response = await fetch(`${baseUrl}/api/public/tee-times`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          
          if (response.ok) {
            createdCount++;
            console.log(`✅ Created tee time: ${course.name} - ${dateStr} ${timeInfo.time}`);
          } else {
            console.error(`❌ Failed: ${course.name} - ${dateStr} ${timeInfo.time}`);
          }
        } catch (error) {
          console.error(`❌ Error: ${error}`);
        }
      }
    }
  }
  
  console.log(`\n🎉 완료! ${createdCount}개의 티타임이 생성되었습니다.`);
}

createTestData().catch(console.error);