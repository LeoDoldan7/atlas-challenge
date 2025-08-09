import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure Express middleware for larger payloads
  const express = require('express');
  
  // Increase payload size limits and timeout for all routes
  app.use(express.json({ 
    limit: '50mb',
    verify: (req: any, res: any, buf: any, encoding: string) => {
      // Custom verification if needed
    }
  }));
  
  app.use(express.urlencoded({ 
    limit: '50mb', 
    extended: true,
    parameterLimit: 50000
  }));

  // Set request timeout
  app.use((req: any, res: any, next: any) => {
    req.setTimeout(300000); // 5 minutes
    res.setTimeout(300000); // 5 minutes
    next();
  });

  // Enable CORS for frontend development
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3001',
      'http://localhost:4000',
    ],
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
