import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { Player, PlayerSchema } from './users/schemas/player.schema';
import { Group, GroupSchema } from './users/schemas/group.schema';
import { Snapshot, snapShotSchema } from './users/schemas/snapshot.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
    MongooseModule.forFeature([
      // Registers schemas so they can be injected into services using @InjectModel()
      { name: Player.name, schema: PlayerSchema },
      { name: Group.name, schema: GroupSchema },
      { name: Snapshot.name, schema: snapShotSchema },
    ]),
  ],
  controllers: [AppController], //Handles HTTP request
  providers: [AppService], //Contains business logic and DB intergrations
})
export class AppModule {}
