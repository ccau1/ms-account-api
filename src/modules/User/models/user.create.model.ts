interface UserCreateModel {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: {
    intlCode: string;
    no: string;
  };
  meta?: any;
}
