import { sign } from 'jsonwebtoken';

class RefreshToken {
  id: number;
  userId: number;
  userAgent: string;
  ipAddress: string;

  constructor(init?: Partial<RefreshToken>) {
    Object.assign(this, init);
  }

  sign(): string {
    return sign({...this}, process.env.REFRESH_SECRET)
  }
}

export default RefreshToken;
