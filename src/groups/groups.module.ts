import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from './schemas/group.schema';
import { GroupService } from './groups.service';
import { Gains, GainsSchema } from './schemas/gains.schema';
import { PlayerModule } from 'src/players/players.module';
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
