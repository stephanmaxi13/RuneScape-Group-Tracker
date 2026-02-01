import { Controller, Get, Query } from '@nestjs/common';
import { PlayersService } from './players.service';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get('get-player')
  async getPlayer(@Query('username') username: string) {
    return this.playersService.fetchAndUpsertPlayer(username);
  }
  @Get('get-gains')
  async getPlayerGains(
    @Query('period') period: string,
    @Query('username') username: string,
    @Query('date') date: string,
  ) {
    return this.playersService.getGains(
      period,
      username,
      date ? new Date(date) : new Date(),
    );
  }
}
