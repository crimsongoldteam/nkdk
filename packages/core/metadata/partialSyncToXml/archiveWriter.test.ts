import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { BlobReader, TextWriter, Uint8ArrayWriter, ZipReader, type Entry, type FileEntry } from "@zip.js/zip.js"
import { afterEach, describe, expect, it } from "vitest"
import { hashFileBytes } from "../configurationIndex/hash"
import type { FullXmlSyncExternalFile, FullXmlSyncGeneratedDocument } from "../fullSyncToXml/types"
import { createPartialXmlArchiveWriter } from "./archiveWriter"

describe("потоковый ZIP частичной XML-синхронизации", () => {
  const tempDirs: string[] = []

  afterEach(() => tempDirs.splice(0).forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })))

  it("записывает точные XML-байты и отсортированный load.lst", async () => {
    const { dir, archivePath } = location()
    const writer = createPartialXmlArchiveWriter({ archivePath })
    const first = generated("Catalogs/Товары.xml", Uint8Array.of(0xef, 0xbb, 0xbf, 60, 47, 62))
    const second = generated("Configuration.xml", new TextEncoder().encode("<Configuration/>"))

    await writer.addGenerated(first)
    await writer.addGenerated(second)
    const result = await writer.close([first.targetXmlPath, second.targetXmlPath])

    expect(result.entries).toEqual(["Catalogs/Товары.xml", "Configuration.xml", "load.lst"])
    expect(result.archiveHash).toBe(hashFileBytes(fs.readFileSync(archivePath)))
    const entries = await readArchive(archivePath)
    expect(await fileEntry(entries, "Catalogs/Товары.xml").getData(new Uint8ArrayWriter())).toEqual(first.content)
    expect(await fileEntry(entries, "load.lst").getData(new TextWriter())).toBe(
      "Catalogs/Товары.xml\nConfiguration.xml\n"
    )
    expect(fs.readdirSync(dir)).toEqual(["package.zip"])
  })

  it("передаёт внешний файл потоком и сохраняет очищенный модуль с BOM", async () => {
    const { archivePath } = location()
    const large = Buffer.alloc(4 * 1024 + 17, 0x5a)
    const largePath = sourceFile("large.bin", large)
    const moduleBytes = Buffer.from([0xef, 0xbb, 0xbf])
    const modulePath = sourceFile("Module.bsl", moduleBytes)
    const writer = createPartialXmlArchiveWriter({ archivePath })

    await writer.addExternal(external(largePath, "Catalogs/Товары/Ext/large.bin", large))
    await writer.addExternal(external(modulePath, "Catalogs/Товары/Ext/Module.bsl", moduleBytes))
    await writer.close(["Catalogs/Товары/Ext/Module.bsl"])

    const entries = await readArchive(archivePath)
    expect(await fileEntry(entries, "Catalogs/Товары/Ext/large.bin").getData(new Uint8ArrayWriter()))
      .toEqual(Uint8Array.from(large))
    expect(await fileEntry(entries, "Catalogs/Товары/Ext/Module.bsl").getData(new Uint8ArrayWriter()))
      .toEqual(Uint8Array.from(moduleBytes))
  })

  it.each(["../escape.xml", "/absolute.xml", "a/./b.xml", "a\\b.xml"])(
    "отклоняет опасный путь %s и удаляет незавершённый архив",
    async (targetXmlPath) => {
      const { dir, archivePath } = location()
      const writer = createPartialXmlArchiveWriter({ archivePath })

      await expect(writer.addGenerated(generated(targetXmlPath, Uint8Array.of(1)))).rejects.toThrow(/путь/i)

      expect(fs.existsSync(archivePath)).toBe(false)
      expect(fs.readdirSync(dir)).not.toContain("package.zip.tmp")
    }
  )

  it("отклоняет повтор записи и изменение внешнего файла после расчёта хэша", async () => {
    const duplicateLocation = location()
    const duplicateWriter = createPartialXmlArchiveWriter({ archivePath: duplicateLocation.archivePath })
    await duplicateWriter.addGenerated(generated("Configuration.xml", Uint8Array.of(1)))
    await expect(duplicateWriter.addGenerated(generated("Configuration.xml", Uint8Array.of(2))))
      .rejects.toThrow(/повтор/i)
    expect(fs.existsSync(duplicateLocation.archivePath)).toBe(false)

    const raceLocation = location()
    const bytes = Buffer.from("new")
    const sourcePath = sourceFile("changed.bsl", bytes)
    const raceWriter = createPartialXmlArchiveWriter({ archivePath: raceLocation.archivePath })
    await expect(raceWriter.addExternal({
      ...external(sourcePath, "Ext/Module.bsl", bytes),
      expectedContentHash: hashFileBytes(Buffer.from("old")),
    })).rejects.toThrow(/изменён после получения хэшей/)
    expect(fs.existsSync(raceLocation.archivePath)).toBe(false)
  })

  it("удаляет архив при ошибке закрытия и несовпадении проверенного состава", async () => {
    const closeLocation = location()
    const closeWriter = createPartialXmlArchiveWriter({
      archivePath: closeLocation.archivePath,
      dependencies: { async closeArchive() { throw new Error("close failed") } },
    })
    await closeWriter.addGenerated(generated("Configuration.xml", Uint8Array.of(1)))
    await expect(closeWriter.close([])).rejects.toThrow("close failed")
    expect(fs.existsSync(closeLocation.archivePath)).toBe(false)

    const mismatchLocation = location()
    const mismatchWriter = createPartialXmlArchiveWriter({
      archivePath: mismatchLocation.archivePath,
      dependencies: { async readArchiveEntries() { return ["unexpected.xml"] } },
    })
    await mismatchWriter.addGenerated(generated("Configuration.xml", Uint8Array.of(1)))
    await expect(mismatchWriter.close([])).rejects.toThrow(/состав/i)
    expect(fs.existsSync(mismatchLocation.archivePath)).toBe(false)
  })

  function location(): { dir: string; archivePath: string } {
    const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-partial-archive-"))
    tempDirs.push(dir)
    return { dir, archivePath: join(dir, "package.zip") }
  }

  function sourceFile(name: string, bytes: Uint8Array): string {
    const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-partial-source-"))
    tempDirs.push(dir)
    const path = join(dir, name)
    fs.writeFileSync(path, bytes)
    return path
  }
})

function generated(targetXmlPath: string, content: Uint8Array): FullXmlSyncGeneratedDocument {
  return { assignmentId: targetXmlPath, declarationId: targetXmlPath, targetXmlPath, content }
}

function external(sourcePath: string, targetXmlPath: string, bytes: Uint8Array): FullXmlSyncExternalFile {
  return {
    sourceProjectPath: sourcePath,
    sourcePath,
    expectedContentHash: hashFileBytes(bytes),
    targetXmlPath,
  }
}

async function readArchive(archivePath: string) {
  const reader = new ZipReader(new BlobReader(new Blob([fs.readFileSync(archivePath)])))
  const entries = await reader.getEntries()
  await reader.close()
  return new Map(entries.map((entry) => [entry.filename, entry]))
}

function fileEntry(entries: ReadonlyMap<string, Entry>, name: string): FileEntry {
  const entry = entries.get(name)
  if (entry === undefined || entry.directory) throw new Error(`Не найдена запись ZIP: ${name}`)
  return entry
}
