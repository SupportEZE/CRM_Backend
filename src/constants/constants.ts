((global.USER_STATUS = {
  inactive: 0,
  active: 1,
  inprogress: 2,
  rejected: 3,
  4: 'Approved',
}),
  (global.USER_SOURCE = { sfa: 1, web: 2 }));
global.FULL_IMAGE = 'full';
global.THUMBNAIL_IMAGE = 'thumbnail';
global.BIG_THUMBNAIL_IMAGE = 'big_thumbnail';
global.PAGE_LIMIT = 10;
global.PLATFORM = { 1: 'app', 2: 'web' };
global.AUTHRIZATION_API_PATH = '/authorization/read';
global.APP_AUTHRIZATION_API_PATH = '/app-authorization/read';
global.FORM_BUILDER_READ_API_PATH = 'form-builder/read';
global.LIMIT = 20;
global.OPTIONS_LIMIT = 100;
global.PAGE = 1;
global.QRCODE_TYPE = { 1: 'item', 2: 'box', 3: 'point_category' };
global.DISPATCH_STATUS = {
  1: 'order_packing',
  2: 'gatepass_pending',
  3: 'gatepass_genrated',
  4: 'dispatched',
};
global.SCANNING_ALLOWED = [5, 6, 7, 10];
global.QRCODE_PRIFIX = { 0: 'IT', 1: 'BO', 2: 'PC', 3: 'MB' };
global.SCAN_LIMIT_TYPE = { 1: 'daily', 2: 'monthly' };
global.QR_GENERATE_LIMIT = 5000;
global.CALL_REQUEST = { 1: 'Review Pending', 2: 'Completed' };
global.REDEEM_REQUEST_STATUS = ['Pending', 'Approved', 'Reject'];
global.SCAN_MULTIPLE = true;
global.STATUS = { 0: 'Inactive', 1: 'Active' };
global.QUERY_TYPE = {
  0: 'Insert',
  1: 'Update',
  2: 'Delete',
  4: 'Import',
  5: 'Export',
};
global.LOGIN_TYPE_ID = {
  ADMIN: 1,
  ORGANISATION_ADMIN: 2,
  SYSTEM_USER: 3,
  FIELD_USER: 4,
  INFLUENCER: 10,
  SECONDARY: 7,
  PRIMARY: 5,
  WAREHOUSE: 9,
  SERVICE_VENDOR: 11,
  SERVICE_FIELD_USER: 12,
  SUB_PRIMARY: 6,
  END_CONSUMER: 8,
};
global.SPECIAL_ORGANIZATION_CODE = [7]
global.SPECIAL_EXPENSE_ORGANIZATION_CODE = [3, 6]
global.LOGIN_TYPE_ID_PERMISSION = [3, 4, 11];
global.LOGIN_TYPE_ID_PERMISSION = [3, 4, 11, 5, 6, 7];
global.LOGIN_TYPE_NAME = {
  3: 'System User',
  4: 'Field User',
  5: 'Distributor',
  6: 'Direct Dealer',
};
global.allowedTypesForCsv = ['text/csv'];
global.ONE_MB = 1 * 1024 * 1024;
global.ROW_COUNT = 5000;
global.DEFAULT_LANG = 'en';
global.DEFAULT_LANG = 'English';
global.CREATION_TYPE = {
  0: 'Manual',
  1: 'Redeem',
  2: 'Scan',
  3: 'Bonus',
  4: 'Refund',
  6: 'Deduct',
  7: 'Social',
  8: 'Spin',
  9: 'Welcome',
  10: 'Birthday',
  11: 'Anniversary',
  12: 'Invite',
  13: 'Enquiry',
  14: 'Site',
  15: 'Stock Transfer',
  16: 'Purchase',
};
global.APPROVAL_STATUS = {
  0: 'Pending',
  1: 'Approved',
  2: 'Reject',
  3: 'Cancel',
  4: 'Verified',
  5: 'Recieved',
};
global.TRANSACTION_TYPE = { 0: 'credit', 1: 'debit' };
global.HOLIDAY_TYPE = { 0: 'National', 1: 'Regional' };
global.KEY_ID = 'powersync-5f699a21f4';
((global.AUDIENCE =
  'https://67cffd3447583b96919813bc.powersync.journeyapps.com'),
  (global.ENQUIRY_STATUS = {
    0: 'Insert',
    1: 'Update',
    2: 'Delete',
    4: 'Import',
    5: 'Export',
  }));
((global.MODULES = { Enquiry: 11, 'Site-Project': 24, Customers: 4 }),
  (global.DROPDOWNS = {
    1: 'Stage',
    2: 'Site Stage',
    3: 'Competitor',
    4: 'ozone_enquiry_stage',
    5: 'influencer__type',
    6: 'Ozone_ob_stage',
  }));
global.DROPDOWN_LIMIT = 100;
global.DEFAULT_KYC_STATUS = 'Pending';
global.GIFT_TYPE = { 0: 'Gift', 1: 'Cash', 2: 'Voucher' };
global.MONTH = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};
global.APPROVAL_STATUS = {
  0: 'Pending',
  1: 'Approved',
  2: 'Reject',
  3: 'Cancel',
  4: 'Verified',
  5: 'Recieved',
};
global.TRANSACTION_TYPE = { 0: 'credit', 1: 'debit' };
global.HOLIDAY_TYPE = { 0: 'National', 1: 'Regional' };
global.KEY_ID = 'powersync-5f699a21f4';
((global.AUDIENCE =
  'https://67cffd3447583b96919813bc.powersync.journeyapps.com'),
  (global.ENQUIRY_STATUS = {
    0: 'Insert',
    1: 'Update',
    2: 'Delete',
    4: 'Import',
    5: 'Export',
  }));
((global.MODULES = { Enquiry: 11, 'Site-Project': 24, Customers: 4 }),
  (global.DROPDOWNS = {
    1: 'Stage',
    2: 'Site Stage',
    3: 'Competitor',
    4: 'ozone_enquiry_stage',
    5: 'influencer__type',
    6: 'Ozone_ob_stage',
  }));
global.DROPDOWN_LIMIT = 100;
global.DEFAULT_KYC_STATUS = 'Pending';
global.GIFT_TYPE = { 0: 'Gift', 1: 'Cash', 2: 'Voucher' };
global.MONTH = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};
global.BANK_PERCENATGE_INFO = [
  'account_no',
  'beneficiary_name',
  'bank_name',
  'ifsc_code',
];
global.DOCS_PERCENATGE_INFO = ['doc_label', 'doc_file', 'doc_number'];

global.BANK_PERCENATGE_INFO = [
  'account_no',
  'beneficiary_name',
  'bank_name',
  'ifsc_code',
];
global.DOCS_PERCENATGE_INFO = [
  'account_no',
  'beneficiary_name',
  'bank_name',
  'ifsc_code',
];
global.BONUS_TYPES = {
  1: 'Welcome',
  2: 'Birthday',
  3: 'Anniversary',
  4: 'Invite Friends',
  5: 'Refer Enquiry',
  6: 'Refer Site | Project',
};
global.BONUS_TYPES_USER_FLOW = {
  Welcome: 'Start Your Experience with a Rewarding Welcome.',
  Birthday: ' Birthday Cheers with Exclusive Bonuses!',
  Anniversary: 'Honoring Your Commitment with Anniversary Rewards.',
  'Invite Friends': 'Earn Big by Inviting Friends to Join the Fun.',
  'Refer Enquiry': 'Share Enquiries, Multiply Your Rewards.',
  'Refer Site | Project':
    'Refer Projects, Earn Rewards for Every Successful Connection.',
};
global.BONUS_TYPES_ADMIN_FLOW = {
  Welcome:
    'When a new user registers, they are automatically credited with a predefined number of welcome bonus points.',
  Birthday:
    'The Birthday Bonus Points feature rewards users with extra points on their birthday as a special incentive.',
  Anniversary:
    'The Anniversary Bonus Points feature rewards users with special bonus points on their wedding anniversary as a gesture of appreciation.',
  'Invite Friends':
    'The Invite Friends Bonus Points feature rewards users for referring new members to the platform.',
  'Refer Enquiry':
    'The Refer Enquiry Bonus Points feature rewards users for referring potential customers who submit an inquiry on the platform.',
  'Refer Site | Project':
    'The Refer Site / Project Bonus Points feature rewards users for referring potential projects or business sites to the platform.',
};
global.SENDER_TYPE = { 1: 'user', 2: 'customer' };
global.PAYMENT_MODE = ['BANK', 'UPI'];
global.PAYMENT_MODE_TYPE = { 1: 'BANK', 2: 'UPI' };
global.MONTH_ARRAY = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
global.LEAVE_STATUS = { 1: 'Approved', 2: 'Pending', 3: 'Rejected' };
global.QUOTATION_STATUS = { 1: 'Win', 2: 'Pending', 3: 'Lost' };
global.QUOTATION_STAGES = { 1: 'Win', 2: 'Lost', 3: 'Negotiation' };
global.BADGE_SLAB_TYPE = { 1: 'Day', 2: 'Custom' };
global.EXPENSE_STATUS = {
  1: 'Submitted',
  2: 'Approved',
  3: 'Reject',
  4: 'Paid',
  5: 'Draft',
  6: 'Pending',
};
global.MODULES = {
  Masters: 2,
  Attendance: 3,
  Customers: 4,
  Dashboards: 1,
  Reports: 5,
  Chat: 6,
  'Call Request': 7,
  'Gift Gallery': 8,
  Leave: 9,
  'Qr Code': 10,
  Enquiry: 11,
  Expense: 12,
  'Follow Up': 13,
  'Beat plan': 14,
  Checkin: 15,
  Ticket: 16,
  Bonus: 17,
  'Leader Board': 18,
  'Referral Program': 19,
  'Social Engagement': 20,
  'Redeem Request': 21,
  Announcement: 22,
  Target: 23,
  'Site-Project': 24,
  Quotation: 25,
  Stock: 26,
  Order: 27,
  'Payment Collection': 28,
  'Event Plan': 29,
  Branding: 30,
  Accounts: 31,
  'Pop Gift': 32,
  'Company Stock': 33,
  'Warranty Contract': 34,
  'Customer Stock': 35,
  Dispatch: 36,
  'Master box': 37,
  'Warehouse Stock': 38,
  'Spare Part': 39,
  Complaint: 40,
  Invoice: 41,
  Purchase: 44,
};

global.SUB_MODULES = {
  Products: 6,
  Users: 7,
  'Roles & Permission': 8,
  Holidays: 9,
  'Content Master': 10,
  'Location Master': 11,
  'Leave Master': 12,
  'Expense Policy': 13,
  'Spin & Win': 14,
  'Area Bonus': 15,
  Badges: 16,
  'Point Category': 17,
  'Bank Transfer': 18,
  Gift: 19,
  'Stock Audit': 20,
  'Primary Order': 21,
  'Secondary Order': 22,
  Invoice: 23,
  'Payments/CN': 24,
  'Sales Dashboards': 25,
  Scheme: 32,
};

global.GLOBAL_CONTROLLERS = ['s3', 'log', 'form-builder', 'table-builder'];
global.FILES_LABEL = { 0: 'Profile Pic', 1: 'Shop Image' };
global.DEFAULT_MAX_DISTANCE = 5000;
global.EARTH_REDIUS_IN_METERS = 6378137;
global.DEFAULT_NOTIFICATION_TAT = '24h';
global.FOLLOWUP_TAB = { 1: 'Pending', 2: 'Upcoming', 3: 'Complete' };
global.COMPLAINT_TAB = { 1: 'Pending', 2: 'Close', 3: 'Cancel' };
global.MODULE_TYPE = { 1: 'Parent', 2: 'Child' };
global.EVENT_STATUS = {
  1: 'Pending',
  2: 'Upcoming',
  3: 'Inprocess',
  4: 'Complete',
  5: 'Reject',
  6: 'Total',
  7: 'Approved',
};
global.INSIDE_BANNER = {
  1: 'refferal_list',
  2: 'home',
  3: 'reward_list',
  4: 'QR_list',
  5: 'Social_list',
};
global.ADDRESS_FETCH_ATTEMPT = 3;
global.DROPDOWN_NAME = {
  1: 'Category Name',
  2: 'Check List',
  3: 'category_name',
};
global.MODULE_ROUTES = {
  1: 'app-activity',
  2: 'app-order',
  3: 'product',
  4: 'product-discount',
  5: 'route',
  6: 'timeline',
  7: 'timeline-csv',
  8: 'locations',
  9: 'app-siteproject',
  10: 'app-enquiry',
  11: 'app-ticket',
  12: 'sites',
  13: 'enquiry',
  14: 'ticket',
  15: 'customer',
  16: 'order',
  17: 'app-activity',
  18: 'app-home',
  19: 'secondary-order',
  20: 'app-expense',
  21: 'app-secondary-order',
  22: 'app-order',
  23: 'app-quotation',
  24: 'app-event',
  25: 'event',
  26: 'app-target',
  27: 'app-customer',
  28: 'app-complaint-invoice',
  29: 'app-purchase',
  30: 'app-user',
  31: 'enquiry',
  32: 'app-enquiry',
  33: 'home',
  34: 'user',
  35: 'customer-influencer',
  36: 'app-customer-influencer',
  37: 'complaint',
};
global.LOCAL_FIELDS = {
  1: '_id',
};
global.TAT_UNIT = {
  1: 'd',
};
global.POST_FIX = {
  1: 'ago',
};
global.STATIC_VALUES = {
  1: 'Not Visited Yet',
};
global.FORM_ID = 1;
global.DISCOUNT_TYPE = { 1: 'Category', 2: 'Product' };
global.ORDER_STATUS = {
  1: 'Pending',
  2: 'Approved',
  3: 'Reject',
  4: 'Hold',
  5: 'Partial Planned',
  6: 'Complete Planned',
  7: 'Partial Dispatched',
  8: 'Dispatched',
  9: 'Partially Planned & Dispatched',
};
global.CUSTOMER_LOGIN_TYPES = [5, 6, 7, 10];
global.SYSTEM_USER_LOGIN_TYPES = [2, 3];
global.INPUT_TYPE = { 1: 'Qty', 2: 'Value' };
global.COMMON_STATUS = { 1: 'Pending' };
global.USER_PERCENATGE_INFO = [
  'name',
  'mobile',
  'email',
  'user_code',
  'designation',
  'reporting_manager_name',
  'pincode',
  'address',
];
global.REJECT_STATUS = ['Reject', 'Rejected'];
