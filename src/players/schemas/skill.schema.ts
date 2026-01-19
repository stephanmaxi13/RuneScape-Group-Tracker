import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Skill {
  @Prop()
  id: number;

  @Prop()
  name: string;

  @Prop()
  rank: number;

  @Prop()
  level: number;

  @Prop()
  xp: number;
}

export const SkillSchema = SchemaFactory.createForClass(Skill);
