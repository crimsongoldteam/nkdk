import type { ConfigurationContextWithExportToXML, ContextElementToXML } from "../../metadata/context/types"
import { exportPropertyToYAML } from "../../metadata/orchestration"
import type { ElementXML, MetadataItemRule, PropertyRule } from "../../metadata/orchestration"
import { xmlExport } from "../../xml/export/exporter"
import { testPropertyFromYAMLToXML } from "../directConversion"
import { mockContext, mockContextToXML } from "../mockContext"
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
  importMetaUrl?: string
  path?: string
}

export function testExportPropertyModelThroughYAMLToXML(params: Params & { path: string }): {
  expectedResult: string
  result: string
}
export function testExportPropertyModelThroughYAMLToXML(params: Params): {
  expectedResult: string | undefined
  result: string
}
export function testExportPropertyModelThroughYAMLToXML(params: Params): {
  expectedResult: string | undefined
  result: string
} {
  const expectedResult =
    params.path === undefined
      ? undefined
      : (
          params.importMetaUrl
            ? readXMLFixtureAsString(params.importMetaUrl, params.path)
            : readXMLFileAsString(params.path)
        ).trimEnd()
  const effectiveRootTag = params.xmlRootTag ?? params.rule.xml
  const referenceRoot =
    params.path === undefined || effectiveRootTag === undefined
      ? undefined
      : params.importMetaUrl
        ? readAndParseXMLFixture<Record<string, ElementXML>>(params.importMetaUrl, params.path)
        : readAndParseXMLFile<Record<string, ElementXML>>(params.path)
  const referenceValue =
    "referenceMetadata" in params ? params.referenceMetadata : referenceRoot?.[effectiveRootTag as string]
  const yamlKey = params.rule.yaml ?? "Значение"
  const propertyRule = { ...params.rule, xml: "Value", yaml: yamlKey }
  const yaml = exportPropertyToYAML({
    context: mockContext,
    rule: propertyRule,
    value: params.value,
  })
  const rule = {
    itemType: "DirectPropertyModelProbe",
    properties: { value: propertyRule },
  } as MetadataItemRule
  const base = mockContextToXML()
  const context: ConfigurationContextWithExportToXML = {
    ...base,
    exportToXML: {
      ...base.exportToXML,
      itemsTree: params.itemsTree ?? [],
      context: {
        forms: [],
        templates: [],
        parentName: "",
        metadataForNumbering: [],
      },
    },
  }
  const converted = testPropertyFromYAMLToXML({
    context,
    rule,
    yaml,
    referenceXML: { Value: referenceValue },
  })
  const xmlData = converted.xml.Value
  const result =
    params.exportXmlDataAsRoot === true
      ? xmlExport(xmlData as Record<string, unknown>, false)
      : xmlExport({ [effectiveRootTag as string]: xmlData }, false)

  return { expectedResult, result }
}
