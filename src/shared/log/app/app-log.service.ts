import { Injectable } from '@nestjs/common';
import { ResponseService } from 'src/services/response.service';
@Injectable()
export class AppLogService {
    constructor
        (
            private readonly res: ResponseService
        ) { }
}
