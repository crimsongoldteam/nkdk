import { exportPropertyToYAML } from "../../metadata/ruleRuntime"
import type { MetadataItemRule, PropertyRule } from "@nkdk/runtime/rule-kit"
import { testPropertyFromXMLToYAML, testPropertyFromYAMLToXML } from "../directConversion"
import { mockContext } from "../mockContext"
import { readPropertyXML } from "../structuralXML"

export const testExportPropertyModelThroughXMLToYAML = (params: {
  rule: PropertyRule
  value: unknown
  yaml?: unknown
  name?: string
  path?: string
  xmlString?: string
  xmlRootTag?: string
  importMetaUrl?: string
}): unknown => {
  const propertyRule = { ...params.rule, xml: "Value", yaml: params.rule.yaml ?? "Значение" }
  const rule = {
    itemType: "DirectPropertyModelProbe",
    properties: { value: propertyRule },
  } as MetadataItemRule
  if (params.path !== undefined || params.xmlString !== undefined) {
    const value = readPropertyXML({ ...params, xmlRootTag: params.xmlRootTag ?? params.rule.xml })
    return testPropertyFromXMLToYAML({
      rule,
      xml: { Value: value },
      name: params.name,
    }).yaml
  }
  const yaml =
    "yaml" in params
      ? params.yaml === undefined
        ? undefined
        : { [propertyRule.yaml]: params.yaml }
      : exportPropertyToYAML({
          context: mockContext,
          rule: propertyRule,
          value: params.value,
          name: params.name,
        })
  if (yaml === undefined) return undefined
  const xml = testPropertyFromYAMLToXML({
    rule,
    yaml,
    name: params.name,
  })

  return testPropertyFromXMLToYAML({
    rule,
    xml: xml.xml,
    name: params.name,
  }).yaml
}
import { registerCommonObjects } from "../../metadata/commonObjects"

registerCommonObjects()
