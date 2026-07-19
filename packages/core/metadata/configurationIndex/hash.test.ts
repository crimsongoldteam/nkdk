import { xxh3 } from "@node-rs/xxhash"
import { describe, expect, it } from "vitest"
import { hashFileBytes, hashSection, writeHash128 } from "./hash"

describe("configuration index hashes", () => {
  it("uses XXH3-64 for project files", () => {
    const bytes = Buffer.from("Привет", "utf8")
    expect(hashFileBytes(bytes)).toBe(xxh3.xxh64(bytes))
  })

  it("writes XXH3-128 as low u64 followed by high u64", () => {
    const hash = hashSection(Buffer.from("section"))
    const buffer = Buffer.alloc(16)
    writeHash128(buffer, 0, hash)
    expect(buffer.readBigUInt64LE(0)).toBe(hash.low)
    expect(buffer.readBigUInt64LE(8)).toBe(hash.high)
  })
})
