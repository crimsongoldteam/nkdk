import { mkdtemp, mkdir, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { afterEach, describe, expect, it } from "vitest"
import { resolveMetadataTarget, resolveXmlDir } from "./targetResolver"

const tempRoots: string[] = []

async function createTempProject() {
  const projectRoot = await mkdtemp(join(tmpdir(), "fixture-wizard-"))
  tempRoots.push(projectRoot)
  return projectRoot
}

async function createMetadataItem(projectRoot: string, metadataItem: string) {
  const itemDir = join(projectRoot, "packages/rules/metadata/appliedObjects", metadataItem)
  await mkdir(join(itemDir, "__fixtures__/sync/xml"), { recursive: true })

  return itemDir
}

describe("targetResolver", () => {
  afterEach(async () => {
    await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
  })

  it("находит строковый xmlDir по имени каталога metadataItem", () => {
    expect(resolveXmlDir("metadataCatalog", [{ itemType: "MetadataCatalog", xmlDir: "Catalogs" }])).toBe(
      "Catalogs"
    )
  })

  it("возвращает undefined для неизвестного metadataItem", () => {
    expect(resolveXmlDir("metadataUnknown", [{ itemType: "MetadataCatalog", xmlDir: "Catalogs" }])).toBeUndefined()
  })

  it("возвращает undefined для правила без xmlDir", () => {
    expect(resolveXmlDir("metadataProbe", [{ itemType: "MetadataProbe" }])).toBeUndefined()
  })

  it("разрешает целевой metadataItem в каталоги фикстур и синхронизации", async () => {
    const projectRoot = await createTempProject()
    const itemDir = await createMetadataItem(projectRoot, "metadataDocument")

    await expect(resolveMetadataTarget(projectRoot, "metadataDocument")).resolves.toEqual({
      metadataItem: "metadataDocument",
      itemDir,
      fixturesDir: join(itemDir, "__fixtures__"),
      syncXmlDir: join(itemDir, "__fixtures__/sync/xml"),
      xmlDir: "Documents",
    })
  })

  it("сообщает доступные metadataItem, если целевой каталог не найден", async () => {
    const projectRoot = await createTempProject()
    await createMetadataItem(projectRoot, "metadataCatalog")
    await createMetadataItem(projectRoot, "metadataDocument")

    await expect(resolveMetadataTarget(projectRoot, "metadataUnknown")).rejects.toThrow(
      "metadataItem metadataUnknown не найден. Доступные: metadataCatalog, metadataDocument"
    )
  })
})
