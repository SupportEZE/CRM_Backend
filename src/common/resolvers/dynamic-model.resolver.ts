import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { DB_NAMES } from 'src/config/db.constant';
import { LoginTypeSchema } from 'src/modules/master/rbac/models/login-type.model';
import { MultiClientRoutingService } from 'src/services/multi-client.service';
import { DynamicModelResolver } from '../interfaces/dynamic-model.interface';

@Injectable()
export class CentralDynamicModelResolver implements DynamicModelResolver {
  private modelInfo: Record<string, Model<any>> = {};

  constructor(
    @InjectConnection() private readonly defaultConnection: Connection,
    @InjectConnection(DB_NAMES().CUSTOM_DB)
    private customConnection: Connection,
    private readonly routingService: MultiClientRoutingService, // 👈 inject the service
  ) {}

  async getModel(
    entity: string,
    params: any,
    req: Request,
  ): Promise<Model<any>> {
    const context = { ...params }; // or enrich as needed
    const orgId = req['user']?.org_id?.toString() || 'default';
    const key = `${entity}_${orgId}`;

    const routing = await this.routingService.resolveRouting(
      entity,
      orgId,
      context,
    );

    const model = this.createModel(entity, routing);
    this.modelInfo[key] = model;

    return this.modelInfo[key];
  }

  private createModel(
    entity: string,
    routing: { connection?: string; prefix?: string } | null,
  ): Model<any> {
    const schemaMap: Record<string, any> = {
      loginType: LoginTypeSchema,
    };

    const collectionMap: Record<string, string> = {
      loginType: COLLECTION_CONST().CRM_LOGIN_TYPE,
    };

    const schema = schemaMap[entity];
    const baseCollection = collectionMap[entity];

    if (!schema || !baseCollection)
      throw new Error(`Unknown entity: ${entity}`);

    const finalCollectionName = routing?.prefix
      ? this.addClientToCollection(baseCollection, routing.prefix)
      : baseCollection;

    const connection =
      routing?.connection === DB_NAMES().CUSTOM_DB
        ? this.customConnection
        : this.defaultConnection;

    return connection.model(entity, schema, finalCollectionName);
  }

  private addClientToCollection(
    baseCollection: string,
    clientName: string,
  ): string {
    if (!clientName) return baseCollection;
    return baseCollection.replace(/^crm_/, `crm_${clientName}_`);
  }
}
