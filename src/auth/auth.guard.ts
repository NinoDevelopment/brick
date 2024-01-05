import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Observable } from "rxjs";
import { Auth } from "./schema/auth";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import * as argon2 from "argon2";
import * as crypto from "crypto";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@InjectModel(Auth.name) private authModel: Model<Auth>) {}

  private hashingConfig = {
    // based on OWASP cheat sheet recommendations (as of March, 2022)
    parallelism: 1,
    memoryCost: 64000, // 64 mb
    timeCost: 3, // number of itetations
  };

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.checkApiKey(request);
  }

  private async checkApiKey(request: any): Promise<boolean> {
    const headers = request.headers;
    const authHeader = headers["authorization"];
    if (!authHeader) throw new UnauthorizedException("не авторизован");
    const auth = await this.authModel.find();
    if (!auth) throw new UnauthorizedException("не авторизован");
    for (const a of auth) {
      const verifResult = await this.verifyKeyWithHash(authHeader, a.apiKey);
      if (verifResult) return true;
    }
    return false;
  }

  private async verifyKeyWithHash(password: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, password, this.hashingConfig);
  }
}
