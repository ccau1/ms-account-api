import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/Auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { HomeModule } from './modules/Home/home.module';
import mongoConnectionString from './core/mongo/mongoConnectionString';
import { UserModule } from './modules/User/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(mongoConnectionString, {
      useCreateIndex: true,
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
      connectionName: 'Database',
    }),
    AuthModule,
    UserModule,
    HomeModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
