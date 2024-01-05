import { Controller, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "./auth/auth.guard";

@Controller("api")
export class AppController {
  @Post("auth")
  @UseGuards(AuthGuard)
  async auth(): Promise<boolean> {
    return true;
  }
}
