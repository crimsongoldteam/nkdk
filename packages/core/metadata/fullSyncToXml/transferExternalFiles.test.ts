import fs from "node:fs"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { hashFileBytes } from "../configurationIndex/hash"
import { transferFullXmlSyncExternalFiles } from "./transferExternalFiles"
import type { FullXmlSyncExternalFile } from "./types"

describe("transferFullXmlSyncExternalFiles", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    vi.restoreAllMocks()
    for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
  })

  function tempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-transfer-external-"))
    tempDirs.push(dir)
    return dir
  }

  it("writes the same Buffer it hashes and returns hashes by project path", async () => {
    const outputDir = tempDir()
    const source = Buffer.from([1, 2, 3])
    const written: Buffer[] = []
    const result = await transferFullXmlSyncExternalFiles({
      outputDir,
      files: [
        externalFile("b.bin", "/source/b.bin", "Ext/b.bin"),
        externalFile("a.bin", "/source/a.bin", "Ext/a.bin"),
      ],
      concurrency: 1,
      async readFile(path) {
        return path.endsWith("a.bin") ? source : Buffer.from([4, 5])
      },
      async writeFile(_path, bytes) {
        written.push(bytes)
      },
    })

    expect(written).toContain(source)
    expect(result.projectFiles).toEqual([
      { projectPath: "a.bin", contentHash: hashFileBytes(source) },
      { projectPath: "b.bin", contentHash: hashFileBytes(Buffer.from([4, 5])) },
    ])
    expect(result.copiedFiles.map((file) => file.sourceProjectPath)).toEqual(["a.bin", "b.bin"])
  })

  it("limits concurrent transfers", async () => {
    const outputDir = tempDir()
    let active = 0
    let peak = 0
    const release: Array<() => void> = []
    const readFile = vi.fn(
      () =>
        new Promise<Buffer>((resolve) => {
          active += 1
          peak = Math.max(peak, active)
          release.push(() => {
            active -= 1
            resolve(Buffer.from([1]))
          })
        })
    )
    const promise = transferFullXmlSyncExternalFiles({
      outputDir,
      files: [externalFile("1.bin", "/1.bin", "1.bin"), externalFile("2.bin", "/2.bin", "2.bin"), externalFile("3.bin", "/3.bin", "3.bin")],
      concurrency: 2,
      readFile,
      async writeFile() {},
    })

    await vi.waitUntil(() => release.length === 2)
    expect(peak).toBe(2)
    release.splice(0).forEach((fn) => fn())
    await vi.waitUntil(() => release.length === 1)
    release.splice(0).forEach((fn) => fn())
    await promise
    expect(readFile).toHaveBeenCalledTimes(3)
  })

  it("rejects duplicate or escaping target paths before writing", async () => {
    const outputDir = tempDir()
    const writeFile = vi.fn(async () => undefined)

    await expect(
      transferFullXmlSyncExternalFiles({
        outputDir,
        files: [externalFile("a.bin", "/a.bin", "same.bin"), externalFile("b.bin", "/b.bin", "same.bin")],
        writeFile,
      })
    ).rejects.toThrow("Повторный XML-путь")
    await expect(
      transferFullXmlSyncExternalFiles({
        outputDir,
        files: [externalFile("escape.bin", "/escape.bin", "../escape.bin")],
        writeFile,
      })
    ).rejects.toThrow("выходит за целевой каталог")
    expect(writeFile).not.toHaveBeenCalled()
  })

  it("keeps already copied files when a later file fails", async () => {
    const projectDir = tempDir()
    const outputDir = join(projectDir, "xml")
    fs.writeFileSync(join(projectDir, "ok.bin"), Buffer.from([9]))

    await expect(
      transferFullXmlSyncExternalFiles({
        outputDir,
        files: [
          externalFile("ok.bin", join(projectDir, "ok.bin"), "Ext/ok.bin"),
          externalFile("missing.bin", join(projectDir, "missing.bin"), "Ext/missing.bin"),
        ],
        concurrency: 1,
      })
    ).rejects.toThrow()

    expect([...fs.readFileSync(join(outputDir, "Ext", "ok.bin"))]).toEqual([9])
    expect(fs.existsSync(join(outputDir, "Ext", "missing.bin"))).toBe(false)
  })
})

function externalFile(sourceProjectPath: string, sourcePath: string, targetXmlPath: string): FullXmlSyncExternalFile {
  return { sourceProjectPath, sourcePath, targetXmlPath }
}
