import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Activities {
  @Prop()
  id: number;

  @Prop()
  name: string;

  @Prop()
  rank: number;

  @Prop()
  score: number;
}

export const ActivitySchema = SchemaFactory.createForClass(Activities);
