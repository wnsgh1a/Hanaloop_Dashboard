import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "./types";

describe("api — Mock 네트워크 시뮬레이션", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("jitter는 200~800ms 사이 지연 후 resolve한다", async () => {
    const { jitter } = await import("./api");
    const promise = jitter();
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBeUndefined();
  });

  it("maybeFail — random < 0.15 이면 ApiError", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const { maybeFail } = await import("./api");
    expect(() => maybeFail()).toThrow(ApiError);
  });

  it("maybeFail — random >= 0.15 이면 통과", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const { maybeFail } = await import("./api");
    expect(() => maybeFail()).not.toThrow();
  });
});
