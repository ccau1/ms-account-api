import { Document, PaginateModel } from 'mongoose';
import { ObjectId } from 'mongodb';

export interface AuthToken {
  code: string;
  expiresAt: Date;
}
export interface Auth extends Document {
  _id: ObjectId;
  password: string;
  user: string;
  refreshTokens: AuthToken[];
  genTokens: AuthToken[];
}

export type AuthModel = PaginateModel<Auth>;
