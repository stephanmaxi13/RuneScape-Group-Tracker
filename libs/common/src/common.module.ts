import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Player, PlayerSchema } from './schemas/player.schema';
import { Gains, GainsSchema } from './schemas/gains.schema';
import { Group, GroupSchema } from './schemas/group.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Player.name, schema: PlayerSchema },
      { name: Gains.name, schema: GainsSchema },
      { name: Group.name, schema: GroupSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class CommonModule {}
