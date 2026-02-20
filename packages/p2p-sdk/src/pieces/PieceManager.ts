import { Manifest } from "../client/P2PCDNClient";
import { Bitfield } from "./Bitfield";
import { PiecePicker } from "./PiecePicker";
import { sha256 } from "../utils/crypto";

export class PieceManager {
  private availabilityMap = new Map<number, number>();

  private localBitfield: Bitfield;
  private remoteBitfields = new Map<string, Bitfield>();
  private picker = new PiecePicker();

  constructor(
    private manifest: Manifest,
    private peerManager: any,
    private storage: any
  ) {
    this.localBitfield = new Bitfield(manifest.totalChunks);
  }

  private incrementAvailability(bitfield: any) {
    for (let i = 0; i < this.manifest.totalChunks; i++) {
      if (bitfield.has(i)) {
        const count = this.availabilityMap.get(i) ?? 0;
        this.availabilityMap.set(i, count + 1);
      }
    }
  }

  private decrementAvailability(bitfield: any) {
    for (let i = 0; i < this.manifest.totalChunks; i++) {
      if (bitfield.has(i)) {
        const count = this.availabilityMap.get(i) ?? 1;
        this.availabilityMap.set(i, Math.max(0, count - 1));
      }
    }
  }

  //bitfield exchange

  handleBitfield(peerId: string, bitfieldString: string) {
    const bf = new Bitfield(this.manifest.totalChunks);
    bf.fromString(bitfieldString);

    this.remoteBitfields.set(peerId, bf);

    this.incrementAvailability(bf);

    this.scheduleDownloads(peerId);
  }

  //download logic

  private scheduleDownloads(peerId: string) {
    const remoteBF = this.remoteBitfields.get(peerId);
    if (!remoteBF) return;

    const missing = this.localBitfield.missingPieces();

    const piece = this.picker.pickRarest(
      missing,
      this.availabilityMap,
      remoteBF
    );

    if (piece === null) return;

    this.peerManager.requestPiece(peerId, piece);
  }

  //piece received

  async handlePiece(peerId: string, chunkIndex: number, data: ArrayBuffer) {
    const expectedHash = this.manifest.chunkHashes[chunkIndex];

    if (!expectedHash) {
      console.warn("Missing hash for chunk:", chunkIndex);
      return;
    }

    const actualHash = await sha256(data);

    if (actualHash !== expectedHash) {
      console.warn("Hash mismatch:", chunkIndex);

      // Future extension point:
      // this.peerManager.penalizePeer(peerId);

      return;
    }

    await this.storage.saveChunk(chunkIndex, data);

    this.localBitfield.set(chunkIndex);

    this.peerManager.broadcastHave(chunkIndex);
  }

  //have received

  handleHave(peerId: string, chunkIndex: number) {
    const bf = this.remoteBitfields.get(peerId);
    if (!bf) return;

    if (!bf.has(chunkIndex)) {
      bf.set(chunkIndex);

      const count = this.availabilityMap.get(chunkIndex) ?? 0;
      this.availabilityMap.set(chunkIndex, count + 1);
    }
  }

  handlePeerLeft(peerId: string) {
    const bf = this.remoteBitfields.get(peerId);

    if (!bf) return;

    this.decrementAvailability(bf);

    this.remoteBitfields.delete(peerId);
  }

  getLocalBitfield() {
    return this.localBitfield.toString();
  }
}
