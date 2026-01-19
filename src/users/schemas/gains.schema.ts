import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { SkillSchema, Skill } from './skill.schema'; // Import your existing ones
import { ActivitySchema, Activities } from './activities.schema';

export type GainsDocument = HydratedDocument<Gains>;

@Schema()
export class Gains {
  @Prop({ required: true, index: true })
  username: string;

  @Prop({ required: true, index: true })
  date: string; // The "Start Date" of the period (Monday for weekly, 1st for monthly)

  @Prop({ required: true, enum: ['daily', 'weekly', 'monthly'], index: true })
  period: string;

  @Prop({ default: 0 })
  overallXpGained: number;

  // REUSE your existing schemas here
  @Prop({ type: [SkillSchema] })
  skillsGained: Skill[];

  @Prop({ type: [ActivitySchema] })
  activitiesGained: Activities[];
}

export const GainsSchema = SchemaFactory.createForClass(Gains);
