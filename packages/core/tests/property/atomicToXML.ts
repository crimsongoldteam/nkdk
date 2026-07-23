import type { ConfigurationContextWithExportToXML, ContextElementToXML } from "../../metadata/context/types"
import { callAtomicToXML } from "../../metadata/orchestration/property/fromYAMLToXML"
import { importPropertyFromXML, type ElementXML, type PropertyRule } from "../../metadata/orchestration"
import { xmlExport } from "../../xml/export/exporter"
import { mockContextFromXML, mockContextToXML } from "../mockContext"
import { readAndParseXMLFile, readXMLFileAsString } from "../readAndParseXMLFile"
import { readAndParseXMLFixture, readXMLFixtureAsString } from "../readFixtureXML"

type Params = {
  rule: PropertyRule
  value: unknown
  xmlRootTag?: string
  exportXmlDataAsRoot?: boolean
  itemsTree?: ContextElementToXML[]
  metadataItem?: unknown
  referenceMetadata?: unknown
}

export function testAtomicToXML(params: Params & { importMetaUrl?: string; path: string }): {
  expectedResult: string
  result: string
}
export function testAtomicToXML(params: Params): { expectedResult: undefined; result: string }
export function testAtomicToXML(params: Params & { importMetaUrl?: string; path?: string }): {
  expectedResult: string | undefined
  result: string
} {
  const { rule, value, xmlRootTag, path, importMetaUrl } = params
  let referenceProperty: unknown
  let expectedResult: string | undefined
  if (path !== undefined) {
    expectedResult = (importMetaUrl ? readXMLFixtureAsString(importMetaUrl, path) : readXMLFileAsString(path)).trimEnd()
    if (!("referenceMetadata" in params) && xmlRootTag !== undefined) {
      const referenceXMLData = importMetaUrl
        ? readAndParseXMLFixture<{ [key: string]: ElementXML }>(importMetaUrl, path)
        : readAndParseXMLFile<{ [key: string]: ElementXML }>(path)
      referenceProperty = importPropertyFromXML({
        context: mockContextFromXML({ forReference: true }),
        rule,
        value: referenceXMLData[xmlRootTag],
      })
    }
  }
  if ("referenceMetadata" in params) referenceProperty = params.referenceMetadata

  const context: ConfigurationContextWithExportToXML = {
    ...mockContextToXML(),
    exportToXML: {
      ...mockContextToXML().exportToXML,
      itemsTree: params.itemsTree ?? [],
      context: { forms: [], templates: [], parentName: "", metadataForNumbering: [] },
    },
  }
  const xml = callAtomicToXML({ context, rule, value, referenceValue: referenceProperty })
  const effectiveRootTag = xmlRootTag ?? (rule as { xml?: string }).xml
  const result =
    params.exportXmlDataAsRoot === true
      ? xmlExport(xml as Record<string, unknown>, false)
      : xmlExport({ [effectiveRootTag ?? "Value"]: xml }, false)
  return { expectedResult, result }
}
