import {
  Body,
  Controller,
  Post,
  Req,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { AppActivityService } from './app-activity.service';
import {
  StartVisitDto,
  EndVisitDto,
  DetailVisitDto,
  AssignCustomers,
  AppBeatCustomers,
  AppBeatPerformance,
  AppCreateTicketFromActivityDto,
  AppReadCheckinForCustomerDto,
} from './dto/app-visit-activity.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CustomerTypeService } from 'src/modules/master/customer-type/web/customer-type.service';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { TicketService } from 'src/modules/master/ticket/web/ticket.service';
import { DuplicacyChecktDto } from 'src/modules/master/customer/default/web/dto/customer.dto';
import { CustomerService } from 'src/modules/master/customer/default/web/customer.service';
import { _IdDto, _IdsDto } from 'src/common/dto/common.dto';
import { SharedActivityService } from '../shared-activity.service';

export const enum activityRoutes {
  INSIGHTS = 'insights',
}

@ApiTags('App-Activity')
@ApiBearerAuth('Authorization')
@Controller('app-activity')
export class AppActivityController {
  constructor(
    private readonly appActivityService: AppActivityService,
    private readonly customerTypeService: CustomerTypeService,
    private readonly sharedCustomerService: SharedCustomerService,
    private readonly ticketService: TicketService,
    private readonly customerService: CustomerService,
    private readonly sharedActivityService: SharedActivityService,
  ) {}

  @Post('/customer-type')
  @ApiOperation({ summary: 'customer-type list' })
  async customerType(@Req() req: any, @Body() params: any): Promise<any> {
    return await this.customerTypeService.readDropdown(req, params);
  }

  @Post('/customer-type-tabs')
  @ApiOperation({ summary: 'assign customer list tabs with count' })
  async customerTypeTabs(@Req() req: any, @Body() params: any): Promise<any> {
    return await this.sharedCustomerService.countCustomerTypesAssignedToUser(
      req,
      params,
    );
  }

  @Post('/assign-customers')
  @ApiOperation({ summary: 'assign customer list' })
  @ApiBody({ type: AssignCustomers })
  async assignCustomers(
    @Req() req: any,
    @Body() params: AssignCustomers,
  ): Promise<AssignCustomers> {
    return await this.sharedCustomerService.assignCustomers(req, params);
  }

  @Post('/last-visit')
  @ApiOperation({ summary: 'last-visit' })
  async lastVisit(@Req() req: any, @Body() params: any): Promise<any> {
    return await this.appActivityService.lastVisit(req, params);
  }

  @ApiOperation({ summary: 'Visit Start.' })
  @ApiBody({ type: StartVisitDto })
  @Post('/visit-start')
  async visitStart(
    @Req() req: any,
    @Body() params: StartVisitDto,
  ): Promise<StartVisitDto> {
    return await this.appActivityService.visitStart(req, params);
  }

  @ApiOperation({ summary: 'Visit End.' })
  @ApiBody({ type: EndVisitDto })
  @Post('/visit-end')
  async visitEnd(
    @Req() req: any,
    @Body() params: EndVisitDto,
  ): Promise<EndVisitDto> {
    return await this.appActivityService.visitEnd(req, params);
  }

  @ApiOperation({ summary: 'Detail View Of Visit.' })
  @ApiBody({ type: DetailVisitDto })
  @Post('/detail')
  async detail(
    @Req() req: any,
    @Body() params: DetailVisitDto,
  ): Promise<DetailVisitDto> {
    return await this.appActivityService.detail(req, params);
  }

  @Post('/beat-customers')
  @ApiOperation({ summary: 'beat-customers list' })
  @ApiBody({ type: AppBeatCustomers })
  async beatCustomers(
    @Req() req: any,
    @Body() params: AppBeatCustomers,
  ): Promise<AppBeatCustomers> {
    return await this.sharedCustomerService.beatCustomers(req, params);
  }

  @Post('/insights')
  @ApiOperation({ summary: 'beat-performance list' })
  @ApiBody({ type: AppBeatPerformance })
  async visitBeatPerformance(
    @Req() req: any,
    @Body() params: AppBeatPerformance,
  ): Promise<AppBeatPerformance> {
    return await this.appActivityService.visitBeatPerformance(req, params);
  }

  @Post('/fetch-checkin-for-customer')
  @ApiOperation({ summary: 'checkin list of customer' })
  @ApiBody({ type: AppReadCheckinForCustomerDto })
  async fetchCheckinDataForCustomer(
    @Req() req: any,
    @Body() params: AppReadCheckinForCustomerDto,
  ): Promise<AppReadCheckinForCustomerDto> {
    return await this.appActivityService.fetchCheckinDataForCustomer(
      req,
      params,
    );
  }

  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.appActivityService.upload(files, req);
  }

  @ApiOperation({ summary: 'create ticket from checkin' })
  @Post('create-ticket')
  async createTicket(
    @Req() req: Request,
    @Body() params: AppCreateTicketFromActivityDto,
  ) {
    return await this.ticketService.create(req, params);
  }
  @Post('/duplicate')
  @ApiOperation({ summary: 'Check for duplicate customer' })
  @ApiBody({ type: DuplicacyChecktDto })
  async duplicate(@Req() req: Request, @Body() params: DuplicacyChecktDto) {
    return await this.customerService.duplicate(req, params);
  }

  @Post('/get-docs')
  async getDocumentById(
    @Req() req: Request,
    @Body() params: _IdsDto,
  ): Promise<_IdsDto> {
    return await this.sharedActivityService.getDocumentByDocsId(req, params);
  }
}
