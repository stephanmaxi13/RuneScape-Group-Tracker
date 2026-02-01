import { NestFactory } from '@nestjs/core';
import { DiscordBotModule } from './discord-bot.module';

async function bootstrap() {
  // Use createApplicationContext for a bot that doesn't need an HTTP server
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const app = await NestFactory.createApplicationContext(DiscordBotModule);
  console.log('Bot is running...');
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
