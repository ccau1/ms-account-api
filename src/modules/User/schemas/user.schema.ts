import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export const UserSchema = new mongoose.Schema(
  {
    username: { type: String },
    email: { type: String },
    meta: { type: mongoose.SchemaTypes.Mixed, default: {} },
  },
  {
    collection: 'Users',
    timestamps: true,
  },
);

UserSchema.plugin(mongoosePaginate);
