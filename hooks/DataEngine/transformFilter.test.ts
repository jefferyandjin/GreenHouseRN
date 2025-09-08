import { transformFilter } from "./transformFilter";

describe("transformFilter", () => {
  const Tolerance = 1e-6;

  it("computes 5 samples", () => {
    const input = [18, 16, 14, 12, 10];
    const result = transformFilter(input);
    expect(Math.abs(result - 16.375)).toBeLessThan(Tolerance);
  });

  //should be same as 5 samples
  it("computes 6 samples", () => {
    const input = [18, 16, 14, 12, 10, 8];
    const result = transformFilter(input);
    expect(Math.abs(result - 16.375)).toBeLessThan(Tolerance);
  });

  it("compute 3 samples, renormalize needed", () => {
    const input = [14, 12, 10];
    const result = transformFilter(input);
    expect(Math.abs(result - 12.8965517)).toBeLessThan(Tolerance);
  });

  it("throws on empty input", () => {
    expect(() => transformFilter([])).toThrow();
  });
});
