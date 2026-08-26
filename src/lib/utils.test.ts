import { describe, expect, it } from "vitest";
import { validateEntryName } from "./utils";

describe("validateEntryName", () => {
  it("accepts a normal basename", () => {
    expect(validateEntryName(" report.pdf ")).toBe("report.pdf");
  });

  it("rejects traversal and path separators", () => {
    for (const value of ["", ".", "..", "folder/file", "folder\\file"]) {
      expect(() => validateEntryName(value)).toThrow();
    }
  });
});
