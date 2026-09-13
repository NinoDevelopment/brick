import { Controller, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthGuard } from "./auth/auth.guard";
import {
  clearAdminCookie,
  extractAdminSecret,
  isSecureRequest,
  setAdminCookie,
} from "./auth/admin-cookie";

@Controller("api")
export class AppController {
  @Post("auth")
  @UseGuards(AuthGuard)
  auth(@Req() request: Request, @Res() response: Response): void {
    const secret = extractAdminSecret(request.headers);
    if (secret) {
      setAdminCookie(response, secret, isSecureRequest(request));
    }
    response.status(201).json(true);
  }

  @Post("logout")
  logout(@Req() request: Request, @Res() response: Response): void {
    clearAdminCookie(response, isSecureRequest(request));
    response.status(201).json({ success: true });
  }
}
