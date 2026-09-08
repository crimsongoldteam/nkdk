import type { ConfigurationContextWithExportToXML, ContextElementToXML } from "@nkdk/runtime"
import { exportPropertyToYAML } from "../../metadata/ruleRuntime"
import type { MetadataItemRule, PropertyRule } from "../../metadata/ruleRuntime"
import { xmlExport } from "@nkdk/runtime"
import {
  createDirectRoundTripContexts,
  directPropertyRuleExecution,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
  withDirectMetadataExecution,
} from "../directConversion"
import { mockContext, mockContextToXML } from "../mockContext"
import { readXMLFileAsString } from "../readAndParseXMLFile"
import { readXMLFixtureAsString } from "../readFixtureXML"
import { createXmlAnomalyAnnotations } from "@nkdk/runtime"
import { readPropertyXML } from "../structuralXML"

type Params = {
  rule: PropertyRule
  value: unknown
  yaml?: unknown
  xmlRootTag?: string
  exportXmlDataAsRoot?: boolean
  itemsTree?: ContextElementToXML[]
  metadataItem?: unknown
  referenceMetadata?: unknown
  importMetaUrl?: string
  path?: string
  xmlString?: string
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
  return withDirectMetadataExecution(() => {
  const expectedResult =
    params.xmlString !== undefined
      ? params.xmlString.trimEnd()
      : params.path === undefined
        ? undefined
        : (params.importMetaUrl
            ? readXMLFixtureAsString(params.importMetaUrl, params.path)
            : readXMLFileAsString(params.path)
          ).trimEnd()
  const effectiveRootTag = params.xmlRootTag ?? params.rule.xml
  const referenceValue =
    expectedResult === undefined || effectiveRootTag === undefined ? undefined
      : readPropertyXML({ xmlString: expectedResult, xmlRootTag: effectiveRootTag })
  const yamlKey = params.rule.yaml ?? "Значение"
  const propertyRule = { ...params.rule, xml: "Value", yaml: yamlKey }
  const importedFromXML =
    referenceValue === undefined
      ? undefined
      : testPropertyFromXMLToYAML({
          context: createDirectRoundTripContexts({ logicalAddress: "Test.Item.Value" }).importContext,
          rule: {
            itemType: "DirectPropertyModelProbe",
            properties: { value: { ...params.rule, xml: "Value", yaml: params.rule.yaml ?? "Значение" } },
          } as MetadataItemRule,
          xml: { Value: referenceValue },
          annotations: createXmlAnomalyAnnotations(),
        }).yaml
  const yaml =
    "yaml" in params
      ? params.yaml === undefined
        ? undefined
        : { [yamlKey]: params.yaml }
      : importedFromXML !== undefined
        ? importedFromXML
        : exportPropertyToYAML({
            context: mockContext,
            rule: propertyRule,
            value: params.value,
            execution: directPropertyRuleExecution,
          })
  const rule = {
    itemType: "DirectPropertyModelProbe",
    properties: { value: propertyRule },
  } as MetadataItemRule
  const contexts = createDirectRoundTripContexts({ logicalAddress: "Test.Item.Value" })
  if (referenceValue !== undefined) {
    testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule,
      xml: { Value: referenceValue },
      annotations: createXmlAnomalyAnnotations(),
    })
  }
  const base = mockContextToXML()
  const contextBase: ConfigurationContextWithExportToXML = {
    ...base,
    exportToXML: {
      ...base.exportToXML,
      itemsTree: params.itemsTree ?? [],
      context: {
        forms: [],
        templates: [],
        parentName: "",
      },
    },
  }
  const context = contexts.exportContext(contextBase)
  const converted = testPropertyFromYAMLToXML({
    context,
    rule,
    yaml,
    referenceXML: referenceValue === undefined ? undefined : { Value: referenceValue },
  })
  const xmlData = converted.xml.Value
  if (xmlData === undefined) return { expectedResult, result: "" }
  const xmlDataIsRoot =
    xmlData !== null &&
    typeof xmlData === "object" &&
    !Array.isArray(xmlData) &&
    effectiveRootTag !== undefined &&
    Object.prototype.hasOwnProperty.call(xmlData, effectiveRootTag)
  const result =
    params.exportXmlDataAsRoot === true || xmlDataIsRoot
      ? xmlExport(xmlData as Record<string, unknown>, false)
      : xmlExport({ [effectiveRootTag as string]: xmlData }, false)

    return { expectedResult, result }
  })
}
