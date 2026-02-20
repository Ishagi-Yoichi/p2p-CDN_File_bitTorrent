import { P2PCDNClient } from "../../packages/p2p-sdk/src/client/P2PCDNClient";

const manifest = {
  fileId: "video-abc",
  totalChunks: 100,
  chunkSize: 256 * 1024,
  trackerUrl: "ws://localhost:8080",
};

const client = new P2PCDNClient(manifest);

client.start();

console.log("Client started");
