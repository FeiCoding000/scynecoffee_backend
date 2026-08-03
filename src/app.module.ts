import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DrinkConfigurationsModule } from './drink-configurations/drink-configurations.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { FirebaseModule } from './infrastructure/firebase/firebase.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    FirebaseModule,
    AuthModule,
    UsersModule,
    DrinkConfigurationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
