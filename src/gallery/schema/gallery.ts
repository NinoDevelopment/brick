import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ProjectDocument = HydratedDocument<Project>;

@Schema()
export class Project {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  images: string[];

  @Prop({ default: true })
  show: boolean;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
