import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId, generateSegmentVariants } from 'src/common/utils/common.utils';
import { PriceType } from './models/product-price.model';
import { CustomerTypeService } from '../customer-type/web/customer-type.service';
import { ZoneMasterService } from '../location-master/zone-master/web/zone-master.service';
import { ProductPriceModel } from './models/product-price.model';
import { DropdownService } from '../dropdown/web/dropdown.service';
import { DiscountModel } from './models/discount.model';
import { ProductService } from './web/product.service';
import { CustomerModel } from '../customer/default/models/customer.model';
import { ProductModel } from './models/product.model';
import { OrderSchemeModel } from 'src/modules/sfa/order/models/order-scheme.model';
import { SchemStatus } from 'src/modules/sfa/order/web/dto/order.dto';
import { ProductDispatchModel } from './models/product-dispatch.model';
import { productInternalRoutes } from './web/product.controller';
import { PointCategoryMapModel } from '../point-category/models/point-category-map.model';
import { PointCategoryModel } from '../point-category/models/point-category.model';
import { Console } from 'console';
@Injectable()
export class SharedProductService {
  constructor(
    @InjectModel(ProductPriceModel.name)
    private productPriceModel: Model<ProductPriceModel>,
    @InjectModel(DiscountModel.name)
    private discountModel: Model<DiscountModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(ProductModel.name) private productModel: Model<ProductModel>,
    @InjectModel(OrderSchemeModel.name)
    private orderSchemeModel: Model<OrderSchemeModel>,
    @InjectModel(ProductDispatchModel.name)
    private productDispatchModel: Model<ProductDispatchModel>,
    @InjectModel(PointCategoryMapModel.name)
    private pointCategoryMapModel: Model<PointCategoryMapModel>,
    @InjectModel(PointCategoryModel.name)
    private pointCategoryModel: Model<PointCategoryModel>,
    private readonly res: ResponseService,
    private readonly customerTypeService: CustomerTypeService,
    private readonly zoneMasterService: ZoneMasterService,
    private readonly dropdownService: DropdownService,
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
  ) { }

  async priceConfig(req: any, params: any): Promise<any> {
    try {
      const { price_type } = req['user']['org'];
      const org_id = req['user']['org_id'];
      const data: Record<string, any>[] = [];
      const zones: string[] = [];
      const output: Record<string, any> = { price_type };

      if (price_type === PriceType.PRICE) {
        data.push({ label: 'Mrp' });
      } else if (price_type === PriceType.NET_PRICE) {
        params.login_type_ids = [5, 6];
        params.internalCall = true;
        const customerTypes = await this.customerTypeService.readDropdown(
          req,
          params,
        );
        data.push({ label: 'Mrp' });

        for (const { label, value } of customerTypes) {
          data.push({ label: `${label} Net Price`, customer_type_id: value });
        }
      } else if (price_type === PriceType.ZONE_WISE_PRICE) {
        const zoneList = await this.zoneMasterService.readDropdown(req, params);
        data.push({ label: 'Zone' }, { label: 'Mrp' });

        for (const { zone } of zoneList) {
          zones.push(zone);
        }
      } else if (price_type === PriceType.ZONE_WISE_NET_PRICE) {
        params.login_type_ids = [5, 6];
        params.internalCall = true;
        const [customerTypes, zoneList] = await Promise.all([
          this.customerTypeService.readDropdown(req, params),
          this.zoneMasterService.readDropdown(org_id, params),
        ]);

        data.push({ label: 'Zone' }, { label: 'Mrp' });

        for (const { label, value } of customerTypes) {
          data.push({ label: `${label} Net Price`, customer_type_id: value });
        }

        for (const { zone } of zoneList) {
          zones.push(zone);
        }
      }

      output.result = data;
      if (zones.length) output.zones = zones;

      return this.res.success('SUCCESS.FETCH', output);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  
  async savePrice(req: any, params: any): Promise<any> {
    try {
      let exist: Record<string, any> = {};
      params.product_id = toObjectId(params.product_id);
      params.price_type = req['user']['org']['price_type'];
      exist = await this.productPriceModel.findOne({
        product_id: params.product_id,
      });
      if (exist) {
        const updateObj: Record<string, any> = {
          ...req['updateObj'],
          ...params,
        };
        await this.productPriceModel.updateOne({ _id: exist._id }, updateObj);
      } else {
        const saveObj: Record<string, any> = {
          ...req['createObj'],
          ...params,
        };
        const document = new this.productPriceModel(saveObj);
        await document.save();
      }
      return this.res.success('SUCCESS.SAVE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async productPrice(req: any, params: any): Promise<any> {
    try {
      params.product_id = toObjectId(params.product_id);
      params.price_type = req['user']['org']['price_type'];
      let data: any = await this.productPriceModel.findOne(
        { product_id: params.product_id },
        { form_data: 1, price_type: 1 },
      );
      if (!data) {
        return this.res.success('SUCCESS.FETCH', []);
      }
      if (req.url.includes(productInternalRoutes.MRP_DROPDOWN)) {
        if (
          data?.price_type === PriceType.ZONE_WISE_PRICE ||
          data?.price_type === PriceType.ZONE_WISE_NET_PRICE
        ) {
          data = data?.form_data?.map((row: any) => {
            if (!row?.zone)
              return this.res.error(
                HttpStatus.BAD_REQUEST,
                'PRODUCT.MRP_DROPDOWN_ERROR',
              );
            const mrp = row?.Mrp || 0;
            let label = `${row.zone} Mrp - ${mrp}`;
            return {
              label: label,
              value: mrp,
            };
          });
        } else {
          const formData = data.form_data;
          const mrp = formData?.Mrp || 0;
          data = [
            {
              label: `MRP - ${mrp}`,
              value: mrp,
            },
          ];
        }
        return this.res.success('SUCCESS.FETCH', data);
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getDiscountMap(
    ids: any[],
    customerTypeId: any,
    customerId?: any,
  ): Promise<Record<string, any>> {
    const matchCriteria: any = {
      discount_id: { $in: ids },
      customer_type_id: toObjectId(customerTypeId),
    };

    if (customerId) {
      matchCriteria.customer_id = toObjectId(customerId);
    } else {
      matchCriteria.customer_id = { $exists: false };
    }
    const discounts = await this.discountModel.find(matchCriteria).lean();

    return discounts.reduce((acc: Record<string, any>, curr: any) => {
      acc[curr.discount_id.toString()] = curr.form_data;
      return acc;
    }, {});
  }

  async productDiscount(req: Request, params: any): Promise<any> {
    try {
      const data: Record<string, any> = await this.productService.read(
        req,
        params,
      );
      const originalData = data.data || [];
      const ids = originalData.map((row: any) => row._id);

      const generalDiscountMap = await this.getDiscountMap(
        ids,
        params.customer_type_id,
      );

      let customerDiscountMap: Record<string, any> = {};
      if (req?.url.includes(global.MODULE_ROUTES[15]) && params.customer_id) {
        customerDiscountMap = await this.getDiscountMap(
          ids,
          params.customer_type_id,
          params.customer_id,
        );
      }

      data.data = originalData.map((row: any) => ({
        _id: row._id,
        product_name: `${row.product_name}/${row.product_code}`,
        form_data: generalDiscountMap[row._id.toString()] || null,
        ...(params.customer_id && {
          customer_form_data: customerDiscountMap[row._id.toString()] || null,
        }),
      }));

      return data;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async categoryDiscount(req: Request, params: any): Promise<any> {
    try {
      const isCustomerSpecific = req?.url.includes(global.MODULE_ROUTES[15]);
      const orgId = req?.['user']?.org_id;

      const match: Record<string, any> = {
        is_delete: 0,
        module_id: global.SUB_MODULES['Products'],
        org_id: orgId,
        dropdown_name: global.DROPDOWN_NAME[3],
        internalCall: true,
      };

      const data = await this.dropdownService.readDropdownWithPagination(req, {
        ...params,
        ...match,
      });
      const originalData = data.data || [];
      const ids = originalData.map((row: any) => row._id);

      const generalDiscountMap = await this.getDiscountMap(
        ids,
        params.customer_type_id,
      );

      let customerDiscountMap: Record<string, any> = {};
      if (isCustomerSpecific && params.customer_id) {
        customerDiscountMap = await this.getDiscountMap(
          ids,
          params.customer_type_id,
          params.customer_id,
        );
      }

      data.data = originalData.map((row: any) => ({
        _id: row._id,
        category_name: row.option_name,
        category_id: row._id,
        form_data: generalDiscountMap[row._id.toString()] || null,
        ...(isCustomerSpecific &&
          params.customer_id && {
          customer_form_data: customerDiscountMap[row._id.toString()] || null,
        }),
      }));

      return data;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async saveDiscount(req: any, params: any): Promise<any> {
    try {
      for (const [key, value] of Object.entries(params.form_data)) {
        const numValue = value as number;
        if (numValue > 100) {
          return this.res.error(HttpStatus.BAD_REQUEST, [
            'PRODUCT.DISCOUNT_ERROR',
            { key, value: String(numValue) },
          ]);
        }
      }

      let exist: Record<string, any> = {};
      params.discount_id = toObjectId(params.discount_id);
      params.customer_type_id = toObjectId(params.customer_type_id);

      let match: Record<string, any> = {
        discount_id: params.discount_id,
        org_id: req['user']['org_id'],
        is_delete: 0,
        customer_type_id: params.customer_type_id,
      };
      if (req?.url.includes(global.MODULE_ROUTES[15])) {
        match.customer_id = toObjectId(params.customer_id);
        params.customer_id = match.customer_id;
      } else {
        match.customer_id = { $exists: false };
      }
      exist = await this.discountModel.findOne(match);
      if (exist) {
        const updateObj: Record<string, any> = {
          ...req['updateObj'],
          ...params,
        };
        await this.discountModel.updateOne({ _id: exist._id }, updateObj);
      } else {
        const saveObj: Record<string, any> = {
          ...req['createObj'],
          ...params,
        };
        const document = new this.discountModel(saveObj);
        await document.save();
      }
      return this.res.success('SUCCESS.SAVE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async getPriceData(
    req: Request,
    ids: any[],
    price_type: string,
    customerTypeId?: string,
    dynamicPriceField?: string,
    dynamicPriceIdField?: string,
    zone?: string,
  ): Promise<Record<string, number | null>> {

    const org_id: number = req['user']['org_id'];
    const results: Record<string, any>[] = await this.productPriceModel.find(
      {
        org_id,
        product_id: { $in: ids },
        price_type: price_type,
        is_delete: 0,
      },
      {
        product_id: 1,
        form_data: 1,
        _id: 0,
      },
    );

    if (price_type === PriceType.PRICE) {
      return Object.fromEntries(
        results.map((item) => [item.product_id, item.form_data?.Mrp ?? null]),
      );
    }

    if (
      price_type === PriceType.NET_PRICE &&
      customerTypeId &&
      dynamicPriceField &&
      dynamicPriceIdField
    ) {
      return Object.fromEntries(
        results.map((item) => [
          item.product_id,
          this.getPriceFromData(
            item.form_data,
            customerTypeId,
            dynamicPriceField,
            dynamicPriceIdField,
          ),
        ]),
      );
    }

    if (price_type === PriceType.ZONE_WISE_PRICE && zone) {
      return Object.fromEntries(
        results.map((item) => {
          const formArray = item.form_data || [];
          const zoneEntry = formArray.find((entry: any) => entry.zone === zone);
          return [item.product_id, zoneEntry?.Mrp ?? null];
        }),
      );
    }

    if (
      price_type === PriceType.ZONE_WISE_NET_PRICE &&
      zone &&
      customerTypeId &&
      dynamicPriceField &&
      dynamicPriceIdField
    ) {
      return Object.fromEntries(
        results.map(item => {
          const zoneData = (item.form_data || []).find((z: any) => z.zone === zone);
          let price: number | null = null;

          if (zoneData) {
            if (
              req?.url.includes(global.MODULE_ROUTES[19]) ||
              req?.url.includes(global.MODULE_ROUTES[21])
            ) {
              price = zoneData.Mrp ?? null;
            } else {
              const dynamicValue = zoneData[dynamicPriceField];
              const dynamicIdValue = String(zoneData[dynamicPriceIdField]);

              if (dynamicIdValue === customerTypeId && typeof dynamicValue === 'number') {
                price = dynamicValue;
              } else if (typeof zoneData.Mrp === 'number') {
                price = zoneData.Mrp;
              } else {
                price = 0;
              }
            }
          }
          return [item.product_id, price];
        }),
      );
    }
    return {};
  }

  private getPriceFromData(
    data: any,
    customerTypeId: string,
    dynamicPriceField: string,
    dynamicPriceIdField: string,
    zone?: string,
    req?: any,
  ): number | null {
    if (
      req?.url.includes(global.MODULE_ROUTES[19]) ||
      req?.url.includes(global.MODULE_ROUTES[21])
    ) {
      return data?.Mrp ?? null;
    }
    if (
      String(data?.[dynamicPriceIdField]) === customerTypeId &&
      data?.[dynamicPriceField] != null
    ) {
      return data[dynamicPriceField];
    }
    return data?.Mrp ?? null;
  }

  async orderPriceConfig(
    req: any,
    ids: any[],
    customerId: any,
  ): Promise<Record<string, any>> {
    try {
      const { price_type } = req['user']['org'];
      const customer: any = await this.customerModel.findOne(
        { _id: toObjectId(customerId) },
        { state: 1, customer_type_id: 1, customer_type_name: 1 },
      );

      if (
        price_type === PriceType.ZONE_WISE_PRICE ||
        PriceType.ZONE_WISE_NET_PRICE
      ) {
        if (!customer || !customer.state || customer.state.trim() === '') {
          return this.res.error(
            HttpStatus.BAD_REQUEST,
            'ERROR.STATE_NOT_DEFINED',
          );
        }
      }

      const customerTypeName = customer.customer_type_name
        ?.toLowerCase()
        .replace(/\s+/g, '_');
      const customerTypeId = String(customer.customer_type_id);
      const dynamicPriceField = customer.customer_type_name + ' Net Price';
      const dynamicPriceIdField = `${customerTypeName}_price_id`;
      if (price_type === PriceType.PRICE) {
        return await this.getPriceData(req, ids, PriceType.PRICE);
      }

      if (price_type === PriceType.NET_PRICE) {
        return await this.getPriceData(
          req,
          ids,
          PriceType.NET_PRICE,
          customerTypeId,
          dynamicPriceField,
          dynamicPriceIdField,
        );
      }

      if (price_type === PriceType.ZONE_WISE_PRICE) {
        const zoneData: any = await this.zoneMasterService.fetchZone(
          req,
          customer.state,
        );
        if (zoneData?.zone) {
          return await this.getPriceData(
            req,
            ids,
            PriceType.ZONE_WISE_PRICE,
            undefined,
            undefined,
            undefined,
            zoneData.zone,
          );
        }
      }

      if (price_type === PriceType.ZONE_WISE_NET_PRICE) {
        const zoneData: any = await this.zoneMasterService.fetchZone(req, customer.state);

        if (zoneData?.zone) {
          return await this.getPriceData(
            req,
            ids,
            PriceType.ZONE_WISE_NET_PRICE,
            customerTypeId,
            dynamicPriceIdField,
            dynamicPriceIdField,
            zoneData.zone,
          );
        }
      }
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async orderDiscountConfig(
    req: any,
    discountKeys: Record<string, string>,
    customerId: any,
  ): Promise<Record<string, any>> {
    try {
      const { price_type, org_id } = req.user.org;
      const customer = customerId
        ? await this.customerModel.findOne(
          { _id: toObjectId(customerId) },
          { customer_type_id: 1 },
        )
        : null;
      if (customerId && !customer) {
        return this.res.error(HttpStatus.NOT_FOUND, 'CUSTOMER.NOT_EXIST');
      }

      if (price_type === PriceType.NET_PRICE) {
        return Object.keys(discountKeys).reduce(
          (acc, key) => {
            acc[key] = { customer_form_data: null };
            return acc;
          },
          {} as Record<string, any>,
        );
      }

      const productIds = Object.keys(discountKeys);
      const categoryNames = Object.values(discountKeys).filter(Boolean);

      const allDiscounts = await this.discountModel
        .find(
          {
            org_id,
            is_delete: 0,
            // discount_type: {
            //   $in: [global.DISCOUNT_TYPE[2], global.DISCOUNT_TYPE[1]],
            // },
            // $or: [
            //   {
            //     discount_type: global.DISCOUNT_TYPE[2],
            //     discount_id: { $in: productIds },
            //   },
            //   {
            //     discount_type: global.DISCOUNT_TYPE[1],
            //     discount_name: { $in: categoryNames },
            //   },
            // ],
          },
          {
            form_data: 1,
            discount_id: 1,
            discount_type: 1,
            discount_name: 1,
            customer_id: 1,
            customer_type_id: 1,
          },
        )
        .lean();

      const result: Record<string, any> = {};

      for (const [productId, categoryName] of Object.entries(discountKeys)) {
        let match: any = null;
        const productMatches = allDiscounts.filter(
          (d) =>
            d.discount_type === global.DISCOUNT_TYPE[2] &&
            d.discount_id?.toString() === productId,
        );
        match =
          productMatches.find(
            (d) => d.customer_id?.toString() === customerId?.toString(),
          ) ||
          productMatches.find(
            (d) =>
              d.customer_type_id?.toString() ===
              customer?.customer_type_id?.toString(),
          ) ||
          productMatches.find((d) => !d.customer_id && !d.customer_type_id);

        if (!match) {
          const categoryMatches = allDiscounts.filter(
            (d) =>
              d.discount_type === global.DISCOUNT_TYPE[1] &&
              d.discount_name?.toLowerCase() === categoryName?.toLowerCase(),
          );

          match =
            categoryMatches.find(
              (d) => d.customer_id?.toString() === customerId?.toString(),
            ) ||
            categoryMatches.find(
              (d) =>
                d.customer_type_id?.toString() ===
                customer?.customer_type_id?.toString(),
            ) ||
            categoryMatches.find((d) => !d.customer_id && !d.customer_type_id);
        }
        result[productId] = {
          customer_form_data: match?.form_data || null,
          discount_name: match?.discount_name || null,
          discount_id: match?.discount_id?.toString() || null
        };
      }
      return result;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async fetchScheme(req, ids: string[]): Promise<any[]> {
    return await this.orderSchemeModel
      .find({
        org_id: req['user']['org_id'],
        status: SchemStatus.Active,
        is_delete: 0,
        'product_data.product_id': { $in: ids.map((id) => toObjectId(id)) },
      })
      .lean();
  }

  async readProduct(req: any, params: any): Promise<any> {
    try {
      params.zone = params.state;
      let customerSegment = [];
      let customer_form_data = await this.customerModel.findOne({ _id: toObjectId(params.customer_id), is_delete: 0 });
      params.brand = customer_form_data?.form_data?.brand

      if (!params.customer_segment && params.customer_id) {
        const customerData = await this.customerModel.findOne({ _id: toObjectId(params.customer_id), is_delete: 0 });
        if (customerData && customerData.form_data?.segment?.length) {
          customerSegment = customerData.form_data.segment;
          params.customer_segment = customerSegment;
        }
      }
      if (params.customer_segment) {
        if (!Array.isArray(params.customer_segment)) {
          params.customer_segment = [params.customer_segment];
        }

        const variantsSet = new Set<string>();
        for (const seg of params.customer_segment) {
          const variants = generateSegmentVariants(seg);
          variants.forEach(v => variantsSet.add(v));
        }

        params.customer_segment = Array.from(variantsSet);
      }

      if (params.brand) {
        if (!Array.isArray(params.brand)) {
          params.brand = [params.brand];
        }

        const variantsSet = new Set<string>();
        for (const seg of params.brand) {
          const variants = generateSegmentVariants(seg);
          variants.forEach(v => variantsSet.add(v));
        }

        params.brand = Array.from(variantsSet);
      }

      const data: Record<string, any> = await this.productService.read(req, params);
      const originalData = data.data || [];
      console.log("::::::::::::::::::::::::::::::", originalData)
      const ids = originalData.map((row: any) => row._id);

      const discountKeys: Record<string, string> = {};
      for (const row of originalData) {
        if (row._id && row.category_name) {
          discountKeys[row._id.toString()] = row.category_name;
        }
      }

      const priceMap: Record<string, any> = await this.orderPriceConfig(req, ids, params.customer_id);

      const discountMap: Record<string, any> = await this.orderDiscountConfig(req, discountKeys, params.customer_id);

      const schemeMap: any[] = await this.fetchScheme(req, ids);

      const updatedData: Record<string, any> = originalData.map((product: any) => {

        const pid = String(product._id);
        const matchingScheme = schemeMap.find((scheme) =>
          scheme.product_data.some((p: any) => String(p.product_id) === pid)
        );

        const matchedZonePrice = Array.isArray(product.product_price) ? product.product_price?.find((price: any) =>
          price.zone?.trim().toLowerCase() === customer_form_data.state?.trim().toLowerCase()
        ) : product;

        const rawMrp = priceMap[pid];
        const mrp = typeof rawMrp === 'number' ? rawMrp : 0;

        const formData = {
          ...product.form_data,
          segments: Array.isArray(product.form_data?.segments)
            ? product.form_data.segments
            : product.form_data?.segments
              ? [product.form_data.segments]
              : []
        };

        return {
          ...product,
          mrp: mrp !== 0 ? mrp : matchedZonePrice.Mrp,
          product_price: matchedZonePrice,
          form_data: formData,
          discount_form: (discountMap[pid]?.customer_form_data && Object.keys(discountMap[pid]?.customer_form_data).length > 0)
            ? discountMap[pid].customer_form_data
            : { basiq_discount: 0 },
          scheme_id: matchingScheme?._id ?? '',
          scheme_description: matchingScheme?.description ?? '',
          gst_percent: product?.gst_percent ?? 0,
        };
      });
      return {
        ...data,
        data: updatedData,
        customer_form_data: customer_form_data.form_data || []
      };
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async saveDispatchConfig(req: any, params: any): Promise<any> {
    try {
      let exist: Record<string, any> = {};
      params.product_id = toObjectId(params.product_id);
      params.price_type = req['user']['org']['price_type'];
      exist = await this.productDispatchModel.findOne({
        product_id: params.product_id,
      });
      if (exist) {
        const updateObj: Record<string, any> = {
          ...req['updateObj'],
          ...params,
        };
        await this.productDispatchModel.updateOne(
          { _id: exist._id },
          updateObj,
        );
      } else {
        const saveObj: Record<string, any> = {
          ...req['createObj'],
          ...params,
        };
        const document = new this.productDispatchModel(saveObj);
        await document.save();
      }
      return this.res.success('SUCCESS.SAVE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async fetchPointCatgoryByProductId(
    req: any,
    product_id: string,
    customerTypeId: string,
  ): Promise<any> {
    try {
      const orgId: number = req['user']['org_id'];
      const pointCategoryMap: Record<string, any> =
        await this.pointCategoryMapModel
          .findOne({
            org_id: orgId,
            product_id: toObjectId(product_id),
            is_delete: 0,
          })
          .lean();

      if (!pointCategoryMap) {
        return null;
      }

      const pointCategory = await this.pointCategoryModel
        .findOne({
          org_id: orgId,
          _id: toObjectId(pointCategoryMap.point_category_id),
          is_delete: 0,
        })
        .lean();

      if (!pointCategory) {
        return null;
      }

      const matchedPoint = pointCategory.point.find(
        (p: any) => p.customer_type_id.toString() === customerTypeId.toString(),
      );
      return {
        point_category_id: pointCategory._id,
        point_category_name: pointCategory.point_category_name,
        point_value: matchedPoint.point_value,
        customer_type_id: matchedPoint.customer_type_id,
        customer_type_name: matchedPoint.customer_type_name,
      };
    } catch (error) {
      throw error;
    }
  }

  async readMapPointCategory(req: any, params: any): Promise<any> {
    try {
      const orgId: number = req['user']['org_id'];
      const pointCategoryMap: Record<string, any> = await this.pointCategoryMapModel.findOne({
        org_id: orgId,
        product_id: toObjectId(params.product_id),
        is_delete: 0
      }).lean();
      return pointCategoryMap
    } catch (error) {
      throw error;
    }
  }
}
