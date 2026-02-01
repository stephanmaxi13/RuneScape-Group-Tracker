import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from 'libs/common/src/schemas/group.schema';
import { GroupService } from './groups.service';
import { Gains, GainsSchema } from 'libs/common/src/schemas/gains.schema';
import { PlayerModule } from 'apps/runescape-group-tracker/src/players/players.module';
import { GroupsController } from './groups.controller';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Group.name, schema: GroupSchema },
      { name: Gains.name, schema: GainsSchema },
    ]),
    PlayerModule,
  ],
  controllers: [GroupsController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
