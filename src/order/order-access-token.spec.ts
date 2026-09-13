import { generateOrderAccessToken, accessTokensMatch } from "./order-access-token";

describe("order-access-token", () => {
  it("generates an unguessable hex token", () => {
    const token = generateOrderAccessToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(generateOrderAccessToken()).not.toBe(token);
  });

  it("accepts the matching token and rejects another", () => {
    const token = generateOrderAccessToken();
    expect(accessTokensMatch(token, token)).toBe(true);
    expect(accessTokensMatch(generateOrderAccessToken(), token)).toBe(false);
    expect(accessTokensMatch("", token)).toBe(false);
  });
});
