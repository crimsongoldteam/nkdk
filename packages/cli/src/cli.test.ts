import fs from "fs"
import { mkdtempSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createProgram, runCli } from "./cli"

describe("cli", () => {
  const slowCliTimeout = 60_000

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = undefined
  })

  it("handles missing validate yaml-dir as command usage error", () => {
    const stderr = captureStderr()
    const program = createProgram()
    program.exitOverride()

    expect(() => program.parse(["node", "nkdk", "validate"], { from: "node" })).not.toThrow()

    expect(writtenText(stderr)).toContain("Не указан путь к YAML-проекту")
    expect(process.exitCode).toBe(2)
  })

  it("exits after unhandled async command errors in real CLI mode", async () => {
    const stderr = captureStderr()
    const exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never)

    runCli(["node", "nkdk", "schema", "MetadataCatalog", "--inline"])
    await waitForAsyncCatch()

    expect(writtenText(stderr)).toContain("--inline можно использовать только вместе с --json-schema")
    expect(exit).toHaveBeenCalledWith(1)
  })

  it("exposes workers option for sync and does not expose reference option", () => {
    const program = createProgram()
    const sync = program.commands.find((command) => command.name() === "sync")

    expect(sync?.options.map((option) => option.long)).toContain("--workers")
    expect(sync?.options.map((option) => option.long)).not.toContain("--reference")
  })

  it("prints no-write rename plan by default", async () => {
    const stdout = captureStdout()
    const yamlDir = createProject()
    const program = createProgram({ exitOnUnhandledError: false })

    await program.parseAsync(["node", "nkdk", "rename", yamlDir, "Справочник.Товары", "Номенклатура"], { from: "node" })

    const result = JSON.parse(writtenText(stdout))
    expect(result).toMatchObject({ ok: true, mode: "plan" })
    expect(fs.existsSync(join(yamlDir, "Справочник", "Товары"))).toBe(true)
  }, slowCliTimeout)

  it("applies rename only with --write", async () => {
    const stdout = captureStdout()
    const yamlDir = createProject()
    const program = createProgram({ exitOnUnhandledError: false })

    await program.parseAsync(["node", "nkdk", "rename", yamlDir, "Справочник.Товары", "Номенклатура", "--write"], {
      from: "node",
    })

    const result = JSON.parse(writtenText(stdout))
    expect(result).toMatchObject({ ok: true, mode: "applied" })
    expect(fs.existsSync(join(yamlDir, "Справочник", "Товары"))).toBe(false)
    expect(fs.existsSync(join(yamlDir, "Справочник", "Номенклатура"))).toBe(true)
  }, slowCliTimeout)

  it("delete prints blocked references and exits non-zero", async () => {
    const stdout = captureStdout()
    const yamlDir = createProject()
    writeProjectFile(yamlDir, "Справочник/Заказы/Свойства.yaml", ["Владельцы:", "  - Справочник.Товары"])
    const program = createProgram({ exitOnUnhandledError: false })

    await program.parseAsync(["node", "nkdk", "delete", yamlDir, "Справочник.Товары", "--write"], { from: "node" })

    const result = JSON.parse(writtenText(stdout))
    expect(result).toMatchObject({ ok: false, code: "references_found" })
    expect(process.exitCode).toBe(1)
  }, slowCliTimeout)
})

function createProject(): string {
  const yamlDir = mkdtempSync(join(tmpdir(), "nkdk-cli-"))
  writeProjectFile(yamlDir, "Справочник/Товары/Свойства.yaml", "{}\n")
  return yamlDir
}

function writeProjectFile(projectDir: string, projectPath: string, lines: string[] | string): void {
  const filePath = join(projectDir, ...projectPath.split("/"))
  fs.mkdirSync(join(filePath, ".."), { recursive: true })
  fs.writeFileSync(filePath, Array.isArray(lines) ? `${lines.join("\n")}\n` : lines)
}

function captureStdout() {
  return vi.spyOn(process.stdout, "write").mockImplementation(() => true)
}

function captureStderr() {
  return vi.spyOn(process.stderr, "write").mockImplementation(() => true)
}

function writtenText(writer: ReturnType<typeof captureStderr>): string {
  return writer.mock.calls.map(([chunk]) => String(chunk)).join("")
}

async function waitForAsyncCatch(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve))
}
