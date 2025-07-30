import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    BadRequestException,
  } from '@nestjs/common';
  import * as multer from 'multer';
  import { diskStorage } from 'multer';
  import { Observable } from 'rxjs';
  import * as fs from 'fs';
  
  const basePath = process.cwd();
  const publicFolderPath =  `${basePath}/public`;
  const tmpFolderPath =  `${publicFolderPath}/tmp`;
  
  const storage = diskStorage({
    destination: (req: any, file: Express.Multer.File, cb: Function) => {
        if (!fs.existsSync(tmpFolderPath)) {
            try {
              fs.mkdirSync(tmpFolderPath, { recursive: true });
            } catch (err) {
              cb(new BadRequestException('Failed to create directory'), null);
              return;
            }
        }          
      cb(null, tmpFolderPath);
    },
    filename: (req: any, file: Express.Multer.File, cb: Function) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
     //   cb(null, uniqueSuffix + '-' + file.originalname); 
      cb(null,file.originalname); 
      
    },
  });
  
  const fileFilter = (req: any, file: Express.Multer.File, cb: Function) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf','text/csv'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new BadRequestException('Invalid file type. Only JPG, PNG, CSV and PDF are allowed.'));
    }
    cb(null, true);
  };
  
  // Set file size limit to 5MB
  const limits = { fileSize: 5 * 1024 * 1024 };
  
  @Injectable()
  export class FileUpload implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const req = context.switchToHttp().getRequest();
      const res = context.switchToHttp().getResponse();
      const upload = multer({ storage, fileFilter, limits }).single('file');
      return new Observable((observer) => {
        upload(req, res, function (err: any) {
          if (err) {
            observer.error(err);
          } else {
            next.handle().subscribe(observer);
          }
        });
      });
    }
  }
  