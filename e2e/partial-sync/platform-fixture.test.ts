import { describe, expect, it } from "vitest"
import { join } from "node:path"
import {
  PlatformFixtureError,
  prepareInfobaseFixture,
  type PlatformFixtureDependencies,
} from "./platform-fixture"

describe("partial sync platform fixture", () => {
  it("creates a base and fully loads both components through the standalone server", async () => {
    const fixture = createFixture()
    const baseDir = "/Users/nikita/Базы 1С/temp_test/base"
    const cfXmlDir = "/repo/e2e/fixtures/xml/cf"
    const extensionXmlDir = "/repo/e2e/fixtures/xml/cfe/Расширение_All"

    await prepareInfobaseFixture({
      baseDir,
      dataDir: "/Users/nikita/Базы 1С/temp_test/data",
      logsDir: "/Users/nikita/Базы 1С/temp_test/logs/attempt",
      cfXmlDir,
      extensionXmlDir,
      extensionName: "Расширение_All",
    }, fixture.dependencies)

    expect(fixture.launches).toEqual([
      {
        command: "/opt/platform/ibcmd",
        args: [
          "infobase",
          "create",
          `--database-path=${baseDir}`,
          "--data=/Users/nikita/Базы 1С/temp_test/data",
          `--import=${cfXmlDir}`,
          "--apply",
          "--force",
        ],
      },
      {
        command: "/opt/platform/ibcmd",
        args: [
          "infobase",
          "config",
          "import",
          `--database-path=${baseDir}`,
          "--data=/Users/nikita/Базы 1С/temp_test/data",
          "--extension=Расширение_All",
          extensionXmlDir,
        ],
      },
      {
        command: "/opt/platform/ibcmd",
        args: [
          "infobase",
          "config",
          "apply",
          `--database-path=${baseDir}`,
          "--data=/Users/nikita/Базы 1С/temp_test/data",
          "--extension=Расширение_All",
          "--force",
        ],
      },
    ])
    expect(fixture.writes.map(({ path }) => path)).toEqual([
      join("/Users/nikita/Базы 1С/temp_test/logs/attempt", "01-create-and-load-configuration.log"),
      join("/Users/nikita/Базы 1С/temp_test/logs/attempt", "02-load-extension.log"),
      join("/Users/nikita/Базы 1С/temp_test/logs/attempt", "03-apply-extension.log"),
    ])
    expect(fixture.writes[0]?.content).toContain("stdout: ok")
    expect(fixture.writes[0]?.content).toContain("stderr:")
  })

  it.each([
    ["missing platform", undefined, [], "platform_not_found"],
    ["missing ibcmd", { version: "8.3.27.2214", directory: "/opt/platform" }, [], "platform_component_missing"],
    ["failed configuration load", {
      version: "8.3.27.2214",
      directory: "/opt/platform",
      ibcmdPath: "/opt/platform/ibcmd",
    }, [0, 1], "platform_command_failed"],
  ] as const)("stops after %s", async (_name, installation, exitCodes, code) => {
    const fixture = createFixture({ installation, exitCodes: [...exitCodes] })

    const error = await prepareInfobaseFixture({
      baseDir: "/workspace/base",
      dataDir: "/workspace/data",
      logsDir: "/workspace/logs/attempt",
      cfXmlDir: "/fixtures/cf",
      extensionXmlDir: "/fixtures/cfe/Расширение_All",
      extensionName: "Расширение_All",
    }, fixture.dependencies).catch((caught: unknown) => caught)

    expect(error).toMatchObject<Partial<PlatformFixtureError>>({ code })
    expect(fixture.launches).toHaveLength(exitCodes.length)
  })

  it("передаёт сигнал отмены каждому процессу ibcmd", async () => {
    const fixture = createFixture()
    const controller = new AbortController()

    await prepareInfobaseFixture({
      baseDir: "/workspace/base", dataDir: "/workspace/data", logsDir: "/workspace/logs",
      cfXmlDir: "/fixtures/cf", extensionXmlDir: "/fixtures/cfe", extensionName: "Расширение_All",
      signal: controller.signal,
    }, fixture.dependencies)

    expect(fixture.signals).toEqual([
      controller.signal, controller.signal, controller.signal,
    ])
  })
})

function createFixture(options: {
  installation?: Awaited<ReturnType<PlatformFixtureDependencies["findPlatform"]>>
  exitCodes?: number[]
} = {}) {
  const launches: Array<{ command: string; args: readonly string[] }> = []
  const writes: Array<{ path: string; content: string }> = []
  const signals: Array<AbortSignal | undefined> = []
  const exitCodes = options.exitCodes ?? []
  const defaultInstallation = {
    version: "8.3.27.2214",
    directory: "/opt/platform",
    ibcmdPath: "/opt/platform/ibcmd",
  }
  const dependencies: PlatformFixtureDependencies = {
    findPlatform: async () => "installation" in options ? options.installation : defaultInstallation,
    async mkdir() {},
    async writeFile(path, content) {
      writes.push({ path, content })
    },
    async runProcess(command, args, processOptions) {
      launches.push({ command, args })
      signals.push(processOptions.signal)
      return { exitCode: exitCodes[launches.length - 1] ?? 0, stdout: "ok", stderr: "" }
    },
  }
  return { dependencies, launches, writes, signals }
}
