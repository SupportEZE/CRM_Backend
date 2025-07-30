import { Body, Controller, Post, Req, Patch, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { AppExpenseService } from './app-expense.service';
import { AppCreateExpenseDto, AppReadExpenseDto, AppExpenseSummaryDto, AppDeleteSUbExpenseDto, AppExpenseDto, AppUpdateExpenseStatusDto } from '../app/dto/app-expense.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ExpenseService } from '../web/expense.service';
import { CreateSubExpenseDto, DetailExpenseDto, UpdateExpenseStatusDto } from '../web/dto/expense.dto';

@ApiTags('App-Expense')
@ApiBearerAuth('Authorization')
@Controller('app-expense')
export class AppExpenseController {
    constructor(
        private readonly appExpenseService: AppExpenseService,
        private readonly expenseService: ExpenseService,

    ) { }

    @Post('/create')
    @ApiOperation({ summary: 'Create an expense', description: 'Allows users to create a new expense record.' })
    @ApiBody({ type: AppCreateExpenseDto })
    async create(@Req() req: Request, @Body() params: AppCreateExpenseDto): Promise<AppCreateExpenseDto> {
        return await this.appExpenseService.createExpense(req, params);
    }

    @Post('/create-sub-expense')
    @ApiOperation({ summary: 'Create an expense', description: 'Allows users to create a new expense record.' })
    @ApiBody({ type: CreateSubExpenseDto })
    async createSubExpense(@Req() req: Request, @Body() params: CreateSubExpenseDto): Promise<CreateSubExpenseDto> {
        return await this.expenseService.createSubExpense(req, params);
    }

    @Post('/read')
    @ApiOperation({ summary: 'Read expenses', description: 'Fetches a list of expenses based on filters and pagination.' })
    @ApiBody({ type: AppReadExpenseDto })
    async read(@Req() req: Request, @Body() params: AppReadExpenseDto): Promise<AppReadExpenseDto> {
        return await this.appExpenseService.readExpense(req, params);
    }

    @Post('/detail')
    @ApiOperation({ summary: 'Get expense details', description: 'Fetches detailed information about a specific expense.' })
    @ApiBody({ type: DetailExpenseDto })
    async detail(@Req() req: Request, @Body() params: DetailExpenseDto): Promise<DetailExpenseDto> {
        return await this.expenseService.detailExpense(req, params);
    }

    @Post('/summary')
    @ApiOperation({ summary: 'Get expense summary', description: 'Retrieves total claim, approved, and paid amounts for a given month.' })
    @ApiBody({ type: AppExpenseSummaryDto })
    async getExpenseSummary(@Req() req: Request, @Body() params: AppExpenseSummaryDto) {
        return this.appExpenseService.getExpenseSummary(req, params);
    }

    @Patch('/delete-sub-expense')
    @ApiOperation({ summary: 'Delete Sub Expense', description: 'Delete Expnese' })
    @ApiBody({ type: AppDeleteSUbExpenseDto })
    async deleteSubExpense(@Req() req: Request, @Body() params: AppDeleteSUbExpenseDto) {
        return this.expenseService.deleteSubExpense(req, params);
    }

    @Patch('/update-status')
    @ApiOperation({ summary: 'Update expense status', description: 'Updates the status of an expense (e.g., approved, paid, rejected).' })
    @ApiBody({ type: AppUpdateExpenseStatusDto })
    async updateStatus(@Req() req: any, @Body() params: AppUpdateExpenseStatusDto): Promise<AppUpdateExpenseStatusDto> {
        return await this.appExpenseService.updateStatus(req, params);
    }

    @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
    @Post('upload')
    @UseInterceptors(FilesInterceptor('files', 5))
    async uploadFiles(
        @UploadedFiles() files: Express.Multer.File[],
        @Req() req: Request,
    ) {
        return await this.expenseService.upload(files, req);
    }

    @Post('/get-doc')
    async getDocumentById(@Req() req: Request, @Body() params: AppExpenseDto): Promise<AppExpenseDto> {
        return await this.expenseService.getDocumentByDocsId(req, params);
    }

    @Post('/expense-policy')
    async exepensePolicy(@Req() req: Request, @Body() params: any): Promise<any> {
        return await this.expenseService.userExpensePolicy(req, params);
    }
}
