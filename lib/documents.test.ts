import { describe, expect, it } from "vitest";
import {
  ACCEPTED_TYPES,
  MAX_FILE_SIZE_BYTES,
  acceptedExtensions,
  validationError,
} from "./documents";

function file(name: string, size: number): Pick<File, "name" | "size"> {
  return { name, size };
}

describe("acceptedExtensions", () => {
  it("matches the 7 accepted material formats", () => {
    expect(acceptedExtensions()).toEqual(
      ACCEPTED_TYPES.map((t) => t.extension),
    );
    expect(acceptedExtensions()).toHaveLength(7);
  });
});

describe("validationError (AI-35)", () => {
  it("accepts a valid file", () => {
    expect(validationError(file("syllabus.pdf", 1024))).toBeNull();
  });

  it("is case-insensitive on extension", () => {
    expect(validationError(file("SLIDES.PPTX", 1024))).toBeNull();
  });

  it("rejects an invalid format", () => {
    expect(validationError(file("setup.exe", 1024))).toContain("invalid format");
  });

  it("rejects a file without extension", () => {
    expect(validationError(file("README", 1024))).toContain("invalid format");
  });

  it("rejects a file over 100MB", () => {
    expect(
      validationError(file("big.pdf", MAX_FILE_SIZE_BYTES + 1)),
    ).toContain("exceeds 100MB");
  });

  it("accepts a file of exactly 100MB", () => {
    expect(validationError(file("edge.pdf", MAX_FILE_SIZE_BYTES))).toBeNull();
  });
});
