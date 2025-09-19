import crypto from 'crypto';

export class PasswordUtil {
  static generateSecurePassword(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    const bytes = crypto.randomBytes(length);
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += chars[bytes[i] % chars.length];
    }
    
    return password;
  }
}

export const passwordUtil = new PasswordUtil();