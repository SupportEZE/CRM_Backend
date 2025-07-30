import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { AllowanceModel } from '../models/allowance-master.model';
import { ExpenseModel, expenseTypeUnit } from '../models/expense.model';
import { SubExpenseModel } from '../models/sub-expense.model';
import { Model } from 'mongoose';
import { toObjectId, commonFilters, titleCase, nextSeq } from 'src/common/utils/common.utils';
import { UserModel } from 'src/modules/master/user/models/user.model';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { FormBuilderService } from 'src/shared/form-builder/form-builder.service';
import { S3Service } from 'src/shared/rpc/s3.service';
import { ExpenseDocsModel } from '../models/expense-docs.model';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { WorkingActivityType } from 'src/modules/master/user/models/user-working-activity.model';
import { ExpenseStatus } from './dto/expense.dto';
import { GlobalService } from 'src/shared/global/global.service';
import { DropdownService } from 'src/modules/master/dropdown/web/dropdown.service';
import { OptionModel } from 'src/modules/master/dropdown/models/dropdown-options.model';
@Injectable()
export class ExpenseService {
    constructor(
        @InjectModel(ExpenseDocsModel.name) private expenseDocsModel: Model<ExpenseDocsModel>,
        @InjectModel(AllowanceModel.name) private allowanceModel: Model<AllowanceModel>,
        @InjectModel(UserModel.name) private userModel: Model<UserModel>,
        @InjectModel(ExpenseModel.name) private expenseModel: Model<ExpenseModel>,
        @InjectModel(SubExpenseModel.name) private subExpenseModel: Model<SubExpenseModel>,
        @InjectModel(OptionModel.name) private optionModel: Model<OptionModel>,
        private readonly res: ResponseService,
        private readonly formBuilderService: FormBuilderService,
        private readonly s3Service: S3Service,
        private readonly sharedUserService: SharedUserService,
        private readonly globalService: GlobalService,
        private readonly dropdownService: DropdownService,
    ) { }

    async upload(files: Express.Multer.File[], req: any): Promise<any> {
        try {
            req.body.module_name = Object.keys(global.MODULES).find(
                key => global.MODULES[key] === global.MODULES['Expense']
            );
            let response = await this.s3Service.uploadMultiple(files, req, this.expenseDocsModel);
            return this.res.success('SUCCESS.CREATE', response);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'Error uploading files to S3', error);
        }
    }
    async getDocument(
        id: any,
        type: typeof global.FULL_IMAGE | typeof global.THUMBNAIL_IMAGE | typeof global.BIG_THUMBNAIL_IMAGE = global.FULL_IMAGE
    ): Promise<any> {
        return this.s3Service.getDocumentsByRowId(this.expenseDocsModel, id, type);
    }
    async getDocumentByDocsId(req: any, params: any): Promise<any> {
        const doc = await this.s3Service.getDocumentsById(this.expenseDocsModel, params._id);
        return this.res.success('SUCCESS.FETCH', doc);
    }

    // async readAllowanceMaster(req: Request, params: Record<string, any>): Promise<any> {
    //     try {
    //         params.internalCall = true
    //         let formData = await this.formBuilderService.read(req, params);
    //         formData = await formData.form_data.filter((row: any) => row.key_source === 'custom')
    //         formData = await formData.map((row: any) => {
    //             return {
    //                 label: row.name,
    //                 type: row.type
    //             }
    //         })
    //         formData = formData.reduce((acc: Record<string, any>, item) => {
    //             if (item.type === "CHECKBOX_SELECT") {
    //                 acc[item.label] = false;  // Set value to false if type is CHECKBOX_SELECT
    //             } else if (item.type === "SHORT_TEXT" || item.type === "NUMBER") {
    //                 acc[item.label] = 0;  // Set value to 0 if type is SHORT_TEXT
    //             }
    //             return acc;
    //         }, {});
    //         // Define base match condition
    //         const match: Record<string, any> = {
    //             is_delete: 0,
    //             org_id: req['user']['org_id'],
    //             login_type_id: { $in: [4, 12] }
    //         };

    //         Object.assign(match, commonFilters(params.filters)); // Merge filters with match condition

    //         if (match?.user_id) {
    //             match._id = match.user_id
    //             delete match.user_id
    //         }

    //         // Sorting configuration
    //         const sorting: Record<string, 1 | -1> = params?.sorting && Object.keys(params.sorting).length ? params.sorting : { _id: -1 };

    //         // Aggregation pipeline
    //         const result = await this.userModel.aggregate([
    //             { $match: match },
    //             { $sort: sorting },
    //             {
    //                 $lookup: {
    //                     from: COLLECTION_CONST().CRM_ALLOWANCE_MASTER, // Ensure this matches your actual allowance collection name
    //                     localField: "_id",
    //                     foreignField: "user_id",
    //                     as: "allowance_data"
    //                 }
    //             },
    //             {
    //                 $project: {
    //                     user_id: "$_id", // Assign _id to user_id
    //                     _id: 1, // Remove _id
    //                     name: 1,
    //                     designation: 1,
    //                     form_data: {
    //                         $ifNull: [
    //                             { $arrayElemAt: ["$allowance_data.form_data", 0] },
    //                             formData // If form_data doesn't exist, push formData
    //                         ]
    //                     }
    //                 }
    //             }
    //         ]);
    //         return this.res.success('SUCCESS.FETCH', result);
    //     } catch (error) {
    //         return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    //     }
    // }

    async readAllowanceMaster(req: Request, params: Record<string, any>): Promise<any> {
        try {
            const { expense_policy_type } = req['user']['org'];
            params.internalCall = true;

            let formData = await this.formBuilderService.read(req, params);
            formData = formData.form_data
                .filter((row: any) => row.key_source === 'custom')
                .map((row: any) => ({ label: row.name, type: row.type }));

            formData = formData.reduce((acc: Record<string, any>, item) => {
                if (item.type === "CHECKBOX_SELECT") acc[item.label] = false;
                else if (item.type === "SHORT_TEXT" || item.type === "NUMBER") acc[item.label] = 0;
                return acc;
            }, {});

            if (expense_policy_type === 'Designation') {
                params.module_id = 7;
                params.dropdown_name = 'designation';

                const match: Record<string, any> = {
                    is_delete: 0,
                    module_id: 7,
                    org_id: req['user']['org_id'],
                    dropdown_name: 'designation'
                };

                const result = await this.optionModel.aggregate([
                    { $match: match },
                    {
                        $lookup: {
                            from: COLLECTION_CONST().CRM_ALLOWANCE_MASTER,
                            localField: '_id',
                            foreignField: 'user_id',
                            as: 'allowance_data'
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            user_id: '$_id',
                            name: '$option_name',
                            designation: '$option_name',
                            form_data: {
                                $ifNull: [
                                    { $arrayElemAt: ['$allowance_data.form_data', 0] },
                                    formData
                                ]
                            }
                        }
                    }
                ]);
                return this.res.success('SUCCESS.FETCH', result);
            }

            const match: Record<string, any> = {
                is_delete: 0,
                org_id: req['user']['org_id'],
                login_type_id: { $in: [4, 12] }
            };

            Object.assign(match, commonFilters(params.filters));
            if (match.user_id) {
                match._id = match.user_id;
                delete match.user_id;
            }

            const sorting = Object.keys(params?.sorting || {}).length ? params.sorting : { _id: -1 };

            const result = await this.userModel.aggregate([
                { $match: match },
                { $sort: sorting },
                {
                    $lookup: {
                        from: COLLECTION_CONST().CRM_ALLOWANCE_MASTER,
                        localField: '_id',
                        foreignField: 'user_id',
                        as: 'allowance_data'
                    }
                },
                {
                    $project: {
                        user_id: '$_id',
                        _id: 1,
                        name: 1,
                        designation: 1,
                        form_data: {
                            $ifNull: [
                                { $arrayElemAt: ['$allowance_data.form_data', 0] },
                                formData
                            ]
                        }
                    }
                }
            ]);
            return this.res.success('SUCCESS.FETCH', result);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async saveAllowanceMaster(req: any, params: any): Promise<any> {
        try {
            const { expense_policy_type } = req['user']['org'];
            let exist: Record<string, any>

            if (expense_policy_type === 'Designation') {
                //params.user_id means _id of Option Model
                exist = await this.optionModel.findOne({ _id: params.user_id, is_delete: 0 }).exec();
                if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'USER.DESIGNATION_NOT_FOUND');
            } else {
                exist = await this.userModel.findOne({ _id: params.user_id, is_delete: 0 }).exec();
                if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'USER.NOT_EXIST');
            }

            let existingRecord: Record<string, any> = await this.allowanceModel.findOne({ user_id: toObjectId(params.user_id) }).lean();
            params.user_id = toObjectId(params.user_id)

            const saveObj: Record<string, any> = {
                ...req['createObj'],
                ...params
            };

            if (existingRecord) {
                await this.allowanceModel.updateOne(
                    { user_id: params.user_id },
                    saveObj
                );
                return this.res.success('SUCCESS.CREATE');
            } else {
                const document = new this.allowanceModel(saveObj);
                await document.save();
                return this.res.success('SUCCESS.CREATE');
            }
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async createExpense(req: any, params: any): Promise<any> {
        try {

            params.user_id = req['user']['_id']
            const orgId = req['user']['org_id']
            const startDate = new Date(params.start_date);
            const endDate = new Date(params.end_date);
            const exist: Record<string, any> = await this.expenseModel.findOne({
                org_id: orgId,
                user_id: toObjectId(params.user_id),
                is_delete: 0,
                start_date: { $lte: endDate },
                end_date: { $gte: startDate }
            }).exec();

            if (exist) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');

            params.user_id = toObjectId(params.user_id);

            const seq = {
                modelName: this.expenseModel,
                idKey: 'expense_id',
                prefix: 'EXP'
            }

            const newExpenseId = await nextSeq(req, seq)

            const saveObj: Record<string, any> = {
                ...req['createObj'],
                ...params,
                expense_id: newExpenseId,
            };

            if (req?.['user']?.['org']?.['is_expesne_senior_status']) {
                saveObj['senior_status'] = global.EXPENSE_STATUS[6];
            }
            const document = new this.expenseModel(saveObj);
            const insert = await document.save();
            if (!insert._id) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.EXPENSE_NOT_CREATED');
            return this.res.success('SUCCESS.CREATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async deleteExpense(req: any, params: any): Promise<any> {
        try {
            const expenseId = toObjectId(params._id);
            const orgId = req['user']['org_id'];

            const expense = await this.expenseModel.findOne({
                _id: expenseId,
                org_id: orgId,
                is_delete: 0
            });

            if (!expense) {
                return this.res.error(HttpStatus.NOT_FOUND, 'WARNING.EXPENSE_NOT_FOUND');
            }

            const updated = await this.expenseModel.updateOne(
                { _id: expenseId },
                {
                    $set: {
                        is_delete: 1,
                        deleted_at: new Date(),
                        deleted_by: req['user']['_id']
                    }
                }
            );

            if (updated.modifiedCount === 0) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.DELETE_FAILED');
            }

            return this.res.success('SUCCESS.DELETE');

        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async createSubExpense(req: any, params: any): Promise<any> {
        try {
            params.expense_id = toObjectId(params.expense_id)

            let match: Record<string, any> = {
                is_delete: 0,
                org_id: req['user']['org_id'],
                _id: params.expense_id
            };
            const exist: Record<string, any> = await this.expenseModel.findOne(match).exec();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');

            const sub_expenses = params.sub_expense;
            const subExpensesData = sub_expenses.map((item: any) => ({
                org_id: req['user']['org_id'],
                expense_id: params.expense_id,
                expense_date: item.expense_date,
                expense_amount: item.expense_amount,
                expense_type: item.expense_type,
                expense_type_value: item.expense_type_value,
                expense_type_unit: item.expense_type_unit,
                description: item?.description || null,
                km: item?.km || null,
                ...req['createObj'],

            }));
            const updateObj: Record<string, any> = {
                ...req['updateObj'],
                is_delete: 2,
            }

            if (!req.url.includes(global.MODULE_ROUTES[20]) && !req.url.includes(global.MODULE_ROUTES[25])) {
                await this.subExpenseModel.updateMany({ expense_id: params.expense_id, org_id: req['user']['org_id'] }, updateObj);
            }
            await this.subExpenseModel.insertMany(subExpensesData);
            const exist_sub_expense = await this.subExpenseModel.find({
                expense_id: params.expense_id,
                org_id: req['user']['org_id'],
                is_delete: 0
            }).exec();
            const claimAmount: number = exist_sub_expense.reduce((sum: number, item: any) => sum + (item.expense_amount || 0), 0);
            const totalItem: number = exist_sub_expense.length;
            await this.expenseModel.updateOne(
                { _id: params.expense_id, org_id: req['user']['org_id'] },
                {
                    $set: {
                        claim_amount: claimAmount,
                        total_item: totalItem
                    }
                }
            );
            if (req['user']['login_type_id'] === global.LOGIN_TYPE_ID['FIELD_USER']) {
                const data = {
                    working_activity_type: WorkingActivityType.EXPENSE_CLAIMED,
                    working_activity_id: params.expense_id,
                    display_name: claimAmount
                }
                this.sharedUserService.saveUserWorkingActivity(req, data);
            }
            return this.res.success('SUCCESS.CREATE', { inserted_id: params.expense_id });
        } catch (error) {
            if (req.url.includes(global.MODULE_ROUTES[24])) throw error
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async readExpense(req: any, params: any): Promise<any> {
        try {
            let orgId = req['user']['org_id']
            let match: Record<string, any> = { is_delete: 0, org_id: orgId };
            let sorting: Record<string, 1 | -1> = { _id: -1 };
            if (params?.sorting && Object.keys(params.sorting).length !== 0) {
                sorting = params.sorting;
            }
            if (params?.activeTab) {
                const statusMapping: Record<string, string> = {
                    'Submitted': global.EXPENSE_STATUS[1],
                    'Approved': global.EXPENSE_STATUS[2],
                    'Reject': global.EXPENSE_STATUS[3],
                    'Paid': global.EXPENSE_STATUS[4],
                    'Draft': global.EXPENSE_STATUS[5],
                };
                match.status = statusMapping[params.activeTab] || match.status;
            }

            Object.assign(match, commonFilters(params.filters))

            const statusMatch: Record<string, any> = {
                is_delete: 0,
                org_id: orgId
            }

            if (global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])) {
                let userIds: any[] = []
                if (params?.activeTab === global.EXPENSE_STATUS[5]) {
                    userIds = [req['user']['_id']]
                } else {
                    userIds = await this.sharedUserService.getUsersIds(req, params);
                    statusMatch.$or = [
                        { user_id: { $in: userIds } },
                        { created_id: { $in: userIds } }
                    ];
                }
                match.$or = [
                    { user_id: { $in: userIds } },
                    { created_id: { $in: userIds } }
                ];

            }
            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;
            const pipeline = [
                { $match: match },
                {
                    $lookup: {
                        from: COLLECTION_CONST().CRM_USER_HIERARCHY,
                        localField: 'user_id',
                        foreignField: 'child_user_id',
                        as: 'rm_data'
                    }
                },
                {
                    $addFields: {
                        rm_data: { $arrayElemAt: ['$rm_data', 0] }
                    }
                },
                {
                    $lookup: {
                        from: COLLECTION_CONST().CRM_USERS,
                        localField: 'user_id',
                        foreignField: '_id',
                        as: 'user_data'
                    }
                },
                {
                    $addFields: {
                        user_data: { $arrayElemAt: ['$user_data', 0] }
                    }
                },
                {
                    $project: {
                        description: 1,
                        created_at: 1,
                        created_id: 1,
                        created_name: 1,
                        updated_at: 1,
                        start_date: 1,
                        end_date: 1,
                        total_item: 1,
                        claim_amount: 1,
                        approved_amount: 1,
                        status: 1,
                        status_remark: 1,
                        user_id: 1,
                        reporting_manager_name: { $ifNull: ['$rm_data.parent_user_name', ''] },
                        user_name: '$user_data.name',
                        claim_date: 1,
                        expense_type: 1,
                        expense_id: 1,
                        updated_name: 1,
                        senior_status_remark: 1,
                        senior_status: 1,
                        reason: 1
                    }
                },
                { $sort: sorting },
                { $skip: skip },
                { $limit: limit }
            ];


            const totalCountData: Record<string, any>[] = await this.expenseModel.aggregate([
                { $match: match },
                { $count: "totalCount" }
            ]);
            const total: number = totalCountData.length > 0 ? totalCountData[0].totalCount : 0;
            const result: Record<string, any>[] = await this.expenseModel.aggregate([
                ...pipeline
            ]);

            let statusCounts = await this.expenseModel.aggregate([
                {
                    $match: { ...statusMatch, status: { $ne: global.EXPENSE_STATUS[5] } }
                },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                }
            ]);

            if (req['user']['login_type_id'] === global.LOGIN_TYPE_ID['FIELD_USER']) {

                const draftStatus = await this.expenseModel.aggregate([
                    {
                        $match: {
                            ...statusMatch,
                            status: global.EXPENSE_STATUS[5],
                            $or: [
                                { user_id: req['user']['_id'] },
                                { created_id: req['user']['_id'] }
                            ]
                        }
                    },
                    {
                        $group: {
                            _id: "$status",
                            count: { $sum: 1 }
                        }
                    }
                ]);

                statusCounts = statusCounts.concat(draftStatus);

            }

            const statusCountMap: Record<string, number> = statusCounts.reduce((acc, { _id, count }) => {
                acc[_id] = count;
                return acc;
            }, {});
            const statusTabs = [
                { submittedCount: statusCountMap[global.EXPENSE_STATUS[1]] || 0 },
                { approvedCount: statusCountMap[global.EXPENSE_STATUS[2]] || 0 },
                { rejectCount: statusCountMap[global.EXPENSE_STATUS[3]] || 0 },
                { paidCount: statusCountMap[global.EXPENSE_STATUS[4]] || 0 },
                { darftCount: statusCountMap[global.EXPENSE_STATUS[5]] || 0 },
            ];
            const data: any = {
                result,
                expense_status_tabs: statusTabs
            };
            return this.res.pagination(data, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async detailExpense(req: Request, params: any): Promise<any> {
        try {
            const mainExpense: Record<string, any> = await this.expenseModel.findOne({ _id: toObjectId(params._id) }).lean().exec()
            if (!mainExpense) return this.res.error(HttpStatus.BAD_REQUEST, 'EXPENSE.NOT_EXIST');

            let match: Record<string, any> = { is_delete: 0, org_id: req['user']['org_id'], expense_id: toObjectId(params._id) };
            let subExpenses: Record<string, any> = await this.subExpenseModel.find(match).sort({ _id: -1 }).lean();

            mainExpense.sub_expense = subExpenses;
            mainExpense.files = await this.getDocument(mainExpense._id, global.THUMBNAIL_IMAGE)
            return this.res.success('SUCCESS.FETCH', mainExpense);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async deleteSubExpense(req: any, params: any): Promise<any> {
        try {

            const subExpenseId = toObjectId(params._id);
            const match: any = { _id: subExpenseId, is_delete: 0, org_id: req['user']['org_id'] };
            const exist: Record<string, any> = await this.subExpenseModel.findOne(match).exec();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');

            const expnese: Record<string, any> = await this.subExpenseModel.findOne({ _id: exist.expense_id, is_delete: 0, org_id: req['user']['org_id'] }).exec();
            if (expnese?.status !== global.EXPENSE_STATUS[5]) return this.res.error(HttpStatus.CONFLICT, 'EXPENSE.DRAFT_DELETE_ALLOW');

            const updateObj = {
                ...req['updateObj'],
                ...params,
            };

            await this.subExpenseModel.updateOne({ _id: subExpenseId }, updateObj);
            if (exist.expense_id) {
                const expenseId = toObjectId(exist.expense_id);
                const remainingSubExpenses = await this.subExpenseModel.find({
                    expense_id: expenseId,
                    is_delete: 0,
                });
                const totalAmount = remainingSubExpenses.reduce((sum, item) => sum + (item.expense_amount || 0), 0);
                const totalItem = remainingSubExpenses.length;
                await this.expenseModel.updateOne(
                    { _id: expenseId },
                    {
                        claim_amount: totalAmount,
                        total_item: totalItem,
                    }
                );
            }
            return this.res.success('SUCCESS.DELETE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async deleteFile(req: Request, params: any): Promise<any> {
        try {
            params._id = toObjectId(params._id)
            const exist: Record<string, any> = await this.expenseDocsModel.findOne({ _id: params._id, is_delete: 0 }).exec();

            if (!exist) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

            const updateObj = {
                ...req['updateObj'],
                is_delete: 1,
            };
            await this.expenseDocsModel.updateOne(
                { _id: params._id },
                updateObj
            );
            return this.res.success('SUCCESS.FILE_DELETE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async userExpensePolicy(req: Request, params: any): Promise<any> {
        try {
            const user_id = params?.user_id
                ? toObjectId(params.user_id)
                : req['user']['_id'];

            const org_id = req['user']['org_id'];

            const user = await this.userModel.findOne({
                _id: user_id,
                is_delete: 0,
                org_id: org_id
            }, { designation: 1 }).lean();

            if (!user?.designation) {
                return this.res.error(HttpStatus.NOT_FOUND, 'USER.DESIGNATION_NOT_FOUND');
            }

            let formData: any = null;
            if (global.SPECIAL_EXPENSE_ORGANIZATION_CODE.includes(Number(org_id))) {
                const userPolicy = await this.allowanceModel.findOne({
                    user_id,
                    is_delete: 0,
                    org_id: req['user']['org_id']
                }, { form_data: 1 }).lean();

                formData = userPolicy?.form_data;
            }
            if (!formData || Object.keys(formData).length === 0) {
                const designationData = await this.optionModel.aggregate([
                    {
                        $match: {
                            is_delete: 0,
                            org_id: req['user']['org_id'],
                            dropdown_name: 'designation',
                            option_name: user.designation.replace(/\s+/g, '')
                        }
                    },
                    {
                        $lookup: {
                            from: COLLECTION_CONST().CRM_ALLOWANCE_MASTER,
                            localField: '_id',
                            foreignField: 'user_id',
                            as: 'allowance_data'
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            form_data: {
                                $ifNull: [
                                    { $arrayElemAt: ['$allowance_data.form_data', 0] },
                                    {}
                                ]
                            }
                        }
                    }
                ]);

                formData = designationData[0]?.form_data;
            }

            if (!formData || Object.keys(formData).length === 0) {
                return this.res.error(HttpStatus.CONFLICT, 'EXPENSE.NOT_EXIST');
            }

            const formatted = Object.entries(formData)
                .filter(([_, value]) => value !== false)
                .map(([key, value]) => {
                    const label = titleCase(key);
                    if (value === true) {
                        return {
                            label: label,
                            value: label,
                            unit: expenseTypeUnit.NULL,
                            unit_value: 0
                        };
                    } else {
                        const isKm = ["car", "bike"].includes(key.toLowerCase());
                        const unit_value = typeof value === 'string' ? Number(value) : value;
                        return {
                            label: label,
                            value: label,
                            unit: isKm ? expenseTypeUnit.KM : expenseTypeUnit.AMOUNT,
                            unit_value: unit_value
                        };
                    }
                });

            return this.res.success('SUCCESS.FETCH', formatted);

        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async addExpenseFromEvent(req: any, params: any): Promise<any> {
        try {
            const orgId = req['user']['org_id'];
            const eventPlan = await this.globalService.getEventByIds(req, params);
            if (!eventPlan) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

            let expense = await this.expenseModel.findOne({
                event_plan_id: toObjectId(params.event_plan_id),
                is_delete: 0,
                org_id: orgId
            }).lean();

            if (!expense) {
                const seq = {
                    modelName: this.expenseModel,
                    idKey: 'expense_id',
                    prefix: 'EXP'
                }

                const newExpenseId = await nextSeq(req, seq)
                const expenseData = {
                    ...req['createObj'],
                    expense_id: newExpenseId,
                    expense_type: 'Event',
                    description: eventPlan['event_type'] || '',
                    start_date: eventPlan['event_date'],
                    end_date: eventPlan['event_date'],
                    user_id: toObjectId(eventPlan['assigned_to_user_id']),
                    event_plan_id: toObjectId(params.event_plan_id),
                    org_id: orgId,
                    claim_amount: 0,
                    total_item: 0,
                };
                expense = await new this.expenseModel(expenseData).save();
            }
            if (expense?._id && Array.isArray(params.sub_expense) && params.sub_expense.length > 0) {
                params.expense_id = expense?._id;
                await this.createSubExpense(req, params)
            }
            return this.res.success('SUCCESS.CREATE', { inserted_id: expense._id });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async fetchExpenseData(eventPlanId: any): Promise<any> {
        try {
            const expense = await this.expenseModel.findOne({
                event_plan_id: toObjectId(eventPlanId),
                is_delete: 0
            }, { _id: 1 }).lean();

            if (!expense) {
                return [];
            }

            const subExpenses = await this.subExpenseModel.find({
                expense_id: expense._id,
                is_delete: 0
            }).lean();

            return subExpenses;
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async updateStatus(req: Request, params: any): Promise<any> {
        try {

            const { _id, status, status_remark, approved_amount, reason, senior_status, senior_status_remark } = params;
            const exist: any = await this.expenseModel.findOne({ _id: params._id, is_delete: 0 }).exec();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'EXPENSE.NOT_FOUND');
            if (approved_amount !== undefined && approved_amount > exist.claim_amount) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'EXPENSE.APPROVED_AMOUNT_EXCEEDS_CLAIM');
            }

            let isDirectPaid: boolean = false;

            if (params.status === ExpenseStatus.Paid) {
                isDirectPaid = true;
            }

            let updateObj: Record<string, any> = {};


            let approvedAmt = approved_amount;

            if (status === ExpenseStatus.Reject) {
                approvedAmt = 0;
            } else if (approved_amount !== undefined) {
                approvedAmt = approved_amount;
            }

            if (params?.senior_status && req?.['user']?.['org']?.['is_expesne_senior_status']) {
                updateObj = {
                    ...req['seniorObj'],
                    senior_status,
                    senior_status_remark
                }
            } else {

                updateObj = {
                    ...req['updateObj'],
                    status,
                    status_remark,
                    approved_amount: approvedAmt,
                    ...(reason !== undefined && { reason }),
                };

            }

            const updatedExpense = await this.expenseModel.findOneAndUpdate(
                { _id, is_delete: 0 },
                updateObj,
                { new: true }
            ).exec();

            return this.res.success('SUCCESS.STATUS_UPDATE', updatedExpense);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
}



