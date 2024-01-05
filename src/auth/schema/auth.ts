import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import * as mongoose from "mongoose";

export type AuthDocument = HydratedDocument<Auth>;

@Schema()
export class Auth {
  @Prop({ type: String, required: true })
  apiKey: string;

  @Prop({ type: String, default: "" })
  description: string;
}

export const AuthSchema = SchemaFactory.createForClass(Auth);
