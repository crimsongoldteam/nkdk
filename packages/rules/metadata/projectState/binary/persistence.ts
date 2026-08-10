import fs from "node:fs"
import { dirname, resolve } from "node:path"
import { xxh3 } from "@node-rs/xxhash"
import { decodeProjectStateHeader, encodeProjectStateHeader } from "./format"
import { ProjectStateHeaderRecordView, ProjectStateSectionRecordView } from "./layouts"
import { ProjectStateSnapshotView, type ProjectStateSharedBuffers } from "./snapshot"

const SECTION_NAMES = ["strings", "files", "facts", "lookups", "diagnostics"] as const
const HEADER_BYTE_LENGTH =
  ProjectStateHeaderRecordView.viewLength + SECTION_NAMES.length * ProjectStateSectionRecordView.viewLength

export function projectStateBinaryPath(projectDir: string): string {
  return resolve(projectDir, ".nkdk", "cache", "project-state.bin")
}

export async function saveBinaryProjectState(
  projectDir: string,
  buffers: ProjectStateSharedBuffers,
): Promise<void> {
  new ProjectStateSnapshotView(buffers)
  const previousHeader = decodeProjectStateHeader(new Uint8Array(buffers.header))
  const payloadHash = hashPayload(buffers)
  const header = encodeProjectStateHeader({ sections: previousHeader.sections, payloadHash })
  const target = projectStateBinaryPath(projectDir)

  await fs.promises.mkdir(dirname(target), { recursive: true })
  const handle = await fs.promises.open(target, "w")
  try {
    const chunks = [
      Buffer.from(header.buffer, header.byteOffset, header.byteLength),
      ...SECTION_NAMES.map((name) => Buffer.from(buffers[name])),
    ]
    await writeVectorExactly(handle, chunks)
  } finally {
    await handle.close()
  }
}

export async function loadBinaryProjectState(
  projectDir: string,
): Promise<ProjectStateSharedBuffers | undefined> {
  const target = projectStateBinaryPath(projectDir)
  try {
    return await readBinaryProjectStateFile(target)
  } catch (caught) {
    if (hasErrorCode(caught, "ENOENT")) return undefined
    await fs.promises.unlink(target).catch(() => undefined)
    return undefined
  }
}

async function readBinaryProjectStateFile(path: string): Promise<ProjectStateSharedBuffers> {
  const handle = await fs.promises.open(path, "r")
  try {
    const { decoded, headerBytes } = await readValidatedHeader(handle)

    const sections = await Promise.all(decoded.sections.map(async (section) => {
      const buffer = new SharedArrayBuffer(section.byteLength)
      await readExactly(handle, new Uint8Array(buffer), section.offset)
      return buffer
    }))
    const header = new SharedArrayBuffer(headerBytes.byteLength)
    new Uint8Array(header).set(headerBytes)
    const buffers: ProjectStateSharedBuffers = {
      header,
      strings: sections[0]!,
      files: sections[1]!,
      facts: sections[2]!,
      lookups: sections[3]!,
      diagnostics: sections[4]!,
    }
    if (hashPayload(buffers) !== decoded.payloadHash) {
      throw new Error("Контрольная сумма двоичного состояния проекта не совпадает")
    }
    new ProjectStateSnapshotView(buffers)
    return buffers
  } finally {
    await handle.close()
  }
}

async function readValidatedHeader(handle: fs.promises.FileHandle) {
  const fileSize = (await handle.stat()).size
  if (fileSize < HEADER_BYTE_LENGTH) throw new Error("Двоичный файл состояния проекта оборван")
  const headerBytes = new Uint8Array(HEADER_BYTE_LENGTH)
  await readExactly(handle, headerBytes, 0)
  const decoded = decodeProjectStateHeader(headerBytes)
  if (decoded.sections.length !== SECTION_NAMES.length) {
    throw new Error("Двоичный файл состояния проекта содержит неверное число разделов")
  }
  let expectedOffset = HEADER_BYTE_LENGTH
  for (let index = 0; index < decoded.sections.length; index += 1) {
    const section = decoded.sections[index]!
    if (
      section.kind !== SECTION_NAMES[index]
      || section.offset !== expectedOffset
      || section.offset + section.byteLength > fileSize
    ) {
      throw new Error("Границы разделов двоичного состояния проекта повреждены")
    }
    expectedOffset += section.byteLength
  }
  if (expectedOffset !== fileSize) throw new Error("Размер двоичного состояния проекта не совпадает с каталогом")
  return { decoded, headerBytes }
}

function hashPayload(buffers: ProjectStateSharedBuffers): bigint {
  const hasher = xxh3.Xxh3.withSeed()
  for (const name of SECTION_NAMES) hasher.update(new Uint8Array(buffers[name]))
  return hasher.digest()
}

async function readExactly(
  handle: fs.promises.FileHandle,
  target: Uint8Array,
  position: number,
): Promise<void> {
  let offset = 0
  while (offset < target.byteLength) {
    const { bytesRead } = await handle.read(target, offset, target.byteLength - offset, position + offset)
    if (bytesRead === 0) throw new Error("Двоичный файл состояния проекта оборван")
    offset += bytesRead
  }
}

async function writeVectorExactly(
  handle: fs.promises.FileHandle,
  chunks: readonly Buffer[],
): Promise<void> {
  let remaining = [...chunks]
  let position = 0
  while (remaining.length > 0) {
    const { bytesWritten } = await handle.writev(remaining, position)
    if (bytesWritten === 0) throw new Error("Не удалось записать двоичное состояние проекта")
    position += bytesWritten
    let consumed = bytesWritten
    while (remaining.length > 0 && consumed >= remaining[0]!.byteLength) {
      consumed -= remaining[0]!.byteLength
      remaining.shift()
    }
    if (consumed > 0) remaining[0] = remaining[0]!.subarray(consumed)
  }
}

function hasErrorCode(caught: unknown, code: string): boolean {
  return typeof caught === "object" && caught !== null && "code" in caught && caught.code === code
}
