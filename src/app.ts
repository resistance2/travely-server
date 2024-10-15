import * as dotenv from 'dotenv';
import express, { json, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import { connectDatabase, disconnectDatabase } from './db/connect';
import imageRoutes from './api/routes/image.routes';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

let server: ReturnType<typeof app.listen>;

async function startServer() {
  await connectDatabase();

  server = app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
    process.send?.('ready');
  });

  // middlewares
  app.use(json());
  app.use(morgan('dev'));
  app.use(helmet());
  app.use(
    cors({
      origin: '*',
    }),
  );

  // 라우터 추가
  app.use('/api/images', imageRoutes);

  //! 배포 테스트용 라우트
  app.get('/', (_req, res) => {
    res.send('Hello World');
  });

  // global Error handler
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    console.error(`Error ${err.message} | URL: ${req.url} | Method: ${req.method}`);
    res.status(500).json({
      message: err.message,
      stack: err.stack,
    });
  });

  return app;
}

async function stopServer() {
  await disconnectDatabase();
  server.close(async (err) => {
    if (err) console.error(err);
  });
}

startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('서버 종료');
  stopServer().then(() => process.exit(0));
  setTimeout(() => {
    console.error('프로세스 강제 종료');
    process.exit(1);
  }, 30000);
});

process.on('SIGTERM', () => {
  console.log('서버 종료');
  stopServer().then(() => process.exit(0));
  setTimeout(() => {
    console.error('프로세스 강제 종료');
    process.exit(1);
  }, 30000);
});
