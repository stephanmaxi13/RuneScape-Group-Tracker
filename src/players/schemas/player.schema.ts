import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Skill, SkillSchema } from './skill.schema';
import { Activities, ActivitySchema } from './activities.schema';
import { Snapshot, snapShotSchema } from './snapshot.schema';

export type PlayerDocument = HydratedDocument<Player>;

@Schema({
  collation: { locale: 'en', strength: 2 }, // Strength 2 means ignore case
})
export class Player {
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

  @Prop({ type: [snapShotSchema], default: [] })
  snapshots: Snapshot[];
}

export const PlayerSchema = SchemaFactory.createForClass(Player);
