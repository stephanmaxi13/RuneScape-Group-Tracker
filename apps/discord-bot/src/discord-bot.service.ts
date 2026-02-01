import { Injectable } from '@nestjs/common';

@Injectable()
export class DiscordBotService {
  getHello(): string {
    return 'Hello World!';
  }
}
