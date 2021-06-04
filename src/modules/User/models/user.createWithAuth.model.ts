interface UserCreateWithAuthModel extends UserCreateModel {
  password: string;
  // isLocked flag
  isLocked?: boolean;
  // define which transports has been verified
  verified?: {
    email?: boolean;
    sms?: boolean;
  };
}
