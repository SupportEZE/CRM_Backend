import { toObjectId } from 'src/common/utils/common.utils';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { PrimaryProfileStatus } from 'src/modules/master/customer/default/models/customer.model';

export function customerLookup(req: Request, params: any) {
  let localField: string = 'customer_id';
  if (params?.localField) localField = params.localField;

  const moduleId = global.MODULES['Customers'];
  const moduleName = Object.keys(global.MODULES).find(
    (key) => global.MODULES[key] === global.MODULES['Customers'],
  );
  const customerLookup = [
    {
      $lookup: {
        from: COLLECTION_CONST().CRM_CUSTOMERS,
        localField: localField,
        foreignField: '_id',
        as: 'customer_info',
        pipeline: [
          {
            $match: {
              profile_status: { $ne: PrimaryProfileStatus.LEAD },
              is_delete: 0,
              org_id: req['user']['org_id'],
            },
          },
          {
            $addFields: {
              module_id: moduleId,
              module_name: moduleName,
            },
          },
          {
            $project: {
              _id: 1,
              customer_name: 1,
              login_type_id: 1,
              customer_type_name: 1,
              customer_type_id: 1,
              customer_code: 1,
              country: 1,
              state: 1,
              district: 1,
              city: 1,
              pincode: 1,
              address: 1,
              status: 1,
              mobile: 1,
              email: 1,
              profile_status: 1,
              full_address: {
                $concat: [
                  { $ifNull: ['$country', ''] },
                  ', ',
                  { $ifNull: ['$state', ''] },
                  ', ',
                  { $ifNull: ['$district', ''] },
                  ', ',
                  { $ifNull: ['$city', ''] },
                  ', ',
                  { $ifNull: [{ $toString: '$pincode' }, ''] },
                  ', ',
                  { $ifNull: ['$address', ''] },
                ],
              },
              module_id: 1,
              module_name: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: '$customer_info',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        'customer_info._id': { $exists: true },
      },
    },
  ];
  return customerLookup;
}
export function contactPersonLookup(req: Request, params: any) {
  let localField: string = 'customer_id';
  if (params?.localField) localField = params.localField;
  const contactPersonLookup: any[] = [
    {
      $lookup: {
        from: COLLECTION_CONST().CRM_CUSTOMER_CONTACT_PERSON,
        let: { customerId: `$${localField}` },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$customer_id', '$$customerId'] },
            },
          },
          {
            $project: {
              contact_person_name: 1,
              contact_person_mobile: 1,
              designation: 1,
            },
          },
          {
            $sort: {
              _id: -1,
            },
          },
        ],
        as: 'contact_person_info',
      },
    },
  ];

  return contactPersonLookup;
}

export function secondaryOrderItemLookup(req: Request, params: any) {
  let localField = 'order_id';
  if (params?.localField) localField = params.localField;

  const match: Record<string, any> = {
    is_delete: 0,
    org_id: req['user']['org_id'],
  };
  if (params?.category_names) {
    match.category_name = { $in: params?.category_names };
  }
  if (params?.product_ids) {
    match.product_id = {
      $in: params?.product_ids.map((row: any) => toObjectId(row)),
    };
  }
  const orderItemLookup = [
    {
      $lookup: {
        from: COLLECTION_CONST().CRM_SECONDARY_ORDER_ITEM,
        localField: localField,
        foreignField: '_id',
        as: 'item_info',
        pipeline: [
          {
            $match: match,
          },
          {
            $project: {
              _id: 1,
              order_id: 1,
              product_id: 1,
              product_code: 1,
              product_name: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: '$item_info',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        'item_info._id': { $exists: true },
      },
    },
  ];
  return orderItemLookup;
}

export function invoiceItemLookup(req: Request, params: any) {
  let localField = 'invoice_id';
  let foreignField = '_id';
  if (params?.localField) localField = params.localField;
  if (params?.foreignField) foreignField = params.foreignField;

  const match: Record<string, any> = {
    is_delete: 0,
    org_id: req['user']['org_id'],
  };
  if (params?.product_ids) {
    match.product_id = {
      $in: params?.product_ids.map((row: any) => toObjectId(row)),
    };
  }
  const invoiceItemLookup = [
    {
      $lookup: {
        from: COLLECTION_CONST().CRM_INVOICE_ITEM,
        localField: localField,
        foreignField: foreignField,
        as: 'invoice_item_info',
        pipeline: [
          {
            $match: match,
          },
          {
            $project: {
              _id: 1,
              invoice_id: 1,
              product_id: 1,
              product_code: 1,
              product_name: 1,
              net_amount_with_tax: 1,
              total_quantity: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: '$invoice_item_info',
        preserveNullAndEmptyArrays: true,
      },
    },
  ];
  return invoiceItemLookup;
}

export function productLookup(req: Request, params: any) {
  let localField = 'product_id';
  let foreignField = '_id';
  if (params?.localField) localField = params.localField;
  if (params?.foreignField) foreignField = params.foreignField;

  const match: Record<string, any> = {
    is_delete: 0,
    org_id: req['user']['org_id'],
  };
  if (params?.category_names) {
    match.category_name = { $in: params?.category_names };
  }
  const productLookup = [
    {
      $lookup: {
        from: COLLECTION_CONST().CRM_PRODUCTS,
        localField: localField,
        foreignField: foreignField,
        as: 'product_info',
        pipeline: [
          {
            $match: match,
          },
          {
            $project: {
              _id: 1,
              invoice_id: 1,
              product_id: 1,
              product_code: 1,
              product_name: 1,
              category_name: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: '$product_info',
        preserveNullAndEmptyArrays: true,
      },
    },
  ];
  return productLookup;
}
