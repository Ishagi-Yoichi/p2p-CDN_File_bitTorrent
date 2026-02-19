import { Bitfield } from "./BitField";
import { PiecePicker } from "./PiecePicker";

export class PieceManager {
  private localBitfield: Bitfield;
  private remoteBitfields = new Map<string, Bitfield>();
  private picker = new PiecePicker();

  constructor(
    totalChunks: number,
    private peerManager: any,
    private storage: any
  ) {
    this.localBitfield = new Bitfield(totalChunks);
  }

  //bitfield exchange

  handleBitfield(peerId: string, bitfieldString: string) {
    const bf = new Bitfield(bitfieldString.length);
    bf.fromString(bitfieldString);

    this.remoteBitfields.set(peerId, bf);

    this.scheduleDownloads(peerId);
  }

  //download logic

  private scheduleDownloads(peerId: string) {
    const remoteBF = this.remoteBitfields.get(peerId);
    if (!remoteBF) return;

    const missing = this.localBitfield.missingPieces();

    const piece = this.picker.pick(missing, remoteBF);

    if (piece === null) return;

    this.peerManager.requestPiece(peerId, piece);
  }

  //piece received

  async handlePiece(peerId: string, chunkIndex: number, data: ArrayBuffer) {
    const verified = true; // ✅ hashing later Phase 3.5

    if (!verified) return;

    await this.storage.saveChunk(chunkIndex, data);

    this.localBitfield.set(chunkIndex);

    this.peerManager.broadcastHave(chunkIndex);
  }

  //have received

  handleHave(peerId: string, chunkIndex: number) {
    const bf = this.remoteBitfields.get(peerId);
    if (!bf) return;

    bf.set(chunkIndex);
  }

  getLocalBitfield() {
    return this.localBitfield.toString();
  }
}
