import fs from "node:fs/promises"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import type { MetadataDiagnostic, MetadataDiagnosticCollection } from "@nkdk/core"
import type { DiagnosticReportReference, DiagnosticSummary } from "../contracts/diagnostics"

export const MAX_INLINE_DIAGNOSTICS = 100
export const MAX_INLINE_DIAGNOSTIC_BYTES = 512 * 1024

export interface DiagnosticReportFileSystem {
  mkdir(path: string): Promise<void>
  open(path: string): Promise<{ write(line: string): Promise<void>; close(): Promise<void> }>
  rename(from: string, to: string): Promise<void>
  readdir(path: string): Promise<readonly string[]>
  unlink(path: string): Promise<void>
}

export type DiagnosticReportOperation =
  | "validation"
  | "import"
  | "sync"
  | "rename"
  | "find-references"
  | "rebuild"

const defaultFileSystem: DiagnosticReportFileSystem = {
  async mkdir(path) { await fs.mkdir(path, { recursive: true }) },
  async open(path) {
    const handle = await fs.open(path, "w")
    return {
      async write(line) { await handle.write(line) },
      async close() { await handle.close() },
    }
  },
  async rename(from, to) { await fs.rename(from, to) },
  async readdir(path) { return fs.readdir(path) },
  async unlink(path) { await fs.unlink(path) },
}

export async function prepareDiagnosticOutput(params: {
  readonly projectDir: string
  readonly operation: DiagnosticReportOperation
  readonly operationId: string
  readonly diagnostics: MetadataDiagnosticCollection
  readonly fileSystem?: DiagnosticReportFileSystem
}): Promise<{
  readonly diagnostics: readonly MetadataDiagnostic[]
  readonly summary: DiagnosticSummary
  readonly truncated: boolean
  readonly report?: DiagnosticReportReference
}> {
  const fileSystem = params.fileSystem ?? defaultFileSystem
  const inline: MetadataDiagnostic[] = []
  const inlineLines: string[] = []
  let inlineBytes = 0
  let total = 0
  let writer: Awaited<ReturnType<DiagnosticReportFileSystem["open"]>> | undefined
  let report: DiagnosticReportReference | undefined
  const reportsDir = join(params.projectDir, ".nkdk", "reports")
  const fileName = `${params.operation}-${params.operationId}.jsonl`
  const finalPath = join(reportsDir, fileName)
  const temporaryPath = `${finalPath}.tmp`

  try {
    for (const diagnostic of params.diagnostics) {
      const line = `${JSON.stringify(diagnostic)}\n`
      const lineBytes = Buffer.byteLength(line)
      const fitsInline = inline.length < MAX_INLINE_DIAGNOSTICS
        && inlineBytes + lineBytes <= MAX_INLINE_DIAGNOSTIC_BYTES
      if (writer === undefined && fitsInline) {
        inline.push(diagnostic)
        inlineLines.push(line)
        inlineBytes += lineBytes
      } else {
        if (writer === undefined) {
          await fileSystem.mkdir(reportsDir)
          writer = await fileSystem.open(temporaryPath)
          for (const previous of inlineLines) await writer.write(previous)
        }
        await writer.write(line)
      }
      total += 1
    }

    if (writer !== undefined) {
      await writer.close()
      writer = undefined
      await fileSystem.rename(temporaryPath, finalPath)
      report = { uri: pathToFileURL(finalPath).href, format: "application/x-ndjson" }
      await removePreviousReports(fileSystem, reportsDir, params.operation, fileName)
    }

    return {
      diagnostics: inline,
      summary: {
        errors: params.diagnostics.errors,
        warnings: params.diagnostics.warnings,
        shown: inline.length,
        omitted: total - inline.length,
      },
      truncated: report !== undefined,
      ...(report === undefined ? {} : { report }),
    }
  } finally {
    if (writer !== undefined) await writer.close().catch(() => undefined)
    params.diagnostics.release()
  }
}

async function removePreviousReports(
  fileSystem: DiagnosticReportFileSystem,
  reportsDir: string,
  operation: DiagnosticReportOperation,
  currentFileName: string,
): Promise<void> {
  const names = await fileSystem.readdir(reportsDir)
  for (const name of names) {
    if (name !== currentFileName && name.startsWith(`${operation}-`) && name.endsWith(".jsonl")) {
      await fileSystem.unlink(join(reportsDir, name)).catch(() => undefined)
    }
  }
}
