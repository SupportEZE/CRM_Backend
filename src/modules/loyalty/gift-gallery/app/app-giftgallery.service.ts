import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { GiftGalleryModel } from '../models/gift-gallery.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId } from 'src/common/utils/common.utils';
import { GiftType } from '../web/dto/gift-gallery.dto';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { GiftGalleryLikeModel } from '../models/gift-gallery-like-model';
import { GiftGalleryService } from '../web/gift-gallery.service';
import { GiftGalleryDocsModel } from '../models/gift-gallery-docs.model';
import { InsideBannerService } from 'src/shared/inside-banner/inside-banner.service';
import { status } from '../../qr-code/web/dto/qr-code.dto';

@Injectable()
export class AppGiftGalleryService {
  constructor(
    @InjectModel(GiftGalleryModel.name)
    private giftgalleryModel: Model<GiftGalleryModel>,
    @InjectModel(GiftGalleryDocsModel.name)
    private giftGalleryDocsModel: Model<GiftGalleryDocsModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(GiftGalleryLikeModel.name)
    private giftGalleryLikeModel: Model<GiftGalleryLikeModel>,
    private readonly res: ResponseService,
    private readonly giftGalleryService: GiftGalleryService,
    private readonly insideBannerService: InsideBannerService,
  ) {}

  async read(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        customer_type_id: req['user']['customer_type_id'].toString(),
        status: "Active"

      };

      const activeTabMap: Record<string, string> = {
        [GiftType.Gift]: GiftType.Gift,
        [GiftType.Cash]: GiftType.Cash,
        [GiftType.Voucher]: GiftType.Voucher,
      };

      const activeTabType = activeTabMap[params.activeTab];

      if (!activeTabType) {
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'ERROR.BAD_REQ',
          'Gift type not matched, it should be either Gift,Cash,Voucher',
        );
      }

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const [giftCount, cashCount, voucherCount] = await Promise.all([
        this.giftgalleryModel.countDocuments({
          ...match,
          gift_type: GiftType.Gift,
        }),
        this.giftgalleryModel.countDocuments({
          ...match,
          gift_type: GiftType.Cash,
        }),
        this.giftgalleryModel.countDocuments({
          ...match,
          gift_type: GiftType.Voucher,
        }),
      ]);

      match = { ...match, gift_type: activeTabType };
      let data: Record<string, any>[] = await this.giftgalleryModel
        .find(match)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const likedGifts = await this.giftGalleryLikeModel
        .find({
          customer_id: req['user']['_id'],
          gift_id: { $in: data.map((item) => item._id) },
        })
        .exec();

      data = data.map((item) => ({
        ...item,
        like: likedGifts.some(
          (like) => like.gift_id.toString() === item._id.toString(),
        ),
      }));

      data = await Promise.all(
        data.map(async (item: any) => {
          item.files = await this.giftGalleryService.getDocument(
            item._id,
            global.BIG_THUMBNAIL_IMAGE,
          );
          return item;
        }),
      );

      let total = 0;
      if (params.activeTab === GiftType.Gift) {
        total = giftCount;
      } else if (params.activeTab === GiftType.Cash) {
        total = cashCount;
      } else if (params.activeTab === GiftType.Voucher) {
        total = voucherCount;
      }
      params.banner_name = global.INSIDE_BANNER[3];
      const inside_banner = await this.insideBannerService.read(req, params);
      const result: any = {
        data,
        inside_banner,
        activeTab: {
          gift_count: giftCount,
          cash_count: cashCount,
          voucher_count: voucherCount,
        },
      };

      return this.res.pagination(result, total, page, limit);
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error.message || error,
      );
    }
  }

  async detail(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        _id: params.gift_id,
      };
      const projection = {
        created_unix_time: 0,
      };
      let result: Record<string, any> = await this.giftgalleryModel
        .findOne(match, projection)
        .lean();

      if (!result) {
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'ERROR.BAD_REQ',
          'No Gift exist with given id.',
        );
      }

      result.address = `${req['user']['address'] ?? ''}, ${req['user']['district'] ?? ''}, ${req['user']['state'] ?? ''}, ${req['user']['pincode'] ?? ''}`;

      result.files = await this.giftGalleryService.getDocument(
        result._id,
        global.BIG_THUMBNAIL_IMAGE,
      );
      return this.res.success('SUCCESS.DETAIL', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async saveGiftLikes(req: any, params: any): Promise<any> {
    try {
      params.gift_id = toObjectId(params.gift_id);
      let match: Record<string, any> = {
        gift_id: params.gift_id,
        customer_id: req['user']['_id'],
      };
      const exist: Record<string, any>[] = await this.giftGalleryLikeModel
        .find(match)
        .exec();
      if (exist.length > 0) {
        await this.giftGalleryLikeModel.deleteOne({ _id: exist[0]._id });
        return this.res.success('GIFT.UNLIKE');
      } else {
        params.customer_id = req['user']['_id'];
        const saveObj: Record<string, any> = {
          ...req['createObj'],
          ...params,
        };
        const document = new this.giftGalleryLikeModel(saveObj);
        await document.save();
        return this.res.success('GIFT.LIKE');
      }
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
