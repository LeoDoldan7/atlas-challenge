import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    express.json({
      limit: '50mb',
    }),
  );

  app.use(
    express.urlencoded({
      limit: '50mb',
      extended: true,
      parameterLimit: 50000,
    }),
  );

  app.use(
    (
      req: { setTimeout: (timeout: number) => void },
      res: { setTimeout: (timeout: number) => void },
      next: () => void,
    ) => {
      req.setTimeout(300000);
      res.setTimeout(300000);
      next();
    },
  );

  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 API running at http://localhost:${port}`);
}

bootstrap().catch((e) => {
  console.error('Cannot start server', e);
});
