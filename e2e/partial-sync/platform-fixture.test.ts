import { describe, expect, it } from "vitest"
import {
  PlatformFixtureError,
  prepareInfobaseFixture,
  type PlatformFixtureDependencies,
} from "./platform-fixture"

describe("partial sync platform fixture", () => {
  it("creates a base and fully loads both components without a shell", async () => {
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

    expect(fixture.launches).toHaveLength(3)
    expect(fixture.launches[0]?.args).toContain(`File="${baseDir}";`)
    expect(fixture.launches[1]?.args).toEqual(expect.arrayContaining([
      "/LoadConfigFromFiles",
      cfXmlDir,
    ]))
    expect(fixture.launches[2]?.args).toEqual(expect.arrayContaining([
      "/LoadConfigFromFiles",
      extensionXmlDir,
      "/Extension",
      "Расширение_All",
    ]))
    expect(fixture.launches.every(({ command }) => command === "/opt/platform/1cv8")).toBe(true)
  })

  it.each([
    ["missing platform", undefined, [], "platform_not_found"],
    ["missing enterprise", { version: "8.3.27.2214", directory: "/opt/platform" }, [], "platform_component_missing"],
    ["failed configuration load", {
      version: "8.3.27.2214",
      directory: "/opt/platform",
      enterprisePath: "/opt/platform/1cv8",
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
})

function createFixture(options: {
  installation?: Awaited<ReturnType<PlatformFixtureDependencies["findPlatform"]>>
  exitCodes?: number[]
} = {}) {
  const launches: Array<{ command: string; args: readonly string[] }> = []
  const exitCodes = options.exitCodes ?? []
  const defaultInstallation = {
    version: "8.3.27.2214",
    directory: "/opt/platform",
    enterprisePath: "/opt/platform/1cv8",
  }
  const dependencies: PlatformFixtureDependencies = {
    findPlatform: async () => "installation" in options ? options.installation : defaultInstallation,
    async mkdir() {},
    async runProcess(command, args) {
      launches.push({ command, args })
      return { exitCode: exitCodes[launches.length - 1] ?? 0 }
    },
  }
  return { dependencies, launches }
}
