import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Player, PlayerSchema } from './schemas/player.schema';
import { PlayersService } from './players.service';
import { PlayersController } from './players.controller';
import { Gains, GainsSchema } from 'src/groups/schemas/gains.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Player.name, schema: PlayerSchema },
      { name: Gains.name, schema: GainsSchema },
    ]),
  ],
  controllers: [PlayersController],
  providers: [PlayersService],
  exports: [PlayersService],
})
export class PlayerModule {}
