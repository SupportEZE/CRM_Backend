import * as CryptoJS from 'crypto-js';
import { Global, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';

@Global()
@Injectable()
export class CryptoService {
    private readonly secretKey: CryptoJS.lib.WordArray;
    private readonly iv: CryptoJS.lib.WordArray;
    
    constructor(private readonly configService: ConfigService<AllConfigType>) {
        const secretKeyStr = this.configService.getOrThrow('app.apiEncryptionKey', { infer: true });
        const ivStr = this.configService.getOrThrow('app.apiEncryptionIV', { infer: true });
        
        // Ensure key and IV are correctly formatted (Assuming Hex or Utf8)
        this.secretKey = CryptoJS.enc.Utf8.parse(secretKeyStr);
        this.iv = CryptoJS.enc.Utf8.parse(ivStr);
        
    }
    
    /**
    * Encrypts data using AES encryption (CBC mode, PKCS7 padding).
    */
    async encrypt(data: any,time:boolean=false): Promise<string> {
        try {
            let payload : Record<string,any>={};
            if(time) payload._encryptedAt = new Date().toISOString()
            if(typeof data === 'object'){
                payload = {...payload,...{data}}
            }else{
                payload.data = data
            }
            const jsonString = JSON.stringify(payload);
            const encrypted = CryptoJS.AES.encrypt(jsonString, this.secretKey, {
                iv: this.iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
            });
            
            return encrypted.toString(); // Return Base64 encoded ciphertext
        } catch (error) {
            console.error('❌ Encryption error:', error);
            return null
        }
    }
    
    
    /**
    * Decrypts AES encrypted data.
    */
    async decrypt(ciphertext: string, maxAgeMinutes = 15): Promise<any> {
        try {
            const decrypted = CryptoJS.AES.decrypt(ciphertext, this.secretKey, {
                iv: this.iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
            });
            
            const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
            const data = JSON.parse(decryptedText); 
            
            // Validate expiry
            if (data._encryptedAt) {

                const encryptedAt = new Date(data._encryptedAt).getTime();
                const now = Date.now();
                
                const ageInMinutes = (now - encryptedAt) / (1000 * 60);
                
                if (ageInMinutes > maxAgeMinutes) {
                    throw new Error(`Encrypted data expired. Age: ${ageInMinutes.toFixed(2)} minutes`);
                }
            }
             
            return data?.data || null;
        } catch (error) {
            console.error('❌ Decryption error:', error.message || error);
            return null; // or throw error
        }
    }
    
}
