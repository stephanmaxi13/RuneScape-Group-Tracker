import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { Player, PlayerSchema } from './users/schemas/player.schema';
import { Group, GroupSchema } from './users/schemas/group.schema';
import { Snapshot, snapshotSchema } from './users/schemas/snapshot.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HttpModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGO_URI'),
      }),
    }),
    MongooseModule.forFeature([
      { name: Player.name, schema: PlayerSchema },
      { name: Group.name, schema: GroupSchema },
      { name: Snapshot.name, schema: snapshotSchema },
    ]),
  ],
  controllers: [AppController], 
  providers: [AppService],
})
export class AppModule {}

