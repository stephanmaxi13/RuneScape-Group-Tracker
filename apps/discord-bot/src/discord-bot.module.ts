import { Module } from '@nestjs/common';
import { NecordModule } from 'necord';
import { GatewayIntentBits } from 'discord.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonModule } from '@runescape-group-tracker/common';
import { DiscordBotService } from './discord-bot.service';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // This makes it available to all other modules in this app
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGO_URI'),
      }),
    }),
    NecordModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        token: config.getOrThrow<string>('DISCORD_TOKEN'),
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
        // This automatically registers slash commands in your development server
        development:
          config.get('NODE_ENV') !== 'production'
            ? [config.getOrThrow<string>('YOUR_TEST_GUILD_ID')]
            : false,
      }),
    }),
    CommonModule,
  ],
  providers: [DiscordBotService],
})
export class DiscordBotModule {}
