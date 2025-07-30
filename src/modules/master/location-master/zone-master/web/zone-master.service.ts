import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { Like } from 'src/common/utils/common.utils';
import { ZoneMasterModel } from '../models/zone-master.model';


@Injectable()
export class ZoneMasterService {
    constructor(
        @InjectModel(ZoneMasterModel.name) private zonemasterModel: Model<ZoneMasterModel>,
        private readonly res: ResponseService,
    ) { }

    async create(req: any, params: any): Promise<any> {
        try {
            let exist = await this.zonemasterModel.findOne({ org_id: req['user']['org_id'], zone: params.zone, country: params.country, is_delete: 0 }).exec();
            if (exist) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');
            const saveObj = {
                ...req['createObj'],
                ...params
            };

            const document = new this.zonemasterModel(saveObj);
            await document.save();

            return this.res.success('SUCCESS.CREATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async read(req: any, params: any): Promise<any> {
        try {
            let filters: any = { is_delete: 0, org_id: req['user']['org_id'] };

            if (params?.filters?.zone) filters.zone = { $regex: params.filters.zone, $options: 'i' };
            if (params?.filters?.state) filters.state = Like(params.filters.state);

            const page = params.page || global.PAGE;
            const limit = params.limit || global.PAGE_LIMIT;
            const skip = (page - 1) * limit;

            const projection: Record<string, any> = {};

            const data = await this.zonemasterModel
                .find(filters, projection)
                .sort({ _id: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const total = await this.zonemasterModel.countDocuments(filters);
            return this.res.pagination(data, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }


    async update(req: any, params: any): Promise<any> {
        try {
            let exist = await this.zonemasterModel.findOne({ _id: params._id, is_delete: 0, org_id: req['user']['org_id'] }).lean();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');

            if (!params.forcefully) {
                let conflictingZones = await this.zonemasterModel.find({
                    state: { $in: params.state },
                    _id: { $ne: params._id },
                    is_delete: 0
                }).select('state zone').lean();

                if (conflictingZones.length > 0) {
                    let filteredConflicts: { zone: string; state: string[] }[] = [];

                    params.state.forEach(state => {
                        conflictingZones.forEach(zone => {
                            if (zone.state.includes(state)) {
                                let existingZone = filteredConflicts.find(z => z.zone === zone.zone);
                                if (existingZone) {
                                    existingZone.state.push(state);
                                } else {
                                    filteredConflicts.push({ zone: zone.zone, state: [state] });
                                }
                            }
                        });
                    });

                    const stateZoneMessage = filteredConflicts
                        .map(zone => `(${zone.state.join(', ')}) in zone (${zone.zone})`).join(', ');

                    return this.res.confirm(
                        `These states ${stateZoneMessage} are already assigned. Are you still sure you want to add?`,
                        filteredConflicts
                    );
                }
            }

            // Remove states from other zones if `forcefully: true`
            if (params.forcefully && Array.isArray(params.responseData) && params.responseData.length > 0) {
                for (const zone of params.responseData) {
                    await this.zonemasterModel.updateOne(
                        { zone: zone.zone, is_delete: 0, counrty: params.country },
                        { $pull: { state: { $in: zone.state } } } // Remove specified states from this zone
                    );
                }
            }

            // Construct update object
            const updateObj: any = {
                state: params.state,
                ...req['updateObj']
            };

            // Allow updating `zone` if provided
            if (params?.zone) {
                updateObj.zone = params.zone;
            }

            if (params?.country) {
                updateObj.country = params.country;
            }

            // Update the zone master record
            const updatedDocument = await this.zonemasterModel.findOneAndUpdate(
                { _id: params._id },
                updateObj,
                { new: true }
            );

            return this.res.success('SUCCESS.UPDATE', updatedDocument);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async delete(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any> = { _id: params._id, is_delete: 0 };
            const exist: Record<string, any> = await this.zonemasterModel.findOne(match).exec();
            if (!exist) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
            if (params?.is_delete && exist['is_delete'] === params?.is_delete) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_DELETE');

            const updateObj: Record<string, any> = {
                ...req['updateObj'],
                ...params,
            };
            await this.zonemasterModel.updateOne(
                { _id: params._id },
                updateObj
            );
            return this.res.success('SUCCESS.DELETE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async readDropdown(orgId: any, params: any): Promise<any> {
        try {
            const data = await this.zonemasterModel.find({ org_id: orgId, is_delete: 0 })
            return data
        } catch (error) {
            throw error
        }
    }

    async fetchZone(req: any, state: string): Promise<any> {
        try {
            const zone = await this.zonemasterModel.findOne({
                $or: [
                    { state: { $regex: `^${state}$`, $options: 'i' } },
                    { zone: { $regex: `^${state}$`, $options: 'i' } }
                ],
                is_delete: 0,
                org_id: req['user']['org_id']
            }).select('zone');
            return zone;
        } catch (error) {
            throw new Error(`Failed to fetch zone for state "${state}": ${error.message}`);
        }
    }

}
