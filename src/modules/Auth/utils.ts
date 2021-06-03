import { genSalt, hash } from 'bcrypt';

export const hashPlainText = async (plainText: string) => {
  // create salt for hashing
  const salt = await genSalt(10);

  return hash(plainText, salt);
};
