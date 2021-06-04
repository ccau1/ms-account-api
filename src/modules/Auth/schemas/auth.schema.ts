import mongoose from 'mongoose';

export const AuthSchema = new mongoose.Schema(
  {
    password: { type: String, required: true },
    user: { type: mongoose.SchemaTypes.ObjectId, required: true, ref: 'Users' },
    // refresh token passed to user on login. User can use this along with
    // access token to get a new access token and refresh token without login again
    refreshTokens: [
      {
        code: { type: String },
        expiresAt: { type: Date },
      },
    ],
    // generic token for tasks like: reset password, confirm email
    genTokens: [
      {
        code: { type: String },
        expiresAt: { type: Date },
      },
    ],
    // handle login channels like facebook and google
    loginChannels: [
      {
        // ie. facebook, google
        channel: { type: String },
        // channel user id
        id: { type: String },
      },
    ],
    isLocked: { type: Boolean },
    isVerified: { type: Boolean },
    verified: {
      email: { type: Boolean },
      sms: { type: Boolean },
    },
  },
  {
    collection: 'Auths',
    timestamps: true,
  },
);
