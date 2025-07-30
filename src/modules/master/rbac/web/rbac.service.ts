import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ModulePerModel } from '../models/module-permission.model';
import { SubModulePerModel } from '../models/sub-module-permission.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { UserRoleModel } from '../models/user-role.model';
import { ModuleMasterModel } from '../models/module-master.model';
import { SubModuleMasterModel } from '../models/sub-module-master';
import { eMatch, Like, toObjectId } from 'src/common/utils/common.utils';
import { LoginTypeModel } from '../models/login-type.model';
import { CustomerTypeModel } from '../../customer-type/models/customer-type.model';
import { OrgModel } from '../../org/models/org.model';
import { rbacRoutes } from './rbac.controller';
import { OrgLoginTypeModel } from '../models/org-login-type.model';
import { SharedUserService } from '../../user/shared-user.service';
import { UserModel } from '../../user/models/user.model';
import { FormBuilderService } from 'src/shared/form-builder/form-builder.service';
import { TableBuilderService } from 'src/shared/table-builder/table-builder.service';
@Injectable()
export class RbacService {
    constructor(
        @InjectModel(UserRoleModel.name) private userRoleModel: Model<UserRoleModel>,
        @InjectModel(ModulePerModel.name) private modulePerModel: Model<ModulePerModel>,
        @InjectModel(SubModulePerModel.name) private subModulePerModel: Model<SubModulePerModel>,
        @InjectModel(ModuleMasterModel.name) private moduleMasterModel: Model<ModuleMasterModel>,
        @InjectModel(SubModuleMasterModel.name) private subModuleMasterModel: Model<SubModuleMasterModel>,
        @InjectModel(UserModel.name) private userModel: Model<UserModel>,
        @InjectModel(LoginTypeModel.name) private loginTypeModel: Model<LoginTypeModel>,
        @InjectModel(CustomerTypeModel.name) private customerTypeModel: Model<CustomerTypeModel>,
        @InjectModel(OrgModel.name) private orgModel: Model<OrgModel>,
        @InjectModel(OrgLoginTypeModel.name) private orgLoginTypeModel: Model<OrgLoginTypeModel>,
        private readonly res: ResponseService,
        private readonly sharedUserService: SharedUserService,
        private readonly formBuilderService: FormBuilderService,
        private readonly tableBuilderService: TableBuilderService,
    ) { }

    async create(req: Request, params: any): Promise<any> {
        try {
            const exist: Record<string, any> = await this.userRoleModel.findOne({ user_role_name: eMatch(params.user_role_name), is_delete: 0, org_id: req['user']['org_id'] }).exec();
            if (exist) {
                if (params?.internalCall) return exist
                return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST')
            }

            const obj = {
                org_id: req?.['user']?.['org_id'] || params.org_id,
                login_type_id: global.LOGIN_TYPE_ID['SYSTEM_USER'],
                login_type_name: global.LOGIN_TYPE_NAME[3],
                user_role_name: params.user_role_name
            };
            const saveObj = {
                ...req?.['createObj'] || params.org_id,
                ...obj,
            };
            const document = new this.userRoleModel(saveObj);
            const data: Record<string, any> = await document.save();
            if (params?.internalCall) return data;
            return this.res.success('SUCCESS.CREATE')
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error)
        }

    }
    async update(req: Request, params: any): Promise<any> {
        try {
            let exist = await this.userRoleModel.findOne({ _id: params._id, is_delete: 0 }).exec();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST')
            exist = await this.userRoleModel.findOne({ user_role_name: params.user_role_name, is_delete: 0 }).exec();
            if (exist) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST')

            const updateObj = {
                ...req['updateObj'],
                ...params,
            };
            await this.userRoleModel.updateOne(
                { _id: params._id },
                updateObj
            );
            return this.res.success('SUCCESS.UPDATE')
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error)
        }
    }
    async delete(req: Request, params: any): Promise<any> {
        try {
            const exist = await this.userRoleModel.findOne({ _id: params._id, is_delete: 0 }).exec();
            if (!exist) return this.res.success('WARNING.NOT_EXIST')
            if (exist['is_delete'] === params.is_delete) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_DELETE')
            await this.userRoleModel.updateOne({ _id: params._id }, params);
            return this.res.success('SUCCESS.DELETE')
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error)
        }
    }
    async read(req: Request, params: any): Promise<any> {
        try {
            let match: any
            if (req['user']['org_id'] === 0) {
                match = { is_delete: 0, login_type_id: 2 };
            } else {
                match = { is_delete: 0, org_id: req['user']['org_id'], login_type_id: { $ne: 2 } };
            }
            if (params?.user_role_name) match.user_role_name = { $regex: new RegExp(params.user_role_name, 'i') };
            let projection: any = { user_role_name: 1 };
            const data = await this.userRoleModel.find(match, projection).sort({ _id: -1 });
            return this.res.success('SUCCESS.FETCH', data)
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error)
        }
    }
    async readModules(req: Request, params: any): Promise<any> {
        try {
            const defaultPersmision: any = {
                view: false,
                add: false,
                modify: false,
                delete: false,
                import: false,
                export: false,
                approve: false
            };
            let org: Record<string, any>;
            if (req['user']['org_id'] === 0) {

                const org_user = await this.userModel.findOne({ login_type_id: 2, user_role_id: toObjectId(params.user_role_id) }, { org_id: 1 }).lean();

                org = await this.orgModel.findOne({ org_id: org_user.org_id }, { sfa: 1, dms: 1, irp: 1, wms: 1, wcms: 1, _id: 0 }).lean();
            } else {
                org = await this.orgModel.findOne({ org_id: req['user']['org_id'] }, { sfa: 1, dms: 1, irp: 1, wms: 1, wcms: 1, _id: 0 }).lean();
            }

            const trueKeysObjects = Object.entries(org)
                .filter(([_, value]) => value === true)
                .map(([key]) => ({ [key.toUpperCase()]: true }));


            const moduleParams = { $or: trueKeysObjects }

            let OrgsubModulePermissionIds: any = [];
            if (req['user']['login_type_id'] !== global.LOGIN_TYPE_ID['ADMIN']) {

                let match: Record<string, any> = { user_role_id: toObjectId(req['user']['user_role_id']), "default_access.view": true };
                const OrgmodulePermissions = await this.modulePerModel.find(
                    match,
                    { module_id: 1, default_access: 1 }
                ).lean();

                const OrgsubModulePermissions = await this.subModulePerModel.find(
                    match,
                    { sub_module_id: 1, default_access: 1 }
                ).lean();
                moduleParams['module_id'] = { $in: OrgmodulePermissions.map((row: any) => row.module_id) };
                OrgsubModulePermissionIds = OrgsubModulePermissions.map((row: any) => row.sub_module_id);
            }
            const modules = await this.moduleMasterModel.find(
                moduleParams,
                {
                    module_name: 1,
                    module_id: 1,
                    default_access: 1,
                    root_id: 1,
                    SFA: 1,
                    DMS: 1,
                    IRP: 1,
                    WMS: 1,
                    WCMS: 1
                }
            ).sort({ module_name: 1, default_access: 1 }).lean();

            // Step 2: Extract module IDs
            const moduleIds = modules.map((row: any) => row.module_id);

            const subModulesParams = { module_id: { $in: moduleIds }, $or: trueKeysObjects }

            if (OrgsubModulePermissionIds.length > 0) subModulesParams['sub_module_id'] = { $in: OrgsubModulePermissionIds }

            // Step 3: Get submodules with module IDs
            const subModules = await this.subModuleMasterModel.find(
                subModulesParams,
                {
                    sub_module_name: 1,
                    sub_module_id: 1,
                    module_id: 1,
                    default_access: 1,
                    SFA: 1,
                    DMS: 1,
                    IRP: 1,
                    WMS: 1,
                    WCMS: 1
                }
            ).lean();

            // Organize submodules by module_id
            const subModulesMap = subModules.reduce((acc: Record<string, any[]>, sub: any) => {
                acc[sub.module_id] = acc[sub.module_id] || [];
                acc[sub.module_id].push({
                    key_name: 'sub_module_id',
                    key_value: sub.sub_module_id,
                    parent_module_name: modules.find(m => m.module_id === sub.module_id)?.module_name || '',
                    parent_module_id: modules.find(m => m.module_id === sub.module_id)?.module_id || '',
                    module_name: sub.sub_module_name,
                    default_access: sub.default_access,
                    permission_access: undefined,
                    SFA: sub?.SFA || undefined,
                    DMS: sub?.DMS || undefined,
                    IRP: sub?.IRP || undefined,
                    WMS: sub?.WMS || undefined,
                    WCMS: sub?.WCMS || undefined,

                });

                return acc;
            }, {});

            // Prepare module data with master `default_access`
            let moduleData = modules
                .filter(module => !subModulesMap[module.module_id]) // Keep only modules with no submodules
                .map(module => ({
                    ...module,
                    key_name: 'module_id',
                    key_value: module.module_id,
                    default_access: module['default_access'], // Master default_access
                    permission_access: undefined, // We'll populate this from the permissions,
                    root_id: module?.root_id,
                    SFA: module?.SFA,
                    DMS: module?.DMS,
                    IRP: module?.IRP,
                    WMS: module?.WMS,
                    WCMS: module?.WCMS,

                }));

            let subModulesData = Object.values(subModulesMap).flat(); // Flatten submodules list

            // Merge both lists
            let data = [...moduleData, ...subModulesData].sort((a, b) => a.module_name.localeCompare(b.module_name));

            // Apply search filter if provided
            if (params.search_key) {
                const searchKey = params.search_key.toLowerCase();
                data = data.filter(
                    item =>
                        item.module_name?.toLowerCase().includes(searchKey) ||
                        item.parent_module_name?.toLowerCase().includes(searchKey)
                );
            }

            // Fetch permissions in batch
            let modulePermissions = await this.modulePerModel.find(
                { module_id: { $in: modules.map(m => m.module_id) }, user_role_id: toObjectId(params.user_role_id) },
                { module_id: 1, default_access: 1 }
            ).lean();

            let subModulePermissions = await this.subModulePerModel.find(
                { user_role_id: toObjectId(params.user_role_id) },
                { sub_module_id: 1, default_access: 1 }
            ).lean();

            // Create lookup maps for permissions
            const modulePermissionMap = modulePermissions.reduce((acc: Record<string, boolean>, p: any) => {
                acc[p.module_id] = p.default_access;
                return acc;
            }, {});

            const subModulePermissionMap = subModulePermissions.reduce((acc: Record<string, boolean>, p: any) => {
                if (p.default_access !== undefined) {
                    acc[p.sub_module_id] = p.default_access;
                }
                return acc;
            }, {});

            // Assign permission access
            data = data.map(row => ({
                ...row,
                permission_access: row.key_name === 'module_id'
                    ? modulePermissionMap[row.key_value] ?? defaultPersmision // If permission is not found, set undefined
                    : subModulePermissionMap[row.key_value] ?? defaultPersmision, // Similarly for submodule permissions
            }));

            // Now both `default_access` (from master) and `permission_access` (from permissions) exist in the data
            return this.res.success('SUCCESS.FETCH', data);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async addPermission(req: Request, params: any): Promise<any> {
        try {
            const { user_role_id, permission } = params;
            const userRole = await this.userRoleModel.findOne({ _id: user_role_id, is_delete: 0 }).lean();
            if (!userRole) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');

            const moduleOperations: any[] = [];
            const subModuleOperations: any[] = [];
            const parentModuleOperations: any[] = [];

            await this.modulePerModel.deleteMany({ user_role_id: toObjectId(user_role_id), is_delete: 0 });
            await this.subModulePerModel.deleteMany({ user_role_id: toObjectId(user_role_id), is_delete: 0 });

            for (const row of permission) {
                const isModule = row.key_name === 'module_id';
                const model: Model<any> = isModule ? this.modulePerModel : this.subModulePerModel;
                const match = isModule
                    ? { module_id: row.key_value, user_role_id: toObjectId(user_role_id) }
                    : { sub_module_id: row.key_value, user_role_id: toObjectId(user_role_id) };

                const exist = await model.findOne(match).lean();

                const commonFields = {
                    ...(exist ? req['updateObj'] : req['createObj']),
                    user_role_id: toObjectId(user_role_id),
                    user_role_name: userRole.user_role_name,
                    default_access: row.permission_access || { view: false, modify: false, import: false, export: false, approve: false },
                    SFA: row.SFA,
                    DMS: row.DMS,
                    IRP: row.IRP,
                    WMS: row.WMS,
                    WCMS: row.WCMS,
                };

                const obj = {
                    ...commonFields,
                    module_id: isModule ? row.key_value : row.parent_module_id ?? 0,
                    module_name: isModule ? row.module_name : row.parent_module_name,
                    ...(isModule ? {} : { sub_module_id: row.key_value, sub_module_name: row.module_name }),
                };

                const hasPermission = Object.values(row.permission_access).includes(true);

                if (row.parent_module_name && hasPermission) {
                    const parentObj = {
                        ...commonFields,
                        module_id: row.parent_module_id,
                        module_name: row.parent_module_name,
                        SFA: row?.SFA || undefined,
                        DMS: row?.DMS || undefined,
                        IRP: row?.IRP || undefined,
                        WMS: row?.WMS || undefined,
                        WCMS: row?.WCMS || undefined,
                        default_access: {
                            view: true,
                            add: true,
                            modify: true,
                            delete: true,
                            import: true,
                            export: true,
                            approve: true,
                        },

                    };

                    const parentOperation = {
                        updateOne: {
                            filter: { module_id: row.parent_module_id, user_role_id: toObjectId(user_role_id) },
                            update: { $set: parentObj },
                            upsert: true,
                        },
                    };
                    parentModuleOperations.push(parentOperation);
                }

                const operation = {
                    updateOne: {
                        filter: match,
                        update: { $set: obj },
                        upsert: true,
                    },
                };

                if (isModule) {
                    moduleOperations.push(operation);
                } else {
                    subModuleOperations.push(operation);
                }
            }

            if (moduleOperations.length) await this.modulePerModel.bulkWrite(moduleOperations);
            if (subModuleOperations.length) await this.subModulePerModel.bulkWrite(subModuleOperations);
            if (parentModuleOperations.length) await this.modulePerModel.bulkWrite(parentModuleOperations);

            return this.res.success('SUCCESS.UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async readLoginTypes(req: Request, params: any): Promise<any> {
        try {
            const userOrgId = req['user']['org_id'];

            const loginTypes: Record<string, any> = await this.orgLoginTypeModel.findOne(
                { is_delete: 0, org_id: { $in: [userOrgId, 0] } },
                { login_type_ids: 1 }
            ).sort({ org_id: -1 });

            const match: Record<string, any> = params?.login_type_ids
                ? { login_type_id: { $in: params.login_type_ids } }
                : { login_type_id: { $in: loginTypes.login_type_ids } };

            let data: any[] = await this.loginTypeModel.find(match, {
                login_type_name: 1,
                login_type_id: 1
            }).sort({ login_type_name: 1 }).lean();

            if (!data?.length) {
                return this.res.success('SUCCESS.FETCH', []);
            }

            const excludedLoginTypes = [5, 6,7, 8, 10];

            let countMap: Record<string, number> = {};
            if (req.url?.includes(rbacRoutes.USER_LIST_TABS)) {
                const counts = await this.sharedUserService.getLoginTypeCounts(req, {
                    login_type_ids: loginTypes.login_type_ids
                });

                countMap = counts.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {});
            }

            const enrichedData = await Promise.all(data.map(async (item: any) => {
                const loginTypeId = item.login_type_id;
                const baseItem = {
                    label: item.login_type_name,
                    value: loginTypeId,
                    count: countMap[loginTypeId] || 0
                };

                if (excludedLoginTypes.includes(loginTypeId)) {
                    return baseItem;
                }

                const formParams = {
                    module_id: 2,
                    platform: 'web',
                    login_type_id: loginTypeId,
                    internalCall: true
                };

                const [formData, tableData] = await Promise.all([
                    this.formBuilderService.readFormUserWise(req, formParams),
                    this.tableBuilderService.readTableUserWise(req, formParams)
                ]);

                return {
                    ...baseItem,
                    forms: formData ? [formData] : [],
                    tables: tableData ? [tableData] : []
                };
            }));

            return this.res.success('SUCCESS.FETCH', enrichedData);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async readCustomerTypes(req: Request, params: any): Promise<any> {
        try {
            const data = await this.customerTypeModel.find(
                {
                    login_type_id: params.login_type_id,
                    org_id: req['user']['org_id']
                },
                {
                    login_type_id: 1,
                    customer_type_name: 1,
                    _id: 1
                }
            );
            const formattedData = data.map(item => ({
                label: item.customer_type_name,
                value: item._id,
                login_type_id: item.login_type_id
            }));
            return this.res.success('SUCCESS.FETCH', formattedData);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async readDropdown(req: Request, params: any): Promise<any> {
        try {
            let match: any = { is_delete: 0, org_id: req['user']['org_id'] };
            let sorting: Record<string, 1 | -1> = { _id: -1 };
            if (params?.sorting && Object.keys(params.sorting).length !== 0) sorting = params.sorting;
            if (params?.filter) {
                Object.keys(params.filter).forEach(key => {
                    if (params.filter[key]) {
                        match[key] = Like(params.filter[key])
                    }
                });
            }
            let limit = global.OPTIONS_LIMIT
            if (params?.limit) limit = params.limit;
            let data: any = await this.userRoleModel.find(match, { user_role_name: 1 }).sort(sorting).limit(limit)
            data = data.map((row: any) => {
                return {
                    label: row.user_role_name,
                    value: row._id
                }
            })
            return this.res.success('SUCCESS.FETCH', data);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async getOrgId(req: Request, params: any): Promise<any> {
        try {
            if (!params?.app_id) throw Error('app_id no found')
            const data: Record<string, any> = await this.orgModel.findOne({
                app_id: params.app_id,
            }).lean();
            if (!data) throw Error('org data not found')
            return data.org_id
        } catch (error) {
            throw error
        }
    }

    async fetchEnquiryPermission(req: Request, params: any): Promise<any> {
        try {
            const moduleName = ['Enquiry', 'Site-Project'];
            const data = await this.modulePerModel.find(
                {
                    user_role_id: toObjectId(req['user']['org']['user_id']),
                    module_name: { $in: moduleName },
                    is_delete: 0,
                },
                {
                    module_id: 1,
                    module_name: 1,
                    _id: 1
                }
            ).exec();
            return data;
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
}
