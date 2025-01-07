import cors from 'cors';
import * as dotenv from 'dotenv';
import express, { json, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { imageRouter } from './api/imageUpload/image.routes';
import { reviewRouter } from './api/review/review.routes';
import { travelRouter } from './api/travel/travel.route';
import { travelGuideRouter } from './api/travelGuide/travelGuide.route';
import { userRouter } from './api/user/user.routes';
import { connectDatabase, disconnectDatabase } from './db/connect';

import swaggerUiExpress from 'swagger-ui-express';
import swaggerSpec from './public/My Project.openapi.json';

import path from 'path';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const VERSION = process.env.VERSION || 'v1';

let server: ReturnType<typeof app.listen>;

async function startServer() {
  await connectDatabase();

  server = app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
    process.send?.('ready');
  });

  // middlewares
  app.use(json());
  app.use(
    cors({
      origin: '*',
    }),
  );
  app.use(morgan('combined'));
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    console.error(`Error ${err.message} | URL: ${req.url} | Method: ${req.method}`);
    res.status(500).json({
      message: err.message,
      stack: err.stack,
    });
  });

  // routes
  app.use('/api/images', imageRouter);
  app.use(`/api/${VERSION}/users`, userRouter);
  app.use(`/api/${VERSION}/travels`, travelRouter);
  app.use(`/api/${VERSION}/reviews`, reviewRouter);
  app.use(`/api/${VERSION}/travels-guide`, travelGuideRouter);

  app.get('/', (_req, res) => {
    res.send('Hello World');
  });

  // app.use(
  //   '/api/api-docs',
  //   swaggerUiExpress.serve,
  //   swaggerUiExpress.setup(swaggerSpec, { explorer: true }),
  // );
  app.use('/api-docs', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'My Project.html'));
  });
  return app;
}

async function stopServer() {
  console.log('서버 종료중');
  await disconnectDatabase();
  server.close(async (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    } else {
      console.log('서버 종료');
    }
  });
}

startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('SIGINT 신호 수신');
  stopServer();
});

process.on('SIGTERM', () => {
  console.log('SIGTERM 신호 수신');
  stopServer();
});
