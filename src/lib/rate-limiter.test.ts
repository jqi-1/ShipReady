import { describe, expect, it } from "vitest";
import { checkRateLimit } from "./rate-limiter";

describe("checkRateLimit", () => {
  it("allows first request", () => {
    const result = checkRateLimit("127.0.0.1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(19);
  });

  it("tracks remaining requests", () => {
    const ip = "10.0.0.1";
    for (let i = 0; i < 10; i++) {
      checkRateLimit(ip);
    }
    const result = checkRateLimit(ip);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("blocks after 20 requests", () => {
    const ip = "10.0.0.2";
    for (let i = 0; i < 20; i++) {
      checkRateLimit(ip);
    }
    const result = checkRateLimit(ip);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("treats different IPs independently", () => {
    const ip1 = "10.0.0.3";
    const ip2 = "10.0.0.4";
    for (let i = 0; i < 20; i++) {
      checkRateLimit(ip1);
    }
    const result1 = checkRateLimit(ip1);
    const result2 = checkRateLimit(ip2);
    expect(result1.allowed).toBe(false);
    expect(result2.allowed).toBe(true);
  });
});
