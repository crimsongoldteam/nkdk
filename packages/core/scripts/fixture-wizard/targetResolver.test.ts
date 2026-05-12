import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { afterEach, describe, expect, it } from "vitest"
import { readXmlDirFromRules, resolveMetadataTarget } from "./targetResolver"

const tempRoots: string[] = []

async function createTempProject() {
  const projectRoot = await mkdtemp(join(tmpdir(), "fixture-wizard-"))
  tempRoots.push(projectRoot)
  return projectRoot
}

async function createMetadataItem(
  projectRoot: string,
  metadataItem: string,
  rulesSource?: string,
) {
  const itemDir = join(projectRoot, "packages/core/metadata/appliedObjects", metadataItem)
  await mkdir(join(itemDir, "__fixtures__/sync"), { recursive: true })

  if (rulesSource !== undefined) {
    await writeFile(join(itemDir, "rules.ts"), rulesSource, "utf-8")
  }

  return itemDir
}

describe("targetResolver", () => {
  afterEach(async () => {
    await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
  })

  it("читает xmlDir из rules.ts через синтаксическое дерево TypeScript", async () => {
    const projectRoot = await createTempProject()
    const itemDir = await createMetadataItem(
      projectRoot,
      "metadataCatalog",
      `export const MetadataCatalogRules = {
        itemType: "MetadataCatalog",
        xmlDir: "Catalogs",
      }`,
    )

    await expect(readXmlDirFromRules(itemDir)).resolves.toBe("Catalogs")
  })

  it("возвращает undefined, если rules.ts не содержит xmlDir", async () => {
    const projectRoot = await createTempProject()
    const itemDir = await createMetadataItem(
      projectRoot,
      "configDumpInfo",
      `export const ConfigDumpInfoRules = {
        itemType: "ConfigDumpInfo",
      }`,
    )

    await expect(readXmlDirFromRules(itemDir)).resolves.toBeUndefined()
  })

  it("разрешает целевой metadataItem в каталоги фикстур и синхронизации", async () => {
    const projectRoot = await createTempProject()
    const itemDir = await createMetadataItem(
      projectRoot,
      "metadataDocument",
      `export const MetadataDocumentRules = {
        xmlDir: "Documents",
      }`,
    )

    await expect(resolveMetadataTarget(projectRoot, "metadataDocument")).resolves.toEqual({
      metadataItem: "metadataDocument",
      itemDir,
      fixturesDir: join(itemDir, "__fixtures__"),
      syncXmlDir: join(itemDir, "__fixtures__/sync"),
      xmlDir: "Documents",
    })
  })

  it("сообщает доступные metadataItem, если целевой каталог не найден", async () => {
    const projectRoot = await createTempProject()
    await createMetadataItem(projectRoot, "metadataCatalog")
    await createMetadataItem(projectRoot, "metadataDocument")

    await expect(resolveMetadataTarget(projectRoot, "metadataUnknown")).rejects.toThrow(
      "metadataItem metadataUnknown не найден. Доступные: metadataCatalog, metadataDocument",
    )
  })
})
