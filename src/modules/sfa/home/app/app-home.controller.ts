import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { AppHomeService } from './app-home.service';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { AssignCustomersForHome } from './dto/app-home.dto';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';

@ApiTags('App-Home')
@ApiBearerAuth('Authorization')
@Controller('app-home')
export class AppHomeController {
    constructor(
        private readonly apphomeService: AppHomeService,
        private readonly sharedCustomerService: SharedCustomerService,        
        private readonly sharedUserService: SharedUserService,        
    ) { }
    
    @ApiOperation({ summary:'To Fetch home page data.'})
    @Post('/read')
    async read(@Req() req: any, @Body() params: any): Promise<any> {
        return await this.apphomeService.read(req, params);
    }

    @Post('/assign-customer-types')
    @ApiOperation({ summary: 'assign customer list tabs with count' })
    async customerTypeTabs(@Req() req: any, @Body() params: any): Promise<any> {
        return await this.sharedCustomerService.countCustomerTypesAssignedToUser(req, params);
    }
    
    @Post('/assign-customers')
    @ApiOperation({ summary: 'assign customer list' })
    @ApiBody({ type: AssignCustomersForHome })
    async assignCustomers(@Req() req: any, @Body() params: AssignCustomersForHome): Promise<AssignCustomersForHome> {
        return await this.sharedCustomerService.assignCustomers(req, params);
    }

    @Post('/working-timeline')
    @ApiOperation({ summary: 'working-timeline' })
    async workingTimeline(@Req() req: any, @Body() params: any): Promise<any> {
        return await this.sharedUserService.readUserWorkingActivity(req, params);
    }
}
