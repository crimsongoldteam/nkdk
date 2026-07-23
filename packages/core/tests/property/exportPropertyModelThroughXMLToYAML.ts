import { callAtomicToXML } from "../../metadata/orchestration/property/fromYAMLToXML"
import type { MetadataItemRule, PropertyRule } from "../../metadata/orchestration/property/types"
import { testPropertyFromXMLToYAML } from "../directConversion"
import { mockContextToXML } from "../mockContext"

export const testExportPropertyModelThroughXMLToYAML = (params: {
  rule: PropertyRule
  value: unknown
  name?: string
}): unknown => {
  const propertyRule = { ...params.rule, xml: "Value", yaml: params.rule.yaml ?? "Значение" }
  const rule = {
    itemType: "DirectPropertyModelProbe",
    properties: { value: propertyRule },
  } as MetadataItemRule
  const xml = callAtomicToXML({
    context: mockContextToXML(),
    rule: propertyRule,
    value: params.value,
  })

  return testPropertyFromXMLToYAML({
    rule,
    xml: { Value: xml },
    name: params.name,
  }).yaml
}
