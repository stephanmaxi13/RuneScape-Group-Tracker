import { Controller, Get } from '@nestjs/common';
import { DiscordBotService } from './discord-bot.service';

@Controller()
export class DiscordBotController {
  constructor(private readonly discordBotService: DiscordBotService) {}

  @Get('ping-check') // Access via http://localhost:3000/ping-check
  getHello(): string {
    return this.discordBotService.getHelloMessage();
  }
}
