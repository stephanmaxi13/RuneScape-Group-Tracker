import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { Player, PlayerSchema } from './users/schemas/player.schema';
import { Group, GroupSchema } from './users/schemas/group.schema';

@Module({
  imports: [HttpModule, MongooseModule.forRoot('mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.5.10'), MongooseModule.forFeature([
    { name: Player.name, schema: PlayerSchema }, {name: Group.name, schema: GroupSchema}
  ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
