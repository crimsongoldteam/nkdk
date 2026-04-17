import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { getXMLFixturePath, readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { shortRoundTripXML } from "./shortRoundTripXML"

describe("shortRoundTripXML", () => {
  const inputDir = getXMLFixturePath("sync/syncConfiguration/xml")
  const outputDir = getXMLFixturePath("sync/syncConfiguration/out-round-trip")

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  // TODO: снять it.skip после починки round-trip багов через scripts/round-trip-plan.sh
  it("round-trip XML → модель → XML должен быть идемпотентным", async () => {
    await shortRoundTripXML({ inputDir, outputDir })

    const expectedCatalogXML = readXMLFileAsString("sync/syncConfiguration/xml/Catalogs/Контрагенты.xml")
    const resultCatalogXML = fs.readFileSync(join(outputDir, "Catalogs", "Контрагенты.xml"), "utf-8")
    expect(resultCatalogXML).toBe(expectedCatalogXML)

    const expectedFormXML = readXMLFileAsString(
      "sync/syncConfiguration/xml/Catalogs/Контрагенты/Forms/ФормаЭлемента/Ext/Form.xml"
    )
    const resultFormXML = fs.readFileSync(
      join(outputDir, "Catalogs", "Контрагенты", "Forms", "ФормаЭлемента", "Ext", "Form.xml"),
      "utf-8"
    )
    expect(resultFormXML).toBe(expectedFormXML)

    const expectedFormMetaXML = readXMLFileAsString(
      "sync/syncConfiguration/xml/Catalogs/Контрагенты/Forms/ФормаЭлемента.xml"
    )
    const resultFormMetaXML = fs.readFileSync(
      join(outputDir, "Catalogs", "Контрагенты", "Forms", "ФормаЭлемента.xml"),
      "utf-8"
    )
    expect(resultFormMetaXML).toBe(expectedFormMetaXML)
  })
})
