import { Injectable } from '@angular/core';
// import { Base64 } from 'js-base64';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class EncryptService {
  private key = CryptoJS.enc.Utf8.parse('4512631236589784');
  private iv = CryptoJS.enc.Utf8.parse('4512631236589784');
  constructor() { }

  // encrypt(text: string): string {
  //   return Base64.encode(`${text}:${this.rand()}`);
  // }

  // private rand() : string {
  //   return parseInt(`${10000 + ((1000000 - 1) * Math.random())}`).toString();
  // }

  encrypt(text: string): string {
    var encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(text), this.key, {
      keySize: 128 / 8,
      iv: this.iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    this.decryptUsingAES256(encrypted);
    return encrypted.toString();
  }

  decryptUsingAES256(decString) {
    var decrypted = CryptoJS.AES.decrypt(decString, this.key, {
      keySize: 128 / 8,
      iv: this.iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

}
