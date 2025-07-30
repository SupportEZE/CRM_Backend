import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { CryptoService } from 'src/services/crypto.service';
import { AllConfigType } from 'src/config/config.type';

@Schema({ collection: COLLECTION_CONST().CRM_CUSTOMER_DOCS })
export class Base extends Document { }
const CustomerDocsSchema = SchemaFactory.createForClass(Base);
CustomerDocsSchema.add(ParentSchema.obj);

@Schema()
export class CustomerDocsModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: Types.ObjectId })
  row_id: number;

  @Prop({ type: Object })
  label: Record<string, any>;

  @Prop({ type: String })
  doc_no: string;

  @Prop({ type: String })
  file_path: string;

  @Prop({ type: String })
  file_type: string;

  @Prop({ type: String })
  thumbnail_path: string;

  @Prop({ type: String })
  big_thumbnail_path: string;

  @Prop({ type: String })
  signed_url_thumbnail: string;

  @Prop({ type: Date })
  signed_url_expire_thumbnail: Date;

  @Prop({ type: String })
  signed_url_big_thumbnail: string;

  @Prop({ type: Date })
  signed_url_expire_big_thumbnail: Date;

  @Prop({ type: String })
  signed_url: string;

  @Prop({ type: Date })
  signed_url_expire: Date;

  static encryptedFields = ['doc_number'];

}

const childSchema = SchemaFactory.createForClass(CustomerDocsModel);
CustomerDocsSchema.add(childSchema.obj);
// Function to apply encryption hooks
export function applyEncryptionHooks(schema: any, configService: ConfigService<AllConfigType>) {
  const cryptoService = new CryptoService(configService);
  schema.pre('save', async function (next: any) {
    const doc = this as any;

    for (const field of CustomerDocsModel.encryptedFields) {
      if (doc[field]) {
        doc[field] = await cryptoService.encrypt(doc[field]);
      }
    }
    next();
  });

  schema.post('find', async function (docs: any[]) {
    if (!docs || docs.length === 0) return;

    await Promise.all(
      docs.map(async (doc) => {
        for (const field of CustomerDocsModel.encryptedFields) {
          if (doc[field]) {
            doc[field] = await cryptoService.decrypt(doc[field]);
          }
        }
      })
    );
  });

  schema.post('findOne', async function (doc: any) {
    if (!doc) return;
    await Promise.all(
      CustomerDocsModel.encryptedFields.map(async (field) => {
        if (doc[field]) {
          doc[field] = await cryptoService.decrypt(doc[field]);
        }
      })
    );
  });
}
export { CustomerDocsSchema };
