import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import type { IncomingHttpHeaders } from "http";
import { Auth } from "./schema/auth";
import { extractAdminSecret } from "./admin-cookie";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@InjectModel(Auth.name) private authModel: Model<Auth>) {}

  private hashingConfig = {
    parallelism: 1,
    memoryCost: 64000,
    timeCost: 3,
  };

  private cache: { hashes: string[]; loadedAt: number } | null = null;
  private readonly cacheTtlMs = 60_000;

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.checkApiKey(request);
  }

  public async checkApiKey(request: { headers?: IncomingHttpHeaders }): Promise<boolean> {
    const secret = extractAdminSecret(request.headers);
    if (!secret) {
      throw new UnauthorizedException("не авторизован");
    }
    const hashes = await this.getHashes();
    for (const hash of hashes) {
      if (await this.verifyKeyWithHash(secret, hash)) return true;
    }
    return false;
  }

  public async verifyKeyWithHash(password: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  public async generateApiKey(password: string): Promise<string> {
    return argon2.hash(password, this.hashingConfig);
  }

  public async generateNewPassword(): Promise<string> {
    const randomValue = randomBytes(16).toString("hex");
    return `live_${randomValue}`;
  }

  private async getHashes(): Promise<string[]> {
    if (this.cache && Date.now() - this.cache.loadedAt < this.cacheTtlMs) {
      return this.cache.hashes;
    }
    const docs = await this.authModel.find().exec();
    const hashes = docs.map((doc) => doc.apiKey);
    this.cache = { hashes, loadedAt: Date.now() };
    return hashes;
  }
}
