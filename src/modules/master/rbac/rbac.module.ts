import { Module } from '@nestjs/common';
import { RbacController } from './web/rbac.controller';
import { RbacService } from './web/rbac.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { ModulePerModel, ModulePerSchema } from './models/module-permission.model';
import { SubModulePerModel, SubModulePerSchema } from './models/sub-module-permission.model';
import { UserRoleModel, UserRoleSchema } from './models/user-role.model';
import { UserModel, UserSchema } from '../user/models/user.model';
import { ApilogModule } from 'src/shared/apilog/apilog.module';
import { ModuleMasterModel,ModuleMasterSchema } from './models/module-master.model';
import { SubModuleMasterModel,SubModuleMasterMSchema } from './models/sub-module-master';
import { LoginTypeModel,LoginTypeSchema } from './models/login-type.model';
import { CustomerTypeModel,CustomerTypeSchema } from '../customer-type/models/customer-type.model';
import { OrgModel,OrgSchema } from '../org/models/org.model';
import { OrgLoginTypeModel, OrgLoginTypeSchema } from './models/org-login-type.model';
import { UserModule } from '../user/user.module';
import { FormBuilderModule } from 'src/shared/form-builder/form-builder.module';
import { TableBuilderModule } from 'src/shared/table-builder/table-builder.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ModulePerModel.name, schema: ModulePerSchema },
            { name: SubModulePerModel.name, schema: SubModulePerSchema },
            { name: UserModel.name, schema: UserSchema },
            { name: UserRoleModel.name, schema: UserRoleSchema },
            { name: ModuleMasterModel.name, schema: ModuleMasterSchema },
            { name: SubModuleMasterModel.name, schema: SubModuleMasterMSchema },
            { name: LoginTypeModel.name, schema: LoginTypeSchema },
            { name: CustomerTypeModel.name, schema: CustomerTypeSchema },
            { name: OrgModel.name, schema: OrgSchema },
            { name: OrgLoginTypeModel.name, schema: OrgLoginTypeSchema },
            
        ]),
        ApilogModule,
        UserModule,
        FormBuilderModule,
        TableBuilderModule
    ],
    controllers: [RbacController],
    providers: [RbacService, ResponseService],
    exports:[RbacService]
})
export class RbacModule { }
