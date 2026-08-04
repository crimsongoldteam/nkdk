import { describe, expect, it } from "vitest"
import {
  createDiagnosticBatchWriter,
  createMetadataDiagnosticCollection,
  openDiagnosticBatch,
  type MetadataDiagnostic,
} from "@nkdk/core"
import {
  MAX_INLINE_DIAGNOSTICS,
  prepareDiagnosticOutput,
  type DiagnosticReportFileSystem,
} from "./diagnosticReport"

describe("выдача диагностик MCP", () => {
  it.each([
    { count: 99, messageBytes: 8, shown: 99, truncated: false },
    { count: 101, messageBytes: 8, shown: 100, truncated: true },
    { count: 2, messageBytes: 300 * 1024, shown: 1, truncated: true },
    { count: 1, messageBytes: 600 * 1024, shown: 0, truncated: true },
  ])("ограничивает начало результата: $count × $messageBytes", async ({ count, messageBytes, shown, truncated }) => {
    const fileSystem = memoryFileSystem()
    const diagnostics = diagnosticCollection(Array.from(
      { length: count },
      (_unused, index) => diagnostic(index, "x".repeat(messageBytes)),
    ))

    const result = await prepareDiagnosticOutput({
      projectDir: "/project",
      operation: "validation",
      operationId: "op",
      diagnostics,
      fileSystem,
    })

    expect(result.diagnostics).toHaveLength(shown)
    expect(result.truncated).toBe(truncated)
    expect(result.summary).toMatchObject({ shown, omitted: count - shown })
    expect(result.report === undefined).toBe(!truncated)
    expect(diagnostics.released).toBe(true)
    expect(result.diagnostics.length).toBeLessThanOrEqual(MAX_INLINE_DIAGNOSTICS)
  })

  it("атомарно публикует новый полный отчёт и только потом удаляет прежний", async () => {
    const fileSystem = memoryFileSystem(["validation-old.jsonl"])
    const diagnostics = diagnosticCollection(Array.from(
      { length: 101 },
      (_unused, index) => diagnostic(index, `Ошибка ${index}`),
    ))

    await prepareDiagnosticOutput({
      projectDir: "/project",
      operation: "validation",
      operationId: "new",
      diagnostics,
      fileSystem,
    })

    expect(fileSystem.calls).toEqual([
      "mkdir:/project/.nkdk/reports",
      "open:/project/.nkdk/reports/validation-new.jsonl.tmp",
      "close",
      "rename:validation-new.jsonl.tmp:validation-new.jsonl",
      "readdir:/project/.nkdk/reports",
      "unlink:validation-old.jsonl",
    ])
    expect(fileSystem.lines).toHaveLength(101)
  })
})

function diagnostic(index: number, message: string) {
  return {
    filePath: `cf/${String(index).padStart(3, "0")}.yaml`,
    line: 1,
    col: 1,
    severity: index % 2 === 0 ? "error" as const : "warning" as const,
    source: "syntax" as const,
    message,
  }
}

function diagnosticCollection(diagnostics: readonly MetadataDiagnostic[]) {
  const writer = createDiagnosticBatchWriter()
  for (const item of diagnostics) writer.append(item)
  return createMetadataDiagnosticCollection([openDiagnosticBatch(writer.finish())])
}

function memoryFileSystem(initialFiles: readonly string[] = []): DiagnosticReportFileSystem & {
  readonly calls: string[]
  readonly lines: string[]
} {
  const calls: string[] = []
  const lines: string[] = []
  const files = new Set(initialFiles)
  return {
    calls,
    lines,
    async mkdir(path) { calls.push(`mkdir:${path}`) },
    async open(path) {
      calls.push(`open:${path}`)
      return {
        async write(line) { lines.push(line) },
        async close() { calls.push("close") },
      }
    },
    async rename(from, to) {
      calls.push(`rename:${from.split("/").at(-1)}:${to.split("/").at(-1)}`)
      files.add(to.split("/").at(-1)!)
    },
    async readdir(path) { calls.push(`readdir:${path}`); return [...files] },
    async unlink(path) { calls.push(`unlink:${path.split("/").at(-1)}`); files.delete(path.split("/").at(-1)!) },
  }
}
