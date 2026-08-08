import fs from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import { describe, expect, it, onTestFinished } from "vitest"
import { ConfigurationIndexCompatibilityError } from "./decode"
import { encodeConfigurationIndex } from "./encode"
import { configurationIndexPath, readConfigurationIndex, writeConfigurationIndex } from "./fileIO"
import { reverseInputOrder, sampleSnapshot } from "./testData"

describe("configuration index file IO", () => {
  async function createProjectDir(): Promise<string> {
    const projectDir = await fs.promises.mkdtemp(join(tmpdir(), "nkdk-index-"))
    onTestFinished(() => fs.promises.rm(projectDir, { recursive: true }))
    return projectDir
  }

  it("writes the index without leaving additional files", async () => {
    const projectDir = await createProjectDir()
    const data = sampleSnapshot()

    await writeConfigurationIndex({ projectDir, address: { kind: "configuration" }, data })

    expect(await readConfigurationIndex({ projectDir, address: { kind: "configuration" } })).toEqual(
      reverseInputOrder(data)
    )
    expect(await indexDirectoryEntries(projectDir)).toEqual(["configuration-index.bin"])
  })

  it("rejects a snapshot bound to another component before writing the target", async () => {
    const projectDir = await createProjectDir()
    const first = sampleSnapshot()
    await writeConfigurationIndex({ projectDir, address: { kind: "configuration" }, data: first })

    await expect(
      writeConfigurationIndex({
        projectDir,
        address: { kind: "configuration" },
        data: { ...first, componentPath: "wrong" },
      })
    ).rejects.toThrow("Ожидалась привязка")
    expect(await readConfigurationIndex({ projectDir, address: { kind: "configuration" } })).toEqual(
      reverseInputOrder(first)
    )
  })

  it("addresses every index path through a component", async () => {
    const projectDir = await createProjectDir()

    expect(configurationIndexPath(projectDir, { kind: "configuration" })).toBe(
      join(projectDir, ".nkdk", "components", "cf", "configuration-index.bin")
    )
    expect(configurationIndexPath(projectDir, { kind: "configurationExtension", name: "Расширение" })).toBe(
      join(projectDir, ".nkdk", "components", "cfe", "Расширение", "configuration-index.bin")
    )
  })

  it("validates only the component path when reading", async () => {
    const projectDir = await createProjectDir()
    const target = configurationIndexPath(projectDir, { kind: "configuration" })
    await fs.promises.mkdir(dirname(target), { recursive: true })
    await fs.promises.writeFile(
      target,
      encodeConfigurationIndex({ ...sampleSnapshot(), componentPath: "cfe/Расширение" })
    )

    await expect(readConfigurationIndex({ projectDir, address: { kind: "configuration" } })).rejects.toThrowError(
      ConfigurationIndexCompatibilityError
    )
  })
})

async function indexDirectoryEntries(projectDir: string): Promise<string[]> {
  return (await fs.promises.readdir(join(projectDir, ".nkdk", "components", "cf"))).sort()
}
