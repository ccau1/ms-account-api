import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Scope,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserModel, User } from './interfaces/user';
import { UserSearchModel } from './models/user.search.model';
import mongoose from 'mongoose';
import merge from 'lodash/merge';
import { AuthService } from '../Auth/auth.service';

@Injectable()
@Injectable({ scope: Scope.REQUEST })
export class UserService {
  constructor(
    @InjectModel('Users') private readonly userRepository: UserModel,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  protected async castQuery(query: UserSearchModel) {
    // initiate query's $and array
    const queryAnd = [];

    // if verifyField exists
    if (query.verifyField) {
      // clear out all extra characters to prevent
      // dangerous search
      const sanitizedField = query.verifyField.replace(/[^\w\d_\-@\.]+/g, '');
      // add search for _id, username, email matching
      // verifyField
      queryAnd.push({
        $or: [
          ...(mongoose.isValidObjectId(sanitizedField)
            ? [{ _id: sanitizedField }]
            : []),
          { username: new RegExp(`^${sanitizedField}$`, 'i') },
          { email: new RegExp(`^${sanitizedField}$`, 'i') },
          { 'phone.no': new RegExp(`^${sanitizedField}$`, 'i') },
        ],
      });
    }

    if (query._ids) {
      queryAnd.push({
        _id: { $in: query._ids },
      });
    }

    // return object optionally with $and field
    return queryAnd.length ? { $and: queryAnd } : {};
  }

  public async find(query: UserSearchModel): Promise<User[]> {
    const q = await this.castQuery(query);
    return this.userRepository.find(q);
  }

  public async findOne(query: UserSearchModel): Promise<User> {
    const q = await this.castQuery(query);
    return this.userRepository.findOne(q);
  }

  public async isUsernameAvailable(username: string) {
    return !!this.userRepository.findOne({
      username: new RegExp(`^${username}$`, 'i'),
    });
  }

  public async isEmailAvailable(email: string) {
    return !!this.userRepository.findOne({
      email: new RegExp(`^${email}$`, 'i'),
    });
  }

  public async setUserMeta(
    userId: string,
    meta: { [key: string]: any },
    opts?: { merge?: boolean },
  ) {
    // get user by id
    const user = await this.userRepository.findById(userId);
    if (!user) throw new BadRequestException({ code: 'user_not_found' });

    // save user meta
    user.meta = opts?.merge ? merge(user.meta, meta) : meta;
    // save and return new user
    return user.save();
  }

  public async createUser(user: UserCreateModel) {
    return this.createUser(user);
  }

  public async createUserWithAuth(user: UserCreateWithAuthModel) {
    const { isLocked, verified, password } = user;
    const userCreated = await this.userRepository.create(user);
    await this.authService.create({
      user: userCreated._id.toHexString(),
      isLocked,
      verified,
      password,
    });
    return userCreated;
  }
}
