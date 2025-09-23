const fastify = require('fastify')({ logger: true });
const path = require('path');
const Database = require('./database');

// 데이터베이스 인스턴스 생성
const database = new Database();

// CORS 및 정적 파일 서빙 플러그인 등록
async function start() {
  try {
    // CORS 플러그인 등록
    await fastify.register(require('@fastify/cors'), {
      origin: true
    });

    // 정적 파일 서빙 플러그인 등록
    await fastify.register(require('@fastify/static'), {
      root: path.join(__dirname, 'public'),
      prefix: '/'
    });

    // 데이터베이스 초기화
    await database.initialize();

    // API 라우트들
    
    // 최신 통계 조회
    fastify.get('/api/stats/latest', async (request, reply) => {
      try {
        const stats = await database.getLatestStats();
        return { success: true, data: stats };
      } catch (error) {
        reply.code(500);
        return { success: false, error: error.message };
      }
    });

    // 통계 히스토리 조회
    fastify.get('/api/stats/history', async (request, reply) => {
      try {
        const { host, hours = 24 } = request.query;
        const stats = await database.getStatsHistory(host, parseInt(hours));
        return { success: true, data: stats };
      } catch (error) {
        reply.code(500);
        return { success: false, error: error.message };
      }
    });

    // 호스트 목록 조회
    fastify.get('/api/hosts', async (request, reply) => {
      try {
        const hosts = await database.getHosts();
        return { success: true, data: hosts };
      } catch (error) {
        reply.code(500);
        return { success: false, error: error.message };
      }
    });

    // 서버 상태 확인
    fastify.get('/api/health', async (request, reply) => {
      return { success: true, status: 'OK', timestamp: new Date().toISOString() };
    });

    // 루트 경로에서 대시보드 제공
    fastify.get('/', async (request, reply) => {
      return reply.sendFile('index.html');
    });

    // 서버 시작
    const port = process.env.PORT || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`웹 서버가 포트 ${port}에서 실행 중입니다.`);
    console.log(`대시보드: http://localhost:${port}`);
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// 우아한 종료 처리
process.on('SIGINT', async () => {
  console.log('\n서버를 종료하는 중...');
  await database.close();
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n서버를 종료하는 중...');
  await database.close();
  await fastify.close();
  process.exit(0);
});

module.exports = { start, fastify, database };
