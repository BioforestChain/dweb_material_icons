// import { assertEquals } from "@std/assert";
import { decompress } from "./zstd.ts";
import { buildIcons } from "./build.ts";

Deno.test(function buildTest() {
    const { bundle, binary } = buildIcons();
    const textDecoder = new TextDecoder();
    const bundleJson = textDecoder.decode(decompress(binary));
    const result = JSON.parse(bundleJson);

    console.log(JSON.stringify(result) ===JSON.stringify(bundle))
    // assertEquals(result, bundle);
});
