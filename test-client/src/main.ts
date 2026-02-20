import { P2PCDNClient } from "../../packages/p2p-sdk/src/client/P2PCDNClient";

const manifest = {
  fileId: "video-abc",
  totalChunks: 100,
  chunkSize: 256 * 1024,
  trackerUrl: "ws://localhost:8080",

  chunkHashes: new Array(100).fill(
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4..." // dummy
  ),
};

const client = new P2PCDNClient(manifest);

client.start();

console.log("Client started");
