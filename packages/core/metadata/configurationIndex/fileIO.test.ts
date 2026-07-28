import fs from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { NKDK_CORE_VERSION } from "../../version"
import { ConfigurationIndexCompatibilityError } from "./decode"
import {
  configurationIndexPath,
  readConfigurationIndex,
  writeConfigurationIndexAtomically,
} from "./fileIO"
import { sampleIndex } from "./testData"

describe("configuration index file IO", () => {
  const projectDirs: string[] = []

  afterEach(async () => {
    await Promise.all(projectDirs.splice(0).map((projectDir) => fs.promises.rm(projectDir, { recursive: true })))
  })

  async function createProjectDir(): Promise<string> {
    const projectDir = await fs.promises.mkdtemp(join(tmpdir(), "nkdk-index-"))
    projectDirs.push(projectDir)
    return projectDir
  }

  it("writes the configuration component index directly after successful encoding", async () => {
    const projectDir = await createProjectDir()
    const first = sampleIndex()
    await writeConfigurationIndexAtomically({ projectDir, address: { kind: "configuration" }, data: first })
    expect(await readConfigurationIndex({ projectDir, address: { kind: "configuration" } })).toEqual(first)

    await expect(
      writeConfigurationIndexAtomically({
        projectDir,
        address: { kind: "configuration" },
        data: { ...first, binding: { ...first.binding, componentPath: "wrong" } },
      })
    ).rejects.toThrow("Ожидалась привязка")
    expect(await readConfigurationIndex({ projectDir, address: { kind: "configuration" } })).toEqual(first)
    expect((await fs.promises.readdir(join(projectDir, ".nkdk", "components", "cf"))).sort()).toEqual(["configuration-index.bin"])
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

  it("reads with the current core version expectation", async () => {
    const projectDir = await createProjectDir()
    const data = sampleIndex()
    await writeConfigurationIndexAtomically({
      projectDir,
      address: { kind: "configuration" },
      data: { ...data, binding: { ...data.binding, producerVersion: `${NKDK_CORE_VERSION}-another` } },
    })

    await expect(readConfigurationIndex({ projectDir, address: { kind: "configuration" } })).rejects.toThrowError(
      ConfigurationIndexCompatibilityError
    )
  })
})
