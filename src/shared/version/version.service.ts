import { HttpStatus, Injectable ,Request} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DB_NAMES } from 'src/config/db.constant';
import { AppVersionModel } from './models/app-version.model';
import { ResponseService } from 'src/services/response.service';

@Injectable()
export class AppVersionService {
  constructor (
    @InjectModel(AppVersionModel.name, DB_NAMES().CORE_DB)
    private appVersionModel: Model<AppVersionModel>,
    private readonly res: ResponseService,
  ){}

  async read(req: Request, params: any): Promise<any> {
    try {
      const {app_id} = params;

      if(!app_id) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
      }

      const result = await this.appVersionModel.findOne({app_id}).lean()

      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      console.log('Error during reading app version')
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);

    }
  }
}
