import { Module } from '@nestjs/common';
import { DiscordBotController } from './discord-bot.controller';
import { DiscordBotService } from './discord-bot.service';

@Module({
  imports: [],
  controllers: [DiscordBotController],
  providers: [DiscordBotService],
})
export class DiscordBotModule {}
