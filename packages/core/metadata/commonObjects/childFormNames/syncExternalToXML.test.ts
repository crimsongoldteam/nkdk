import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { mockContextToXML } from "~/tests/mockContext"
import { getXMLFixturePath } from "~/tests/readAndParseXMLFile"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"

describe("syncChildFormNamesToXML (через syncAppliedObjectToXML)", () => {
  const inputDir = getXMLFixturePath("sync/syncConfiguration/nkdk/Справочник")
  const referenceDir = getXMLFixturePath("sync/syncConfiguration/xml/Catalogs")
  const outputDir = getXMLFixturePath("sync/syncConfiguration/_tmp_form_hook_out")
  const name = "Контрагенты"

  beforeEach(() => {
    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true })
  })

  it("записывает Forms/<form>.xml и Forms/<form>/Ext/Form.xml для каталога", async () => {
    await syncAppliedObjectToXML({
      rule: MetadataCatalogRules,
      context: mockContextToXML(),
      inputDir,
      name,
      outputDir,
      referenceDir,
    })

    const formMetadataPath = join(outputDir, name, "Forms", "ФормаЭлемента.xml")
    const formXmlPath = join(outputDir, name, "Forms", "ФормаЭлемента", "Ext", "Form.xml")

    expect(fs.existsSync(formMetadataPath), `expected ${formMetadataPath}`).toBe(true)
    expect(fs.existsSync(formXmlPath), `expected ${formXmlPath}`).toBe(true)

    fs.rmSync(outputDir, { recursive: true })
  })
})
