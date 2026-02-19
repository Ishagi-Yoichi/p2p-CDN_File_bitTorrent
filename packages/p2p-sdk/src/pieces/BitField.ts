export class Bitfield {
  private bits: boolean[];

  constructor(size: number) {
    this.bits = new Array(size).fill(false);
  }

  has(index: number): boolean | undefined {
    return this.bits[index];
  }

  set(index: number) {
    this.bits[index] = true;
  }

  toString(): string {
    return this.bits.map((b) => (b ? "1" : "0")).join("");
  }

  fromString(bitfield: string) {
    this.bits = bitfield.split("").map((b) => b === "1");
  }

  missingPieces(): number[] {
    return this.bits.map((has, i) => (!has ? i : -1)).filter((i) => i !== -1);
  }
}
