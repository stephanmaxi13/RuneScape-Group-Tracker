import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Player, PlayerSchema } from '../../players/schemas/player.schema';

export type GroupDocument = HydratedDocument<Group>;

@Schema()
export class Group {
  @Prop({ required: true, unique: true, index: true })
  name: string;

  @Prop([PlayerSchema])
  players: Player[];
}

export const GroupSchema = SchemaFactory.createForClass(Group);
