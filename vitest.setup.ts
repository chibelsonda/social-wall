import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

let objectUrlSequence = 0;

Object.defineProperty(URL, "createObjectURL", {
  configurable: true,
  value: vi.fn(() => `blob:test-photo-${objectUrlSequence++}`),
});

Object.defineProperty(URL, "revokeObjectURL", {
  configurable: true,
  value: vi.fn(),
});

vi.stubGlobal(
  "fetch",
  vi.fn(async () =>
    Response.json({
      location: "Quezon City, Philippines",
      timezone: "Asia/Manila",
    }),
  ),
);

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  vi.clearAllMocks();
});
