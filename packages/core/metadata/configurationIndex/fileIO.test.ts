import fs from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ConfigurationIndexCompatibilityError } from "./decode"
import { encodeConfigurationIndex } from "./encode"
import { configurationIndexPath, readConfigurationIndex, writeConfigurationIndexAtomically } from "./fileIO"
import { reverseInputOrder, sampleSnapshot } from "./testData"

describe("configuration index file IO", () => {
  const projectDirs: string[] = []

  afterEach(async () => {
    vi.restoreAllMocks()
    await Promise.all(projectDirs.splice(0).map((projectDir) => fs.promises.rm(projectDir, { recursive: true })))
  })

  async function createProjectDir(): Promise<string> {
    const projectDir = await fs.promises.mkdtemp(join(tmpdir(), "nkdk-index-"))
    projectDirs.push(projectDir)
    return projectDir
  }

  it("publishes the index atomically without leaving temporary files", async () => {
    const projectDir = await createProjectDir()
    const data = sampleSnapshot()

    await writeConfigurationIndexAtomically({ projectDir, address: { kind: "configuration" }, data })

    expect(await readConfigurationIndex({ projectDir, address: { kind: "configuration" } })).toEqual(
      reverseInputOrder(data)
    )
    expect(await indexDirectoryEntries(projectDir)).toEqual(["configuration-index.bin"])
  })

  it("keeps the previous index and removes its temporary file when rename fails", async () => {
    const projectDir = await createProjectDir()
    const previous = sampleSnapshot()
    const target = configurationIndexPath(projectDir, { kind: "configuration" })
    await fs.promises.mkdir(dirname(target), { recursive: true })
    await fs.promises.writeFile(target, encodeConfigurationIndex(previous))
    const rename = vi.spyOn(fs.promises, "rename").mockRejectedValueOnce(new Error("rename failed"))

    await expect(
      writeConfigurationIndexAtomically({
        projectDir,
        address: { kind: "configuration" },
        data: { ...previous, indexGeneration: previous.indexGeneration + 1n },
      })
    ).rejects.toThrow("rename failed")

    expect(rename).toHaveBeenCalledOnce()
    expect(await readConfigurationIndex({ projectDir, address: { kind: "configuration" } })).toEqual(
      reverseInputOrder(previous)
    )
    expect(await indexDirectoryEntries(projectDir)).toEqual(["configuration-index.bin"])
  })

  it("does not report a save failure after rename committed the new index", async () => {
    const projectDir = await createProjectDir()
    const previous = sampleSnapshot()
    await writeConfigurationIndexAtomically({
      projectDir,
      address: { kind: "configuration" },
      data: previous,
    })
    const targetDirectory = dirname(configurationIndexPath(projectDir, { kind: "configuration" }))
    const originalOpen = fs.promises.open.bind(fs.promises)
    vi.spyOn(fs.promises, "open").mockImplementation(async (path, flags) => {
      const handle = await originalOpen(path, flags)
      if (String(path) === targetDirectory && flags === "r") {
        vi.spyOn(handle, "sync").mockRejectedValueOnce(new Error("directory sync failed"))
      }
      return handle
    })
    const next = { ...previous, indexGeneration: previous.indexGeneration + 1n }

    await expect(
      writeConfigurationIndexAtomically({
        projectDir,
        address: { kind: "configuration" },
        data: next,
      })
    ).resolves.toBeUndefined()

    expect(await readConfigurationIndex({ projectDir, address: { kind: "configuration" } })).toEqual(
      reverseInputOrder(next)
    )
    expect(await indexDirectoryEntries(projectDir)).toEqual(["configuration-index.bin"])
  })

  it("keeps a colliding temporary file owned by another writer and retries with a new name", async () => {
    const projectDir = await createProjectDir()
    const data = sampleSnapshot()
    const originalOpen = fs.promises.open.bind(fs.promises)
    let collidingTemporary: string | undefined
    vi.spyOn(fs.promises, "open").mockImplementationOnce(async (path) => {
      collidingTemporary = String(path)
      await fs.promises.writeFile(collidingTemporary, "foreign writer", { flag: "wx" })
      return originalOpen(collidingTemporary, "wx")
    })

    await writeConfigurationIndexAtomically({ projectDir, address: { kind: "configuration" }, data })

    expect(collidingTemporary).toBeDefined()
    expect(await fs.promises.readFile(collidingTemporary!, "utf8")).toBe("foreign writer")
    expect(await readConfigurationIndex({ projectDir, address: { kind: "configuration" } })).toEqual(
      reverseInputOrder(data)
    )
  })

  it("rejects a snapshot bound to another component before replacing the target", async () => {
    const projectDir = await createProjectDir()
    const first = sampleSnapshot()
    await writeConfigurationIndexAtomically({ projectDir, address: { kind: "configuration" }, data: first })

    await expect(
      writeConfigurationIndexAtomically({
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
