export class PiecePicker {
  pickRarest(
    missingPieces: number[],
    availabilityMap: Map<number, number>,
    remoteBitfield: any
  ): number | null {
    const candidates = missingPieces.filter((index) =>
      remoteBitfield.has(index)
    );

    if (!candidates.length) return null;

    // Explicit safe initialization
    let rarestPiece: number = candidates[0]!;
    let rarestCount = availabilityMap.get(rarestPiece) ?? Infinity;

    for (const piece of candidates) {
      const count = availabilityMap.get(piece) ?? 0;

      if (count < rarestCount) {
        rarestPiece = piece;
        rarestCount = count;
      }
    }

    return rarestPiece;
  }
}
