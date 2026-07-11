import { Test, TestingModule } from "@nestjs/testing";
import { AuthGuard } from "./auth.guard";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Auth } from "./schema/auth";

describe("AuthGuard", () => {
  let guard: AuthGuard;
  let authModel: Model<Auth>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: getModelToken(Auth.name),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    authModel = module.get<Model<Auth>>(getModelToken(Auth.name));
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  it("should return true if matching apiKey found", async () => {
    const password = "live_1a6e367438327f2cf9c0d30b2f4aeac7";
    const apiKey =
      "$argon2id$v=19$m=64000,t=3,p=1$2IbVQxRSJOHC5ogg70uqsQ$4oOHqflmaKDMsjP1TYgTjtHs0/PUl1c63a5YK/fLsvM";
    const request = {
      headers: {
        authorization: password,
      },
    };
    const mockAuth = {
      apiKey: apiKey,
    };
    authModel.find = jest.fn().mockReturnValue([mockAuth]);
    const result = await guard.checkApiKey(request);
    expect(result).toBe(true);
  });

  it.skip("should generate a valid apiKey", async () => {
    const password = "live_1a6e367438327f2cf9c0d30b2f4aeac7";
    const hashedPassword = await guard.generateApiKey(password);
    console.log(hashedPassword);
    expect(await guard.verifyKeyWithHash(password, hashedPassword)).toBe(true);
  });

  it.skip("should generate new password", async () => {
    const newPassword = await guard.generateNewPassword();
    console.log(newPassword);
    expect(newPassword.startsWith("live_")).toBeTruthy();
  });
});
