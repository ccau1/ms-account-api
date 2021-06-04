import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export const UserSchema = new mongoose.Schema(
  {
    username: { type: String, index: true, unique: true },
    email: { type: String, index: true, unique: true },
    firstName: { type: String, index: true },
    lastName: { type: String, index: true },
    phone: {
      // international code ie. +852, +1
      intlCode: { type: String, index: true },
      no: { type: String, index: true },
    },
    meta: { type: mongoose.SchemaTypes.Mixed, default: {} },
  },
  {
    collection: 'Users',
    timestamps: true,
  },
);

UserSchema.plugin(mongoosePaginate);
