export class PiecePicker {
  pick(missing: number[], remoteBitfield: any): number | null {
    const available = missing.filter((i) => remoteBitfield.has(i));

    if (!available.length) return null;

    return available[Math.floor(Math.random() * available.length)];
  }
}
