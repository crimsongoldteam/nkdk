import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/exportElementToXML"
import { fullTabularSections, minimalTabularSections } from "~/tests/fixtures/metadataTabularSection/data"

describe("exportMetadataTabularSectionsToXML", () => {
  it("should export all possible properties", () => {
    const resultData = testExportPropertyToXML({
      rule: { type: "MetadataTabularSections" },
      value: fullTabularSections,
      xmlRootTag: "TabularSection",
      path: "metadataTabularSection/full.xml",
      itemsTree: [{ name: "Контрагенты", itemType: "MetadataCatalog", path: "Catalog.Контрагенты" }],
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export defaults", () => {
    const resultData = testExportPropertyToXML({
      rule: { type: "MetadataTabularSections" },
      value: minimalTabularSections,
      xmlRootTag: "TabularSection",
      path: "metadataTabularSection/defaults.xml",
      itemsTree: [{ name: "Контрагенты", itemType: "MetadataCatalog", path: "Catalog.Контрагенты" }],
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
