import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { mockContextFromXML } from "~/tests/mockContext"
import { getXMLFixturePath } from "~/tests/readAndParseXMLFile"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"

describe("syncChildFormNamesFromXML (через convertAppliedObjectFromXML)", () => {
  const inputDir = getXMLFixturePath("sync/syncConfiguration/xml/Catalogs")
  const outputDir = getXMLFixturePath("sync/syncConfiguration/_tmp_form_hook_in")
  const name = "Контрагенты"

  beforeEach(() => {
    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true })
  })

  it("записывает Формы/<form>/Форма.yaml и Форма.nkdk для каталога", async () => {
    await convertAppliedObjectFromXML({
      rule: MetadataCatalogRules,
      context: mockContextFromXML(),
      inputDir,
      name,
      outputDir,
    })

    const yamlPath = join(outputDir, name, "Формы", "ФормаЭлемента", "Форма.yaml")
    const nkdkPath = join(outputDir, name, "Формы", "ФормаЭлемента", "Форма.nkdk")

    expect(fs.existsSync(yamlPath), `expected ${yamlPath}`).toBe(true)
    expect(fs.existsSync(nkdkPath), `expected ${nkdkPath}`).toBe(true)
  })
})
