import { describe, expect, it } from "vitest"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { full, minimal } from "~/tests/fixtures/metadataCatalog/data"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { readAndParseXMLFixture, readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { xmlExport } from "~/xml/export/exporter"
import { importMetadataCatalogFromXML } from "./fromXML"
import { exportMetadataCatalogToXML } from "./toXML"
import type { MetadataCatalogXML } from "./types"

const mockMetadataCatalogContext: ConfigurationContextWithExportToXML = {
  ...mockContextToXML(),
  context: {
    forms: [],
    templates: [],
    parentName: "СправочникПолный",
  },
}

const loadReference = (fixture: string) => {
  const parsed = readAndParseXMLFixture<{ MetaDataObject: MetadataCatalogXML }>(import.meta.url, fixture)
  return importMetadataCatalogFromXML(
    { ...mockContextFromXML(), fromXML: { forReference: true } },
    parsed.MetaDataObject
  )
}

// TODO: снять it.skip после закрытия оставшихся round-trip-проблем Catalog:
//   1. Characteristics: теряются TypesFilterField, TypesFilterValue, ValueField;
//      переставлены KeyField/ObjectField/TypeField
//   2. Attribute.FillValue: xsi:type="xs:string" вместо xsi:nil="true" для пустого
//   3. ChildObjects: Command выводится до TabularSection (ожидается после Template)
//   4. Command: поля в алфавитном порядке (нет order и коллекция без keyField)
//   5. ТЧ.Attribute: лишние FillFromFillingValue, FillValue xsi:type="xs:string",
//      Use ForItem
//   6. minimal.xml: лишний <ChildObjects/> когда детей нет
//   (issue #68 про StandardAttribute IsFolder↔Parent — закрыт)
describe("exportMetadataCatalogToXML", () => {
  it.skip("should export full.xml fixture", () => {
    const xmlData = exportMetadataCatalogToXML({
      context: mockMetadataCatalogContext,
      data: full,
      referenceData: loadReference("full.xml"),
    })

    const result = xmlExport({ MetaDataObject: xmlData })
    const expected = readXMLFixtureAsString(import.meta.url, "full.xml")

    expect(result).toEqual(expected)
  })

  it.skip("should export minimal.xml fixture", () => {
    const xmlData = exportMetadataCatalogToXML({
      context: mockMetadataCatalogContext,
      data: minimal,
      referenceData: loadReference("minimal.xml"),
    })

    const result = xmlExport({ MetaDataObject: xmlData })
    const expected = readXMLFixtureAsString(import.meta.url, "minimal.xml")

    expect(result).toEqual(expected)
  })
})
