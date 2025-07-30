import { Injectable ,Request} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InternalApiLogModel } from './models/internal-api-log.model'
import { ExternalApiLogsModel } from './models/external-api-log.model';
import { DB_NAMES } from 'src/config/db.constant';
@Injectable()
export class ApilogService {
    constructor
    (
        @InjectModel(InternalApiLogModel.name,DB_NAMES().SUPPORT_DB) private internalApiLogModel: Model<InternalApiLogModel>,
        @InjectModel(ExternalApiLogsModel.name,DB_NAMES().SUPPORT_DB) private externalApiLogsModel: Model<InternalApiLogModel>,

    ){}

    async createLog(logData: any): Promise<any> {
        const newLog = new this.internalApiLogModel(logData);
        return newLog.save();
    }
    async createExternalLog(logData: any): Promise<any> {
        const newLog = new this.externalApiLogsModel(logData);
        return newLog.save();
    }
}
