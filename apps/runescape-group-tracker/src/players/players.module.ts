import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { PlayersService } from './players.service';
import { PlayersController } from './players.controller';
import { CommonModule } from '@runescape-group-tracker/common';

@Module({
  imports: [HttpModule, CommonModule],
  controllers: [PlayersController],
  providers: [PlayersService],
  exports: [PlayersService],
})
export class PlayerModule {}
