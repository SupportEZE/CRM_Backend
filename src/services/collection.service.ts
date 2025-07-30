import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';

@Injectable()
export class CollectionService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async findByIdFromCollection(id: string, collectionName: string): Promise<any> {
    try {
      const objectId = new Types.ObjectId(id);
      const collection = this.connection.collection(collectionName);
      const result = await collection.findOne({ _id: objectId });
      return result;
    } catch (error) {
      throw new Error(`Error accessing collection '${collectionName}' with ID '${id}': ${error.message}`);
    }
  }
  async delete(id: string, collectionName: string): Promise<any> {
    try {
      const objectId = new Types.ObjectId(id);
      const collection = this.connection.collection(collectionName);
      const result = await collection.findOne({ _id: objectId });
      return result;
    } catch (error) {
      throw new Error(`Error accessing collection '${collectionName}' with ID '${id}': ${error.message}`);
    }
  }
}
