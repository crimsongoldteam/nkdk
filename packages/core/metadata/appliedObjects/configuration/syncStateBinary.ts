import fs from "fs"
import { join } from "path"
import type { XmlSyncState } from "./syncState"

export const BINARY_SYNC_STATE_FILE = ".nkdk-sync.bin"

const MAGIC = "NKDKSYNC"
const MAGIC_LENGTH = 8
const HEADER_LENGTH = MAGIC_LENGTH + 2 + 4
const VERSION = 1
const UINT32_BYTES = 4
const UINT64_BYTES = 8
const HASH_PREFIX = "xxh3-64:"
const HASH_HEX_LENGTH = 16

export function encodeBinaryXmlSyncState(state: XmlSyncState): Buffer {
  const entries = Object.entries(state.files).sort(([left], [right]) => left.localeCompare(right, "ru"))
  const encodedPaths = entries.map(([path]) => Buffer.from(path, "utf-8"))
  const totalLength =
    HEADER_LENGTH +
    entries.reduce((sum, [, hash], index) => {
      assertHash(hash)
      return sum + UINT32_BYTES + encodedPaths[index].length + UINT64_BYTES
    }, 0)

  const buffer = Buffer.allocUnsafe(totalLength)
  let offset = 0
  buffer.write(MAGIC, offset, MAGIC_LENGTH, "ascii")
  offset += MAGIC_LENGTH
  buffer.writeUInt16LE(VERSION, offset)
  offset += 2
  buffer.writeUInt32LE(entries.length, offset)
  offset += 4

  for (let index = 0; index < entries.length; index += 1) {
    const [, hash] = entries[index]
    const pathBuffer = encodedPaths[index]
    buffer.writeUInt32LE(pathBuffer.length, offset)
    offset += UINT32_BYTES
    pathBuffer.copy(buffer, offset)
    offset += pathBuffer.length
    buffer.writeBigUInt64LE(hashToBigInt(hash), offset)
    offset += UINT64_BYTES
  }

  return buffer
}

export function decodeBinaryXmlSyncState(buffer: Buffer): XmlSyncState {
  try {
    if (buffer.length < HEADER_LENGTH) throw new Error("header")
    if (buffer.subarray(0, MAGIC_LENGTH).toString("ascii") !== MAGIC) throw new Error("magic")

    let offset = MAGIC_LENGTH
    const version = buffer.readUInt16LE(offset)
    offset += 2
    if (version !== VERSION) throw new Error("version")

    const entryCount = buffer.readUInt32LE(offset)
    offset += 4
    const files: Record<string, string> = {}

    for (let index = 0; index < entryCount; index += 1) {
      ensureAvailable(buffer, offset, UINT32_BYTES)
      const pathLength = buffer.readUInt32LE(offset)
      offset += UINT32_BYTES
      ensureAvailable(buffer, offset, pathLength + UINT64_BYTES)
      const path = buffer.subarray(offset, offset + pathLength).toString("utf-8")
      offset += pathLength
      const hash = buffer.readBigUInt64LE(offset)
      offset += UINT64_BYTES
      files[path] = `${HASH_PREFIX}${hash.toString(16).padStart(HASH_HEX_LENGTH, "0")}`
    }

    if (offset !== buffer.length) throw new Error("trailing")

    return { version: 1, files }
  } catch {
    throw new Error(`Некорректный ${BINARY_SYNC_STATE_FILE}`)
  }
}

export async function readBinaryXmlSyncState(xmlDir: string): Promise<XmlSyncState> {
  const buffer = await fs.promises.readFile(join(xmlDir, BINARY_SYNC_STATE_FILE))
  return decodeBinaryXmlSyncState(buffer)
}

export async function writeBinaryXmlSyncState(xmlDir: string, state: XmlSyncState): Promise<void> {
  await fs.promises.mkdir(xmlDir, { recursive: true })
  await fs.promises.writeFile(join(xmlDir, BINARY_SYNC_STATE_FILE), encodeBinaryXmlSyncState(state))
}

function ensureAvailable(buffer: Buffer, offset: number, length: number): void {
  if (length < 0 || offset + length > buffer.length) throw new Error("truncated")
}

function assertHash(hash: string): void {
  if (!new RegExp(`^${HASH_PREFIX}[0-9a-f]{${HASH_HEX_LENGTH}}$`).test(hash)) {
    throw new Error(`Некорректный hash sync state: ${hash}`)
  }
}

function hashToBigInt(hash: string): bigint {
  assertHash(hash)
  return BigInt(`0x${hash.slice(HASH_PREFIX.length)}`)
}
