export type AppConfig = {
  nodeEnv: string;
  name: string;
  rootPath: string;
  port: number;
  apiPrefix: string;
  secretKey: string;
  apiEncryptionKey: string;
  apiEncryptionIV: string;
  sharedProjectUrl:string;
  authProjectUrl:string;
  redisUrl:string
};
