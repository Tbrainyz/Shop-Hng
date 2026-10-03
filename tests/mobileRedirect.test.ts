import { afterEach, describe, expect, it } from "vitest";
import { appendToken, isAllowedMobileRedirect } from "@/lib/mobileRedirect";

afterEach(() => { delete process.env.ALLOW_EXPO_GO_REDIRECT; });

describe("isAllowedMobileRedirect", () => {
  it("allows the app's own deep-link schemes", () => {
    expect(isAllowedMobileRedirect("shopmobile://auth")).toBe(true);
    expect(isAllowedMobileRedirect("exp+shopmobile://expo-development-client/auth")).toBe(true);
  });

  it("allows Expo Go only for localhost / private-network hosts", () => {
    expect(isAllowedMobileRedirect("exp://192.168.1.20:8081/--/auth")).toBe(true);
    expect(isAllowedMobileRedirect("exp://10.0.0.5:8081/--/auth")).toBe(true);
    expect(isAllowedMobileRedirect("exp://172.20.1.1:8081/--/auth")).toBe(true);
    expect(isAllowedMobileRedirect("exp://localhost:8081/--/auth")).toBe(true);
  });

  it("rejects Expo Go on public hosts (token-theft risk) unless explicitly enabled", () => {
    expect(isAllowedMobileRedirect("exp://evil.example.com/--/auth")).toBe(false);
    expect(isAllowedMobileRedirect("exp://8.8.8.8:8081/--/auth")).toBe(false);
    expect(isAllowedMobileRedirect("exp://172.32.0.1/--/auth")).toBe(false);
    process.env.ALLOW_EXPO_GO_REDIRECT = "true";
    expect(isAllowedMobileRedirect("exp://abc-123.exp.direct/--/auth")).toBe(true);
  });

  it("rejects web URLs, other schemes, junk, and empty values", () => {
    for (const bad of ["https://evil.com", "http://localhost:3000", "javascript:alert(1)", "shopmobile", "not a url", "", null, undefined]) {
      expect(isAllowedMobileRedirect(bad as any)).toBe(false);
    }
  });
});

describe("appendToken", () => {
  it("adds the token as a query param, keeping existing params", () => {
    expect(appendToken("shopmobile://auth", "abc")).toBe("shopmobile://auth?token=abc");
    expect(appendToken("exp://192.168.1.20:8081/--/auth?x=1", "abc")).toContain("x=1");
    expect(appendToken("exp://192.168.1.20:8081/--/auth?x=1", "abc")).toContain("token=abc");
  });
});
