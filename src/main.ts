require('dotenv').config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { RequestTimeLogInterceptor } from './core/interceptors/RequestTimeLogInterceptor';
import { FileSDK } from '@oodles-dev/file-sdk';

async function bootstrap() {
  const port = process.env.PORT || 3000;
  FileSDK.fileApiUrl = process.env.API_FILE;
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new RequestTimeLogInterceptor());
  await app.listen(port);
  console.info(`Application started on port ${port}`);
}
bootstrap();
