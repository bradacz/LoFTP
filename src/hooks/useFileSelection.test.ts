import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFileSelection } from "./useFileSelection";
import type { FileItem } from "@/types/ftp";

const files: FileItem[] = [
  { name: "..", size: 0, modified: "", isDirectory: true },
  { name: "alpha.txt", size: 1, modified: "", isDirectory: false },
  { name: "bravo.txt", size: 1, modified: "", isDirectory: false },
  { name: "charlie.txt", size: 1, modified: "", isDirectory: false },
  { name: "delta.txt", size: 1, modified: "", isDirectory: false },
];

describe("useFileSelection", () => {
  it("supports single and additive selection without selecting the parent row", () => {
    const { result } = renderHook(() => useFileSelection());

    act(() => result.current.toggle("alpha.txt", false));
    expect(Array.from(result.current.selected)).toEqual(["alpha.txt"]);

    act(() => result.current.toggle("alpha.txt", false));
    expect(Array.from(result.current.selected)).toEqual(["alpha.txt"]);

    act(() => result.current.toggle("bravo.txt", true));
    expect(Array.from(result.current.selected)).toEqual(["alpha.txt", "bravo.txt"]);

    act(() => result.current.toggle("..", false));
    expect(Array.from(result.current.selected)).toEqual(["alpha.txt", "bravo.txt"]);
  });

  it("keeps the range anchor while extending a Shift selection", () => {
    const { result } = renderHook(() => useFileSelection());

    act(() => {
      result.current.toggle("bravo.txt", false);
      result.current.updateLastClicked(2);
      result.current.rangeSelect("delta.txt", files);
    });
    expect(Array.from(result.current.selected)).toEqual(["bravo.txt", "charlie.txt", "delta.txt"]);

    act(() => result.current.rangeSelect("alpha.txt", files));
    expect(Array.from(result.current.selected)).toEqual(["alpha.txt", "bravo.txt"]);
  });
});
