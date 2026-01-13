import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Skill, SkillSchema } from './skill.schema';
import { Activities, ActivitySchema } from './activities.schema';


export type PlayerDocument = HydratedDocument<Player>;

@Schema()
export class Player{

  @Prop({ required: true, unique: true, index: true })
  username: string;

  @Prop()
  overallLevel: number;

  @Prop()
  overallXp: number;

  @Prop([SkillSchema])
  skills: Skill[];

  @Prop([ActivitySchema])
  activities: Activities[];

}

export const PlayerSchema = SchemaFactory.createForClass(Player);