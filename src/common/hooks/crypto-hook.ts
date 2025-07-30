
import { CryptoService } from 'src/services/crypto.service';
export function cryptoHook(schema: any, encryptedFields: string[], cryptoService: CryptoService) {
  schema.pre('save', async function (next: any) {
    const doc = this as any;
    for (const field of encryptedFields) {
      if (doc[field]) {
        doc[field] = await cryptoService.encrypt(doc[field]);
      }
    }
    next();
  });

  schema.pre(['updateOne', 'updateMany'], async function (next: any) {
    const update = this.getUpdate() as Record<string, any>;
    if (!update) return next();

    for (const field of encryptedFields) {
      if (update[field]) {
        update[field] = await cryptoService.encrypt(update[field]);
      }
      if (update.$set && update.$set[field]) {
        update.$set[field] = await cryptoService.encrypt(update.$set[field]);
      }
    }

    this.setUpdate(update);
    next();
  });

  schema.post('find', async function (docs: any[]) {
    if (!docs || docs.length === 0) return;

    await Promise.all(
      docs.map(async (doc) => {
        for (const field of encryptedFields) {
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
      encryptedFields.map(async (field) => {
        if (doc[field]) {
          doc[field] = await cryptoService.decrypt(doc[field]);
        }
      })
    );
  });
}
