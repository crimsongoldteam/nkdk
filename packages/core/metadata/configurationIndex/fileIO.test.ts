import fs from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { NKDK_CORE_VERSION } from "../../version"
import { ConfigurationIndexCompatibilityError } from "./decode"
import { encodeConfigurationIndex } from "./encode"
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

  it("replaces default.bin only after encoding and verification", async () => {
    const projectDir = await createProjectDir()
    const first = sampleIndex()
    await writeConfigurationIndexAtomically({ projectDir, data: first })
    const indexPath = configurationIndexPath(projectDir, "default")
    expect(await readConfigurationIndex({ projectDir, baseId: "default" })).toEqual(first)

    await expect(
      writeConfigurationIndexAtomically({
        projectDir,
        data: { ...first, binding: { ...first.binding, baseId: "wrong" } },
      })
    ).rejects.toThrow("baseId")
    expect(await fs.promises.readFile(indexPath)).toEqual(encodeConfigurationIndex(first))
  })

  it("accepts only the default base ID in format 1.0", async () => {
    const projectDir = await createProjectDir()

    expect(configurationIndexPath(projectDir)).toBe(join(projectDir, ".nkdk", "configuration-index", "default.bin"))
    expect(() => configurationIndexPath(projectDir, "another")).toThrow("baseId")
  })

  it("reads with the current core version expectation", async () => {
    const projectDir = await createProjectDir()
    const data = sampleIndex()
    await writeConfigurationIndexAtomically({
      projectDir,
      data: { ...data, binding: { ...data.binding, producerVersion: `${NKDK_CORE_VERSION}-another` } },
    })

    await expect(readConfigurationIndex({ projectDir })).rejects.toThrowError(ConfigurationIndexCompatibilityError)
  })
})
