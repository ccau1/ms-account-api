export interface AuthCreateModel {
  // user id
  user: string;
  // plain password
  password: string;
  // isLocked flag
  isLocked?: boolean;
  // define which transports has been verified
  verified?: {
    email?: boolean;
    sms?: boolean;
  };
}
