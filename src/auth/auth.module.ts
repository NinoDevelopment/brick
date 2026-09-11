import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthGuard } from "./auth.guard";
import { Auth, AuthSchema } from "./schema/auth";

@Module({
  imports: [MongooseModule.forFeature([{ name: Auth.name, schema: AuthSchema }])],
  providers: [AuthGuard],
  exports: [AuthGuard, MongooseModule],
})
export class AuthModule {}
