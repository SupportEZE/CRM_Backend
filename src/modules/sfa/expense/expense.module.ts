import { Module } from '@nestjs/common';
import { ExpenseController } from './web/expense.controller';
import { AppExpenseController } from './app/app-expense.controller';
import { ExpenseService } from './web/expense.service';
import { AppExpenseService } from './app/app-expense.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AllowanceModel, AllowanceSchema } from './models/allowance-master.model';
import { ResponseService } from 'src/services/response.service';
import { DateTimeService } from 'src/services/date-time.service';
import { LocationService } from 'src/services/location.service';
import { UserModel, UserSchema } from 'src/modules/master/user/models/user.model';
import { FormBuilderModule } from 'src/shared/form-builder/form-builder.module';
import { ExpenseModel, ExpenseSchema } from './models/expense.model';
import { SubExpenseModel, SubExpenseSchema } from './models/sub-expense.model';
import { ExpenseDocsModel, ExpenseDocsSchema } from './models/expense-docs.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { UserModule } from 'src/modules/master/user/user.module';
import { GlobalModule } from 'src/shared/global/global.module';
import { DropdownModule } from 'src/modules/master/dropdown/dropdown.module';
import { OptionModel, OptionSchema } from 'src/modules/master/dropdown/models/dropdown-options.model';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ExpenseDocsModel.name, schema: ExpenseDocsSchema },
            { name: AllowanceModel.name, schema: AllowanceSchema },
            { name: UserModel.name, schema: UserSchema },
            { name: ExpenseModel.name, schema: ExpenseSchema },
            { name: SubExpenseModel.name, schema: SubExpenseSchema },
            { name: OptionModel.name, schema: OptionSchema }
        ]),
        FormBuilderModule,
        UserModule,
        GlobalModule,
        DropdownModule
    ],
    controllers: [ExpenseController, AppExpenseController],
    providers: [ExpenseService, ResponseService, DateTimeService, LocationService, AppExpenseService, S3Service],
    exports:[ExpenseService,AppExpenseService]
})

export class ExpenseModule { }
