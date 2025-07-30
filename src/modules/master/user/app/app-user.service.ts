import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserModel } from '../models/user.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { UserHierarchyModel } from '../models/user-hierarchy.model';
import { SharedUserService } from '../shared-user.service';

@Injectable()
export class AppUserService {
    constructor(
        @InjectModel(UserModel.name) private userModel: Model<UserModel>,
        @InjectModel(UserHierarchyModel.name) private userHierarchyModel: Model<UserHierarchyModel>,
        private readonly res: ResponseService,
        private readonly sharedUserService: SharedUserService,
        
        
    ) { }
    
    async profile(req: Request, params: any): Promise<any> {
        try {
            const result:Record<string,any>={};
            result.basic_info = req['user']
            result.profile_percentage = await this.sharedUserService.profilePercentage(req,params,result);
            result.files = await this.sharedUserService.getDocument(result.basic_info._id, global.THUMBNAIL_IMAGE);
            return this.res.success('SUCCESS.FETCH',result);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    
}
