import './constants/constants';
import './constants/redis-keys.contants';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllConfigType } from './config/config.type';
import validationOptions from './utils/validation-options';
import * as express from 'express';
import { join } from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as bodyParser from 'body-parser';
import { Environment } from './config/app.config';
import { setupSwagger } from './config/swagger';
import * as basicAuth from 'express-basic-auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn']
  });
  app.use(bodyParser.json({ limit: '5mb' }));
  app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));
  const configService = app.get(ConfigService<AllConfigType>);
  const prefix = configService.getOrThrow('app.apiPrefix', { infer: true });
  app.use(express.static(join(__dirname, '..', 'public')));
  app.setGlobalPrefix(configService.getOrThrow('app.apiPrefix', { infer: true }), {
    exclude: ['/'],
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.use(
    [`/api/docs`],
    basicAuth({
      users: { EzeOne: 'EzeOne@CRM' },
      challenge: true,
    }),
  );

  setupSwagger(app, prefix);
  const PORT: number = configService.getOrThrow('app.port', { infer: true })
  const HOST: string = '0.0.0.0'
  const localCorsOrigins = process.env.LOCAL_CORS_ORIGIN_URL?.split(',').map(origin => origin.trim());
  const corsOrigins = process.env.CORS_ORIGIN_URL?.split(',').map(origin => origin.trim());
  const API_HTTPS_URL = `https://works.ezeone.tech:${PORT}`;

  if (process.env.NODE_ENV === Environment.LOCAL) {
    app.enableCors({
      origin: localCorsOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
    await app.listen(PORT, HOST);
    console.info(`Server is running locally at: ${PORT}`);
  } else {
    app.enableCors({
      origin: corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });

    let sslOptions: Record<string, any>;
    try {
      if (process.env.NODE_ENV === Environment.STAGE) {
        sslOptions = {
          key: fs.readFileSync('/home/ssl_2025/ezeone.key'),
          cert: fs.readFileSync('/home/ssl_2025/STAR_ezeone_tech.crt'),
          ca: fs.readFileSync('/home/ssl_2025/STAR_ezeone_tech.ca-bundle'),
        };
      } else {
        sslOptions = {
          key: fs.readFileSync('/home/ez_ssl/ezeone.key'),
          cert: fs.readFileSync('/home/ez_ssl/STAR_ezeone_tech.crt'),
          ca: fs.readFileSync('/home/ez_ssl/STAR_ezeone_tech.ca-bundle'),
        };
      }
    } catch (error) {
      console.error('SSL certificate files not found or unreadable:', error);
      process.exit(1);
    }

    await app.init();
    const server = https.createServer(sslOptions, app.getHttpAdapter().getInstance());
    server.listen(PORT, HOST, () => {
      console.info(`Server is running securely at: ${API_HTTPS_URL}`);
    });
  }
}

bootstrap();
