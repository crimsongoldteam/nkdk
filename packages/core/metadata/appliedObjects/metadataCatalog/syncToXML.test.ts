import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { mockContextToXML } from "~/tests/mockContext"
import { getXMLFixturePath, readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { syncCatalogToXML } from "./syncToXML"

describe("sync MetadataCatalog to XML", () => {
  const inputDir = getXMLFixturePath("sync/syncCatalog/nkdk/Справочник")
  const referenceDir = getXMLFixturePath("sync/syncCatalog/xml/Catalogs")
  const outputDir = getXMLFixturePath("sync/syncCatalog/out")
  const catalogName = "Контрагенты"

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  it("should read catalog from YAML and export to XML file in output dir", async () => {
    await syncCatalogToXML({
      context: mockContextToXML(),
      inputDir,
      outputDir,
      referenceDir,
      catalogName,
    })

    const expectedMetadataXML = readXMLFileAsString(join("sync/syncCatalog/xml/Catalogs", `${catalogName}.xml`))
    const resultMetadataXML = readXMLFileAsString(join("sync/syncCatalog/out", "Catalogs", `${catalogName}.xml`))

    expect(resultMetadataXML).toBe(expectedMetadataXML)
  })
})
