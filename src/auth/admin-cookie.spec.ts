import {
  ADMIN_COOKIE_NAME,
  extractAdminSecret,
  isSecureRequest,
  readCookieValue,
} from "./admin-cookie";

describe("admin-cookie", () => {
  it("prefers Authorization header over cookie", () => {
    const secret = extractAdminSecret({
      authorization: "header-key",
      cookie: `${ADMIN_COOKIE_NAME}=cookie-key`,
    });
    expect(secret).toBe("header-key");
  });

  it("reads admin secret from cookie when header is missing", () => {
    const secret = extractAdminSecret({
      cookie: `theme=dark; ${ADMIN_COOKIE_NAME}=live_abc; extra=1`,
    });
    expect(secret).toBe("live_abc");
  });

  it("returns null when credentials are missing", () => {
    expect(extractAdminSecret({})).toBeNull();
    expect(extractAdminSecret({ authorization: "  " })).toBeNull();
    expect(extractAdminSecret({ cookie: "theme=dark" })).toBeNull();
  });

  it("decodes percent-encoded cookie values", () => {
    expect(readCookieValue(`${ADMIN_COOKIE_NAME}=live%5Fabc`, ADMIN_COOKIE_NAME)).toBe("live_abc");
  });

  it("detects HTTPS from forwarded proto", () => {
    expect(isSecureRequest({ secure: false, headers: { "x-forwarded-proto": "https" } })).toBe(
      true,
    );
    expect(isSecureRequest({ secure: false, headers: { "x-forwarded-proto": "http" } })).toBe(
      false,
    );
    expect(isSecureRequest({ secure: true, headers: {} })).toBe(true);
  });
});
