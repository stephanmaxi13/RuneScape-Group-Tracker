import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Skill } from './skill.schema';
import { Activities } from './activities.schema';


export type snapshotDocument = HydratedDocument<Snapshot>;

@Schema({ _id: false })
export class Snapshot {
  @Prop()
  timeStamp: Date;

  @Prop()
  overallLevel: number;

  @Prop()
  overallXp: number;

  @Prop()
  skills: Skill[];

  @Prop()
  activities: Activities[];
}

export const snapShotSchema = SchemaFactory.createForClass(Snapshot);