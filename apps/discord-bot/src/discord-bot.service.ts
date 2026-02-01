import { Injectable } from '@nestjs/common';
import * as necord from 'necord';

@Injectable()
export class DiscordBotService {
  // Shared logic that doesn't care about the platform
  getHelloMessage(): string {
    return 'Pong! 🪓 OSRS Bot is active.';
  }

  @necord.SlashCommand({ name: 'ping', description: 'Ping command!' })
  public async onPing(
    @necord.Context() [interaction]: necord.SlashCommandContext,
  ) {
    // Discord path
    return interaction.reply({ content: this.getHelloMessage() });
  }
}
