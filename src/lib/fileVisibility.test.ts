import { describe, expect, it } from "vitest";
import { filterVisibleFiles, isHiddenFileName } from "./fileVisibility";
import type { FileItem } from "@/types/ftp";

const files: FileItem[] = [
  { name: "..", size: 0, modified: "", isDirectory: true },
  { name: ".env", size: 1, modified: "", isDirectory: false },
  { name: ".config", size: 0, modified: "", isDirectory: true },
  { name: "visible.txt", size: 1, modified: "", isDirectory: false },
];

describe("file visibility", () => {
  it("recognizes dot-prefixed entries but keeps the parent entry visible", () => {
    expect(isHiddenFileName(".env")).toBe(true);
    expect(isHiddenFileName("..")).toBe(false);
    expect(isHiddenFileName("visible.txt")).toBe(false);
  });

  it("filters hidden files without changing the original list", () => {
    expect(filterVisibleFiles(files, false).map((file) => file.name)).toEqual(["..", "visible.txt"]);
    expect(filterVisibleFiles(files, true)).toBe(files);
  });
});
