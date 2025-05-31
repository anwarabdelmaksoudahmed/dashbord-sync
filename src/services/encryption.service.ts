import CryptoJS from 'crypto-js';
import type { EncryptedData } from '../types';

export class EncryptionService {
  private static readonly KEY_LENGTH = 16;

  static decodeBase64(str: string): string {
    try {
      // Remove any potential escape sequences and non-base64 characters
      const cleanedStr = str.replace(/\\/g, '').replace(/[^A-Za-z0-9+/=]/g, '');
      console.log('Cleaned base64 string:', cleanedStr);
      
      // Try CryptoJS first
      try {
        const parsed = CryptoJS.enc.Base64.parse(cleanedStr);
        const result = parsed.toString(CryptoJS.enc.Utf8);
        console.log('CryptoJS decoded result:', result);
        return result;
      } catch (e) {
        console.log('CryptoJS decode failed, trying atob');
        // Fallback to atob
        const result = atob(cleanedStr);
        console.log('atob decoded result:', result);
        return result;
      }
    } catch (error) {
      console.error('Base64 decoding failed:', error);
      throw new Error('Failed to decode Base64 string');
    }
  }

  static getDecryptionKey(decodedD: string): string {
    // Use first 16 characters of decoded 'd' as the key
    const key = decodedD.substring(0, this.KEY_LENGTH);
    console.log('Generated decryption key:', key);
    return key;
  }

  static async decryptResponse<T>(encryptedData: EncryptedData): Promise<T> {
    try {
      if (!encryptedData?.d || !encryptedData?.n) {
        throw new Error('Missing required encryption fields');
      }

      console.log('Original encrypted data:', encryptedData);

      // Decode the base64 fields
      const decodedD = this.decodeBase64(encryptedData.d);
      const decodedN = this.decodeBase64(encryptedData.n);

      console.log('Decoded d:', decodedD);
      console.log('Decoded n:', decodedN);

      // Get the decryption key (first 16 chars of decoded 'd')
      const key = this.getDecryptionKey(decodedD);
      console.log('Decryption key:', key);

      // Create WordArrays for key and nonce
      const keyWordArray = CryptoJS.enc.Utf8.parse(key);
      const nonceWordArray = CryptoJS.enc.Utf8.parse(decodedN);

      console.log('Key WordArray:', keyWordArray.toString());
      console.log('Nonce WordArray:', nonceWordArray.toString());

      // Create cipher params
      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Base64.parse(encryptedData.d),
        iv: nonceWordArray
      });

      console.log('Cipher params:', {
        ciphertext: cipherParams.ciphertext.toString(),
        iv: cipherParams.iv.toString()
      });

      // Decrypt using AES-CBC
      const decrypted = CryptoJS.AES.decrypt(cipherParams, keyWordArray, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
        iv: nonceWordArray
      });

      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      console.log('Decrypted string:', decryptedString);

      if (!decryptedString) {
        throw new Error('Decryption resulted in empty string');
      }

      try {
        const parsedData = JSON.parse(decryptedString);
        console.log('Parsed data:', parsedData);
        return parsedData;
      } catch (parseError) {
        console.error('Failed to parse decrypted data:', parseError);
        throw new Error('Failed to parse decrypted data');
      }
    } catch (error: unknown) {
      console.error('Decryption failed:', error);
      throw new Error(`Failed to decrypt response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async encryptData<T>(data: T, key: string): Promise<EncryptedData> {
    try {
      // Generate a random nonce using CryptoJS
      const nonce = CryptoJS.lib.WordArray.random(12);
      const keyWordArray = CryptoJS.enc.Utf8.parse(key);

      console.log('Encryption key:', key);
      console.log('Generated nonce:', nonce.toString());

      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), keyWordArray, {
        iv: nonce,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      console.log('Encrypted result:', {
        ciphertext: encrypted.ciphertext.toString(),
        iv: encrypted.iv.toString()
      });

      return {
        d: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
        n: nonce.toString(CryptoJS.enc.Base64),
        t: new Date().toISOString()
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }
} 