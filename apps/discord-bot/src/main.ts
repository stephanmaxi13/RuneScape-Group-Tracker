import { NestFactory } from '@nestjs/core';
import { DiscordBotModule } from './discord-bot.module';

async function bootstrap() {
  const app = await NestFactory.create(DiscordBotModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
