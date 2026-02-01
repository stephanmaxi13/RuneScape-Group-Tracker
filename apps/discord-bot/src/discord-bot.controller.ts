import { Controller, Get } from '@nestjs/common';
import { DiscordBotService } from './discord-bot.service';

@Controller()
export class DiscordBotController {
  constructor(private readonly discordBotService: DiscordBotService) {}

  @Get()
  getHello(): string {
    return this.discordBotService.getHello();
  }
}
