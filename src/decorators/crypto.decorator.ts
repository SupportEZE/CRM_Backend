import { SetMetadata } from '@nestjs/common';
export const CRYPTO_KEY = 'crm';
export const Crypto = (decrypt: boolean = true, encrypt: boolean = true) =>
    SetMetadata(CRYPTO_KEY, { encrypt, decrypt });

