import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PlayerModule } from './players/players.module';
import { GroupModule } from './groups/groups.module';
@Module({
  imports: [
    //Load the .env file and makes variable availabel via ConfigSerce
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Api Calls
    HttpModule,
    //Database Configuration
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGO_URI'), // Pulls the connection string from .env
      }),
    }),
    PlayerModule,
    GroupModule,
  ],
  controllers: [AppController], //Handles HTTP request
  providers: [],
})
export class AppModule {}
