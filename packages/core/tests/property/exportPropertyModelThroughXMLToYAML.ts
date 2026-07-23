import { exportPropertyToYAML } from "../../metadata/orchestration"
import type { MetadataItemRule, PropertyRule } from "../../metadata/orchestration/property/types"
import { testPropertyFromXMLToYAML, testPropertyFromYAMLToXML } from "../directConversion"
import { mockContext } from "../mockContext"

export const testExportPropertyModelThroughXMLToYAML = (params: {
  rule: PropertyRule
  value: unknown
  yaml?: unknown
  name?: string
}): unknown => {
  const propertyRule = { ...params.rule, xml: "Value", yaml: params.rule.yaml ?? "Значение" }
  const rule = {
    itemType: "DirectPropertyModelProbe",
    properties: { value: propertyRule },
  } as MetadataItemRule
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
