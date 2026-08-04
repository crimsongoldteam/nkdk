import fs from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { publishFileAtomically } from "./atomicPublication"

describe("publishFileAtomically", () => {
  const directories: string[] = []

  afterEach(async () => {
    vi.restoreAllMocks()
    await Promise.all(directories.splice(0).map((directory) => fs.promises.rm(directory, { recursive: true })))
  })

  async function targetPath(): Promise<string> {
    const directory = await fs.promises.mkdtemp(join(tmpdir(), "nkdk-atomic-publication-"))
    directories.push(directory)
    return join(directory, "snapshot.bin")
  }

  it("проверяет и публикует временный файл, не оставляя его рядом с целью", async () => {
    const target = await targetPath()
    const verified: string[] = []

    await publishFileAtomically({
      target,
      writeTemporary: async (temporary) => fs.promises.writeFile(temporary, "next"),
      verifyTemporary: async (temporary) => {
        verified.push(await fs.promises.readFile(temporary, "utf8"))
      },
    })

    expect(verified).toEqual(["next"])
    expect(await fs.promises.readFile(target, "utf8")).toBe("next")
    expect(await fs.promises.readdir(dirname(target))).toEqual(["snapshot.bin"])
  })

  it.each(["verify", "rename"] as const)("сохраняет предыдущий файл и удаляет временный при ошибке %s", async (stage) => {
    const target = await targetPath()
    await fs.promises.writeFile(target, "previous")
    if (stage === "rename") vi.spyOn(fs.promises, "rename").mockRejectedValueOnce(new Error("rename failed"))

    await expect(publishFileAtomically({
      target,
      writeTemporary: async (temporary) => fs.promises.writeFile(temporary, "next"),
      verifyTemporary: async () => {
        if (stage === "verify") throw new Error("verify failed")
      },
    })).rejects.toThrow(`${stage} failed`)

    expect(await fs.promises.readFile(target, "utf8")).toBe("previous")
    expect(await fs.promises.readdir(dirname(target))).toEqual(["snapshot.bin"])
  })

  it("считает rename точкой фиксации при ошибке fsync каталога", async () => {
    const target = await targetPath()
    const directory = dirname(target)
    const originalOpen = fs.promises.open.bind(fs.promises)
    vi.spyOn(fs.promises, "open").mockImplementation(async (path, flags, mode) => {
      const handle = await originalOpen(path, flags, mode)
      if (String(path) === directory && flags === "r") {
        vi.spyOn(handle, "sync").mockRejectedValueOnce(new Error("directory sync failed"))
      }
      return handle
    })

    await expect(publishFileAtomically({
      target,
      writeTemporary: async (temporary) => fs.promises.writeFile(temporary, "committed"),
      verifyTemporary: async () => undefined,
    })).resolves.toBeUndefined()

    expect(await fs.promises.readFile(target, "utf8")).toBe("committed")
  })
})
