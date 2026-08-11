import fs from "node:fs"
import { dirname } from "node:path"
import { Readable, Transform, Writable } from "node:stream"
import { finished } from "node:stream/promises"
import { xxh3 } from "@node-rs/xxhash"
import { Uint8ArrayReader, ZipReader, ZipWriter } from "@zip.js/zip.js"
import type {
  FullXmlSyncExternalFile,
  FullXmlSyncGeneratedDocument,
} from "../fullSyncToXml/types"

export interface PartialXmlArchiveWriter {
  addGenerated(document: FullXmlSyncGeneratedDocument): Promise<void>
  addExternal(file: FullXmlSyncExternalFile): Promise<void>
  close(loadTargets: readonly string[]): Promise<{
    readonly archiveHash: bigint
    readonly entries: readonly string[]
  }>
  abort(): Promise<void>
}

interface ArchiveSink {
  add(name: string, content: Uint8Array | ReadableStream<Uint8Array>): Promise<void>
  close(): Promise<void>
}

export interface PartialXmlArchiveWriterDependencies {
  readonly closeArchive?: (sink: ArchiveSink) => Promise<void>
  readonly readArchiveEntries?: (archivePath: string) => Promise<readonly string[]>
  readonly hashArchive?: (archivePath: string) => Promise<bigint>
}

export function createPartialXmlArchiveWriter(params: {
  readonly archivePath: string
  readonly dependencies?: PartialXmlArchiveWriterDependencies
}): PartialXmlArchiveWriter {
  fs.mkdirSync(dirname(params.archivePath), { recursive: true })
  const descriptor = fs.openSync(params.archivePath, "wx")
  const output = fs.createWriteStream(params.archivePath, { fd: descriptor, autoClose: true })
  const zipWriter = new ZipWriter(
    Writable.toWeb(output) as WritableStream<Uint8Array>,
    { useWebWorkers: false },
  )
  const sink: ArchiveSink = {
    async add(name, content) {
      await zipWriter.add(
        name,
        content instanceof Uint8Array ? new Uint8ArrayReader(content) : content,
        { useWebWorkers: false },
      )
    },
    async close() { await zipWriter.close() },
  }
  const dependencies = params.dependencies ?? {}
  const entries = new Map<string, string>()
  let state: "active" | "closed" | "aborted" = "active"

  return {
    async addGenerated(document) {
      await protect(async () => {
        const name = claimEntry(document.targetXmlPath, `XML ${document.assignmentId}`)
        await sink.add(name, document.content)
      })
    },

    async addExternal(file) {
      await protect(async () => {
        const name = claimEntry(file.targetXmlPath, `файл ${file.sourceProjectPath}`)
        const hasher = xxh3.Xxh3.withSeed()
        const source = fs.createReadStream(file.sourcePath)
        const hashingStream = new Transform({
          transform(chunk: Buffer, _encoding, callback) {
            hasher.update(chunk)
            callback(null, chunk)
          },
        })
        source.pipe(hashingStream)
        try {
          await sink.add(name, Readable.toWeb(hashingStream) as ReadableStream<Uint8Array>)
        } finally {
          source.destroy()
          hashingStream.destroy()
        }
        const actualHash = hasher.digest()
        if (actualHash !== file.expectedContentHash) {
          throw new Error(`Внешний файл изменён после получения хэшей: ${file.sourceProjectPath}`)
        }
      })
    },

    async close(loadTargets) {
      return protect(async () => {
        const normalizedLoadTargets = sortUtf8(loadTargets.map(normalizeArchivePath))
        if (new Set(normalizedLoadTargets).size !== normalizedLoadTargets.length) {
          throw new Error("Повторный путь в load.lst")
        }
        const loadList = normalizedLoadTargets.length === 0 ? "" : `${normalizedLoadTargets.join("\n")}\n`
        const loadListName = claimEntry("load.lst", "служебный список загрузки")
        await sink.add(loadListName, new TextEncoder().encode(loadList))
        await (dependencies.closeArchive ?? defaultCloseArchive)(sink)

        const expectedEntries = sortUtf8([...entries.keys()])
        const actualEntries = sortUtf8([
          ...(await (dependencies.readArchiveEntries ?? readArchiveEntries)(params.archivePath)),
        ].map(normalizeArchivePath))
        if (!equalStrings(actualEntries, expectedEntries)) {
          throw new Error(
            `Состав закрытого ZIP не совпадает с планом: ожидалось ${expectedEntries.join(", ")}; `
            + `получено ${actualEntries.join(", ")}`
          )
        }
        const archiveHash = await (dependencies.hashArchive ?? hashArchive)(params.archivePath)
        state = "closed"
        return { archiveHash, entries: expectedEntries }
      })
    },

    async abort() {
      if (state !== "active") return
      await cleanup()
    },
  }

  async function protect<T>(operation: () => Promise<T>): Promise<T> {
    if (state !== "active") throw new Error("Запись ZIP уже завершена")
    try {
      return await operation()
    } catch (caught) {
      try {
        await cleanup()
      } catch (cleanupFailure) {
        throw new AggregateError([caught, cleanupFailure], errorMessage(caught))
      }
      throw caught
    }
  }

  function claimEntry(rawName: string, source: string): string {
    const name = normalizeArchivePath(rawName)
    const previous = entries.get(name)
    if (previous !== undefined) throw new Error(`Повторный путь ZIP ${name}: ${previous} и ${source}`)
    entries.set(name, source)
    return name
  }

  async function cleanup(): Promise<void> {
    if (state !== "active") return
    state = "aborted"
    output.destroy()
    await finished(output).catch(() => undefined)
    await fs.promises.rm(params.archivePath, { force: true })
  }
}

async function defaultCloseArchive(sink: ArchiveSink): Promise<void> {
  await sink.close()
}

async function readArchiveEntries(archivePath: string): Promise<readonly string[]> {
  const source = fs.createReadStream(archivePath)
  const reader = new ZipReader(
    Readable.toWeb(source) as ReadableStream<Uint8Array>,
    { useWebWorkers: false },
  )
  try {
    return (await reader.getEntries()).map(({ filename }) => filename)
  } finally {
    await reader.close().catch(() => undefined)
    source.destroy()
  }
}

async function hashArchive(archivePath: string): Promise<bigint> {
  const hasher = xxh3.Xxh3.withSeed()
  for await (const chunk of fs.createReadStream(archivePath)) hasher.update(chunk as Buffer)
  return hasher.digest()
}

function normalizeArchivePath(value: string): string {
  if (value.length === 0
    || value.startsWith("/")
    || value.includes("\\")
    || value.includes("\0")
    || value.split("/").some((segment) => segment.length === 0 || segment === "." || segment === "..")) {
    throw new Error(`Некорректный путь ZIP: ${value}`)
  }
  return value
}

function sortUtf8(values: readonly string[]): string[] {
  return [...values].sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)))
}

function equalStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught)
}
