import { Test, TestingModule } from '@nestjs/testing';
import { DiscordBotController } from './discord-bot.controller';
import { DiscordBotService } from './discord-bot.service';

describe('DiscordBotController', () => {
  let discordBotController: DiscordBotController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [DiscordBotController],
      providers: [DiscordBotService],
    }).compile();

    discordBotController = app.get<DiscordBotController>(DiscordBotController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(discordBotController.getHello()).toBe('Hello World!');
    });
  });
});
