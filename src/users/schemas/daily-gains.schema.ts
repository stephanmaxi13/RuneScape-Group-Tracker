import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DailyGainDocument = HydratedDocument<DailyGain>;

@Schema({ timestamps: true })
export class DailyGain {
  @Prop({ required: true, index: true })
  username: string;

  @Prop({ required: true, index: true })
  date: string; // YYYY-MM-DD

  @Prop()
  overallXpGained: number;

  @Prop({ type: Array })
  skillsGained: any[];

  @Prop({ type: Array })
  activitiesGained: any[];
}

export const DailyGainSchema = SchemaFactory.createForClass(DailyGain);
