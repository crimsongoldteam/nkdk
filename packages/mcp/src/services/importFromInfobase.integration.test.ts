import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { stringify } from "yaml"
import { afterEach, describe, expect, it } from "vitest"
import { importFromInfobase } from "./importFromInfobase"
import { closePlatformSessionManager } from "./platformSessionHandle"

const requiredVariables = [
  "NKDK_TEST_INFOBASE_PATH",
  "NKDK_TEST_INFOBASE_USER",
  "NKDK_TEST_INFOBASE_PASSWORD",
] as const
const hasInfobase = requiredVariables.every((name) => process.env[name] !== undefined)
const describeInfobase = hasInfobase ? describe : describe.skip
const modes = (process.env["NKDK_TEST_INFOBASE_MODES"] ?? "designer-agent")
  .split(",")
  .map((mode) => mode.trim())
  .filter((mode): mode is "designer-agent" | "standalone-server" =>
    mode === "designer-agent" || mode === "standalone-server"
  )

describeInfobase("real infobase import", () => {
  const temporaryProjects: string[] = []

  afterEach(async () => {
    await closePlatformSessionManager()
    await Promise.all(
      temporaryProjects.splice(0).map((path) => rm(path, { recursive: true, force: true }))
    )
  })

  it.each(modes)("imports through %s", async (mode) => {
    const projectDir = await createTemporaryProject(temporaryProjects, {
      password: requiredEnv("NKDK_TEST_INFOBASE_PASSWORD"),
      mode,
    })

    const result = await importFromInfobase({ projectDir, allowWrite: true })

    if (!result.ok) throw new Error(await safeFailureSummary(result))
    expect(result).toMatchObject({ ok: true, mode, failed: [] })
    const componentDir = join(projectDir, "cf")
    expect((await stat(componentDir)).isDirectory()).toBe(true)
    expect((await readdir(componentDir)).length).toBeGreaterThan(0)
    expect(JSON.stringify(result)).not.toContain(requiredEnv("NKDK_TEST_INFOBASE_PASSWORD"))
  }, 30 * 60 * 1000)

  it("returns a safe short error and readable log for a wrong password", async () => {
    const wrongPassword = "__nkdk_wrong_password__"
    const projectDir = await createTemporaryProject(temporaryProjects, {
      password: wrongPassword,
      mode: "designer-agent",
    })

    const result = await importFromInfobase({ projectDir, allowWrite: true })

    expect(result).toMatchObject({ ok: false, details: { stage: "authentication" } })
    if (result.ok || !isLogDetails(result.details)) throw new Error("expected platform log")
    expect(result.message.length).toBeLessThanOrEqual(500)
    expect(JSON.stringify(result)).not.toContain(wrongPassword)
    const log = await readFile(fileURLToPath(result.details.log.uri), "utf8")
    expect(log).not.toContain(wrongPassword)
    expect(log).not.toContain(requiredEnv("NKDK_TEST_INFOBASE_PASSWORD"))
  }, 30 * 60 * 1000)
})

async function createTemporaryProject(
  temporaryProjects: string[],
  params: { password: string; mode: "designer-agent" | "standalone-server" }
): Promise<string> {
  const projectDir = await mkdtemp(join(tmpdir(), "nkdk-infobase-import-"))
  temporaryProjects.push(projectDir)
  const settingsDir = join(projectDir, ".nkdk")
  await mkdir(settingsDir, { recursive: true })
  await writeFile(join(settingsDir, "project.yaml"), stringify({
    infobase: {
      connectionString: `File="${requiredEnv("NKDK_TEST_INFOBASE_PATH")}";`,
      user: requiredEnv("NKDK_TEST_INFOBASE_USER"),
      password: params.password,
      operations: {
        import: { mode: params.mode, unresolvedReferences: "include" },
      },
    },
  }), { mode: 0o600 })
  return projectDir
}

function requiredEnv(name: typeof requiredVariables[number]): string {
  const value = process.env[name]
  if (value === undefined) throw new Error(`${name} is required`)
  return value
}

function isLogDetails(value: unknown): value is { log: { uri: string } } {
  return typeof value === "object"
    && value !== null
    && "log" in value
    && typeof value.log === "object"
    && value.log !== null
    && "uri" in value.log
    && typeof value.log.uri === "string"
}

async function safeFailureSummary(result: { code: string; message: string; details?: unknown }): Promise<string> {
  if (!isLogDetails(result.details)) return JSON.stringify(result)
  const lines = (await readFile(fileURLToPath(result.details.log.uri), "utf8")).trimEnd().split("\n")
  return `${JSON.stringify(result)}\n${lines.slice(-20).join("\n")}`
}
