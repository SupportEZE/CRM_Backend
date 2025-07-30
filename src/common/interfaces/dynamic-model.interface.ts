// interfaces/dynamic-model.interface.ts

import { Model, Schema, Document } from 'mongoose';

export interface DynamicModelResolver {
  getModel<T extends Document>(
    entity: string,
    schema: Schema<T>,
    req: Request,
    matchContext?: Record<string, any>,
  ): Promise<Model<T>>;
}
