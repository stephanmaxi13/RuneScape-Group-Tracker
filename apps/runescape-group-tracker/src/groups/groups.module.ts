import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { GroupService } from './groups.service';
import { GroupsController } from './groups.controller';
import { CommonModule } from '@runescape-group-tracker/common';
import { PlayerModule } from '../players/players.module';

@Module({
  imports: [HttpModule, CommonModule, PlayerModule],
  controllers: [GroupsController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
