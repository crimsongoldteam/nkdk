import { xxh3 } from "@node-rs/xxhash"

const U64_MASK = (1n << 64n) - 1n

export interface Hash128 {
  low: bigint
  high: bigint
}

export function hashFileBytes(bytes: Uint8Array): bigint {
  return xxh3.xxh64(bytes)
}

export function hashSection(bytes: Uint8Array): Hash128 {
  const value = xxh3.xxh128(bytes)
  return { low: value & U64_MASK, high: value >> 64n }
}

export function writeHash128(buffer: Buffer, offset: number, hash: Hash128): void {
  buffer.writeBigUInt64LE(hash.low, offset)
  buffer.writeBigUInt64LE(hash.high, offset + 8)
}
