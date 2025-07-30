import * as dotenv from 'dotenv';
dotenv.config();
export const DB_NAMES = () => ({
  COUPON_DB: process.env.COUPON_DB_NAME,
  SUPPORT_DB: process.env.SUPPORT_DB_NAME,
  CORE_DB: process.env.CORE_DB_NAME,
  CUSTOM_DB: process.env.CUSTOM_DB_NAME
});

