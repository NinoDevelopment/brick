import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

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
  show: Boolean;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
