import { describe, expect, it } from "vitest"
import { exportMetadataItemToXML, importMetadataItemFromXML } from "~/metadata/orchestration"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { importContentFromXML } from "~/xml/import/importer"
import { xmlExport } from "~/xml/export/exporter"
import { MetadataConfigurationRules } from "./rules"
import type { MetadataConfiguration } from "./types"

const normalizeXML = (value: string) => value.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\n$/, "")

const importConfiguration = (source: string, forReference: boolean): MetadataConfiguration | undefined => {
  const parsed = importContentFromXML<{ MetaDataObject: unknown }>(source)
  return importMetadataItemFromXML({
    context: mockContextFromXML({ forReference }),
    rule: MetadataConfigurationRules,
    xml: parsed.MetaDataObject,
  }) as MetadataConfiguration | undefined
}

const roundTripConfigurationXML = (source: string): string => {
  const data = importConfiguration(source, false)
  const referenceData = importConfiguration(source, true)

  const exported = exportMetadataItemToXML({
    context: mockContextToXML(),
    data,
    referenceData,
    rule: MetadataConfigurationRules,
  })

  return xmlExport(exported!)
}

describe("root Configuration XML", () => {
  it("round-trip минимальной fixture через metadataItem", () => {
    const source = readXMLFileAsString("configuration/minimal.xml")
    const data = importConfiguration(source, false)

    expect(data).toMatchObject({
      itemType: "MetadataConfiguration",
      name: "Конфигурация",
    })

    expect(normalizeXML(roundTripConfigurationXML(source))).toBe(normalizeXML(source))
  })

  it("сохраняет неизвестные корневые XML-узлы из reference", () => {
    const source = readXMLFileAsString("configuration/full.xml")

    expect(normalizeXML(roundTripConfigurationXML(source))).toBe(normalizeXML(source))
  })
})
