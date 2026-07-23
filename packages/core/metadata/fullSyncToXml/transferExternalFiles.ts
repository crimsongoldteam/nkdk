import fs from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { pipeline } from "node:stream/promises"
import { Transform } from "node:stream"
import { xxh3 } from "@node-rs/xxhash"
import pLimit from "p-limit"
import { hashFileBytes } from "../configurationIndex/hash"
import type { ConfigurationProjectFile } from "../configurationIndex/types"
import type { FullXmlSyncExternalFile } from "./types"

const DEFAULT_TRANSFER_CONCURRENCY = 16

export interface TransferFullXmlSyncExternalFilesOptions {
  readonly outputDir: string
  readonly files: readonly FullXmlSyncExternalFile[]
  readonly concurrency?: number
  readonly readFile?: (path: string) => Promise<Buffer>
  readonly writeFile?: (path: string, bytes: Buffer) => Promise<void>
}

export interface TransferFullXmlSyncExternalFilesResult {
  readonly projectFiles: readonly ConfigurationProjectFile[]
  readonly copiedFiles: readonly { sourceProjectPath: string; targetXmlPath: string }[]
}

export async function transferFullXmlSyncExternalFiles(
  options: TransferFullXmlSyncExternalFilesOptions
): Promise<TransferFullXmlSyncExternalFilesResult> {
  const outputRoot = resolve(options.outputDir)
  const concurrency = normalizeTransferConcurrency(options.concurrency ?? DEFAULT_TRANSFER_CONCURRENCY)
  const usesInjectedBufferIo = options.readFile !== undefined || options.writeFile !== undefined
  const targetPaths = validateTransferPlan({ outputRoot, files: options.files })
  const limit = pLimit(concurrency)
  const results = await Promise.all(
    options.files.map((file, index) =>
      limit(async () => {
        const targetPath = targetPaths[index]
        if (targetPath === undefined) throw new Error(`Не найден target path для ${file.sourceProjectPath}`)
        await fs.promises.mkdir(dirname(targetPath), { recursive: true })
        const contentHash = usesInjectedBufferIo
          ? await transferBufferedForInjectedIo({
              sourcePath: file.sourcePath,
              targetPath,
              readFile: options.readFile ?? fs.promises.readFile,
              writeFile: options.writeFile ?? fs.promises.writeFile,
            })
          : await transferStreamedFile({ sourcePath: file.sourcePath, targetPath })
        return {
          projectFile: { projectPath: file.sourceProjectPath, contentHash },
          copiedFile: { sourceProjectPath: file.sourceProjectPath, targetXmlPath: file.targetXmlPath },
        }
      })
    )
  )

  return {
    projectFiles: results
      .map((result) => result.projectFile)
      .sort((left, right) => Buffer.compare(Buffer.from(left.projectPath), Buffer.from(right.projectPath))),
    copiedFiles: results
      .map((result) => result.copiedFile)
      .sort((left, right) => Buffer.compare(Buffer.from(left.sourceProjectPath), Buffer.from(right.sourceProjectPath))),
  }
}

async function transferBufferedForInjectedIo(params: {
  sourcePath: string
  targetPath: string
  readFile: (path: string) => Promise<Buffer>
  writeFile: (path: string, bytes: Buffer) => Promise<void>
}): Promise<bigint> {
  const bytes = await params.readFile(params.sourcePath)
  await params.writeFile(params.targetPath, bytes)
  return hashFileBytes(bytes)
}

async function transferStreamedFile(params: { sourcePath: string; targetPath: string }): Promise<bigint> {
  const hasher = xxh3.Xxh3.withSeed()
  const hashingTransform = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      hasher.update(chunk)
      callback(null, chunk)
    },
  })
  try {
    await pipeline(
      fs.createReadStream(params.sourcePath),
      hashingTransform,
      fs.createWriteStream(params.targetPath)
    )
  } catch (caught) {
    await fs.promises.rm(params.targetPath, { force: true })
    throw caught
  }
  return hasher.digest()
}

function validateTransferPlan(params: { outputRoot: string; files: readonly FullXmlSyncExternalFile[] }): string[] {
  const seenTargets = new Map<string, string>()
  return params.files.map((file) => {
    if (file.targetXmlPath.length === 0 || file.targetXmlPath.startsWith("/") || file.targetXmlPath.includes("\0")) {
      throw new Error(`Некорректный XML-путь внешнего файла: ${file.targetXmlPath}`)
    }
    const targetPath = resolve(join(params.outputRoot, ...file.targetXmlPath.split("/")))
    const relativePath = relative(params.outputRoot, targetPath)
    if (relativePath.startsWith("..") || relativePath === "" || relativePath.includes("\0")) {
      throw new Error(`XML-путь внешнего файла выходит за целевой каталог: ${file.targetXmlPath}`)
    }

    const previous = seenTargets.get(targetPath)
    if (previous !== undefined) {
      throw new Error(`Повторный XML-путь внешнего файла ${file.targetXmlPath}: ${previous} и ${file.sourceProjectPath}`)
    }
    seenTargets.set(targetPath, file.sourceProjectPath)
    return targetPath
  })
}

function normalizeTransferConcurrency(value: number): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error("Степень параллелизма переноса внешних файлов должна быть положительным целым числом")
  }
  return value
}
