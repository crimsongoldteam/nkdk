import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { createXmlChangeTracker } from "./xmlChangeTracker"

describe("XmlChangeTracker", () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function tempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-xml-change-tracker-"))
    dirs.push(dir)
    return dir
  }

  it("reports added and changed writes by checking existence before write", async () => {
    const root = tempDir()
    mkdirSync(join(root, "Catalogs"), { recursive: true })
    writeFileSync(join(root, "Catalogs", "Existing.xml"), "<Catalog/>", "utf-8")
    const tracker = createXmlChangeTracker(root)

    await tracker.markWrite(join(root, "Catalogs", "New.xml"))
    writeFileSync(join(root, "Catalogs", "New.xml"), "<Catalog/>", "utf-8")
    await tracker.markWrite(join(root, "Catalogs", "Existing.xml"))
    writeFileSync(join(root, "Catalogs", "Existing.xml"), "<Catalog/>", "utf-8")

    expect(tracker.changedFiles()).toEqual([
      { path: "Catalogs/Existing.xml", change: "changed" },
      { path: "Catalogs/New.xml", change: "added" },
    ])
  })

  it("reports deleted only when file or directory existed before removal", async () => {
    const root = tempDir()
    mkdirSync(join(root, "Catalogs", "Товары"), { recursive: true })
    writeFileSync(join(root, "Catalogs", "Товары.xml"), "<Catalog/>", "utf-8")
    writeFileSync(join(root, "Catalogs", "Товары", "Ext.xml"), "<Ext/>", "utf-8")
    const tracker = createXmlChangeTracker(root)

    await tracker.markDelete(join(root, "Catalogs", "Товары.xml"))
    await tracker.markDelete(join(root, "Catalogs", "Товары"))
    await tracker.markDelete(join(root, "Catalogs", "Missing.xml"))

    expect(tracker.changedFiles()).toEqual([
      { path: "Catalogs/Товары.xml", change: "deleted" },
      { path: "Catalogs/Товары/Ext.xml", change: "deleted" },
    ])
  })

  it("keeps manifest addFile behavior independent from change reporting", async () => {
    const root = tempDir()
    const tracker = createXmlChangeTracker(root)

    tracker.manifest.addFile(join(root, "ConfigDumpInfo.xml"))

    expect(tracker.changedFiles()).toEqual([])
  })
})
