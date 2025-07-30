import { Body, Controller, Post, Req, Patch, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ExpenseService } from './expense.service';
import { ReadAllowanceDto, SaveAllowanceDto } from './dto/allowance.dto';
import { ReadExpenseDto, DetailExpenseDto, CreateSubExpenseDto, UpdateExpenseStatusDto, DeleteSUbExpenseDto, DeleteExpenseImageDto, expensDocsDto, CreateExpenseDto, expensePolicyDto } from './dto/expense.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Web-Expense')
@ApiBearerAuth('Authorization')
@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) { }

  @Post('/create')
  @ApiOperation({ summary: 'Create an expense', description: 'Allows users to create a new expense record.' })
  @ApiBody({ type: CreateExpenseDto })
  async create(@Req() req: any, @Body() params: CreateExpenseDto): Promise<CreateExpenseDto> {
    return await this.expenseService.createExpense(req, params);
  }

  @Patch('/delete')
  @ApiOperation({ summary: 'Delete an expense', description: 'Allows users to delete a expense record.' })
  @ApiBody({ type: CreateExpenseDto })
  async deleteExpense(@Req() req: any, @Body() params: any): Promise<CreateExpenseDto> {
    return await this.expenseService.deleteExpense(req, params);
  }

  @Post('/create-sub-expense')
  @ApiOperation({ summary: 'Create an expense', description: 'Allows users to create a new expense record.' })
  @ApiBody({ type: CreateSubExpenseDto })
  async createSubExpense(@Req() req: any, @Body() params: CreateSubExpenseDto): Promise<CreateSubExpenseDto> {
    return await this.expenseService.createSubExpense(req, params);
  }

  @Post('/read-allowance-master')
  @ApiOperation({ summary: 'Fetch allowance master', description: 'Retrieves allowance master details.' })
  @ApiBody({ type: ReadAllowanceDto })
  async readAllowanceMaster(@Req() req: any, @Body() params: ReadAllowanceDto): Promise<ReadAllowanceDto> {
    return await this.expenseService.readAllowanceMaster(req, params);
  }

  @Post('/save-allowance-master')
  @ApiOperation({ summary: 'Save allowance master', description: 'Creates or updates an allowance master entry.' })
  @ApiBody({ type: SaveAllowanceDto })
  async saveAllowanceMaster(@Req() req: any, @Body() params: SaveAllowanceDto): Promise<SaveAllowanceDto> {
    return await this.expenseService.saveAllowanceMaster(req, params);
  }


  @Post('/read')
  @ApiOperation({ summary: 'Read expenses', description: 'Fetches a list of expenses based on filters and pagination.' })
  @ApiBody({ type: ReadExpenseDto })
  async read(@Req() req: any, @Body() params: ReadExpenseDto): Promise<ReadExpenseDto> {
    return await this.expenseService.readExpense(req, params);
  }

  @Post('/detail')
  @ApiOperation({ summary: 'Get expense details', description: 'Fetches detailed information about a specific expense.' })
  @ApiBody({ type: DetailExpenseDto })
  async detail(@Req() req: any, @Body() params: DetailExpenseDto): Promise<DetailExpenseDto> {
    return await this.expenseService.detailExpense(req, params);
  }

  @Patch('/update-status')
  @ApiOperation({ summary: 'Update expense status', description: 'Updates the status of an expense (e.g., approved, paid, rejected).' })
  @ApiBody({ type: UpdateExpenseStatusDto })
  async updateStatus(@Req() req: any, @Body() params: UpdateExpenseStatusDto): Promise<UpdateExpenseStatusDto> {
    return await this.expenseService.updateStatus(req, params);
  }

  @Patch('/delete-sub-expense')
  @ApiOperation({ summary: 'Delete Sub Expense', description: 'Delete Expnese' })
  @ApiBody({ type: DeleteSUbExpenseDto })
  async deleteSubExpense(@Req() req, @Body() params: DeleteSUbExpenseDto) {
    return this.expenseService.deleteSubExpense(req, params);
  }


  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.expenseService.upload(files, req);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: expensDocsDto): Promise<expensDocsDto> {
    return await this.expenseService.getDocumentByDocsId(req, params);
  }

  @Patch('/delete-file')
  async deleteFile(@Req() req: Request, @Body() params: DeleteExpenseImageDto): Promise<DeleteExpenseImageDto> {
    return await this.expenseService.deleteFile(req, params);
  }

  @Post('/policy')
  async exepensePolicy(@Req() req: Request, @Body() params: expensePolicyDto): Promise<expensePolicyDto> {
    return await this.expenseService.userExpensePolicy(req, params);
  }

}
