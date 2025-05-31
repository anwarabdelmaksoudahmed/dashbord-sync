import type { EncryptedData } from "../types";

export class EncryptionService {
  private static readonly KEY_LENGTH = 16;

  static async decryptResponse(
    encryptedData: EncryptedData
  ): Promise<object | null> {
    const decodedData = this.base64Decode(encryptedData.d);

    const key = this.getDecryptionKey(decodedData);
    const data = this.getEncryptedData(decodedData);

    const tag = this.base64Decode(encryptedData.t);
    const iv = this.base64Decode(encryptedData.n);

    return this.decryptData(
      this.binaryToUint8Array(key),
      this.binaryToUint8Array(iv),
      this.binaryToUint8Array(tag),
      this.binaryToUint8Array(data)
    );
  }

  private static async getCryptoKey(key: Uint8Array): Promise<CryptoKey> {
    return crypto.subtle.importKey("raw", key, { name: "AES-GCM" }, false, [
      "decrypt",
    ]);
  }

  private static async decryptData(
    key: Uint8Array,
    iv: Uint8Array,
    tag: Uint8Array,
    cipherText: Uint8Array
  ): Promise<object | null> {
    try {
      const cryptoKey = await this.getCryptoKey(key);

      const combined = new Uint8Array(cipherText.byteLength + tag.byteLength);
      combined.set(new Uint8Array(cipherText), 0);
      combined.set(new Uint8Array(tag), cipherText.byteLength);

      const decryptedData = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
          tagLength: 128,
        },
        cryptoKey,
        combined
      );

      const data = new TextDecoder().decode(decryptedData);

      return JSON.parse(data);
    } catch (error) {
      console.error("Decryption failed:", error);
      return null;
    }
  }

  private static getDecryptionKey(decodedD: string): string {
    return decodedD.substring(0, this.KEY_LENGTH);
  }

  private static getEncryptedData(encryptedData: string): string {
    return encryptedData.substring(this.KEY_LENGTH);
  }

  private static binaryToUint8Array(binaryString: string): Uint8Array {
    const len = binaryString.length;

    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes;
  }

  private static base64Decode(base64: string): string {
    return atob(base64);
  }
}
