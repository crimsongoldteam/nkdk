import { exportMetadataItemToXML, importMetadataItemFromXML, MetadataItemRule } from "../../metadata/orchestration"
import { mockContextFromXML, mockContextToXML } from "../mockContext"
import { readAndParseXMLFixture, readXMLFixtureAsString } from "../readFixtureXML"
import { xmlExport } from "../../xml/export/exporter"

type Params<T> = {
  rule: MetadataItemRule
  importMetaUrl: string
  fixture: string
  data: T
  referenceData?: T
}

export const testExportAppliedObjectToXML = <T>(params: Params<T>): { result: string; expected: string } => {
  const { rule, importMetaUrl, fixture, data } = params

  let referenceData = params.referenceData
  if (referenceData === undefined) {
    const parsed = readAndParseXMLFixture<{ MetaDataObject: unknown }>(importMetaUrl, fixture)
    referenceData = importMetadataItemFromXML({
      context: mockContextFromXML({ forReference: true }),
      rule,
      xml: parsed.MetaDataObject,
    }) as T | undefined
  }

  const xmlData = exportMetadataItemToXML({
    context: mockContextToXML(),
    data: data as never,
    referenceData: referenceData as never,
    rule,
  })

  const result = xmlExport(xmlData!)
  const expected = readXMLFixtureAsString(importMetaUrl, fixture)

  return { result, expected }
}
