import init, { compress, decompress } from "@dweb-browser/zstd-wasm";
// 等待 deno 支持 import bytes
// import zstd_wasm_binary from "@dweb-browser/zstd-wasm/zstd_wasm_bg.wasm" with {
//   type: "bytes",
// };
const zstd_wasm_binary = Deno.readFileSync("./zstd_wasm_bg.wasm");
await init(zstd_wasm_binary);

export { compress, decompress };
