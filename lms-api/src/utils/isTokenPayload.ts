import { TokenPayload } from '../services/authService/auth.interface'; // adjust path if needed

export function isTokenPayload(obj: any): obj is TokenPayload {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.role === 'string' &&
    typeof obj.firstName === 'string' &&
    typeof obj.lastName === 'string' &&
    typeof obj.isActive === 'boolean'
  );
}
