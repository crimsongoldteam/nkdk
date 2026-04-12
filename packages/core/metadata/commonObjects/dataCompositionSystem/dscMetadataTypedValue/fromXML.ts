import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { DcsMetadataTypedValueRegistry, DcsMetadataTypedValueTypeFromXML } from "./rules"
import { DcsMetadataTypedValue, DcsMetadataTypedValuePropertyRule, DcsMetadataTypedValueXML } from "./types"

export const importDcsMetadataTypedValueFromXML = (
  context: ConfigurationContextFromXML,
  rule: DcsMetadataTypedValuePropertyRule,
  xml: DcsMetadataTypedValueXML | undefined
): DcsMetadataTypedValue | undefined => {
  if (xml === undefined) return undefined

  const type = DcsMetadataTypedValueTypeFromXML(xml["_xsi:type"])
  return DcsMetadataTypedValueRegistry[type].fromXML({ context, rule, xml })
}

const importDcsMetadataTypedValueFromXMLForRule = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule,
  value: unknown
): DcsMetadataTypedValue | undefined =>
  importDcsMetadataTypedValueFromXML(
    context,
    rule as DcsMetadataTypedValuePropertyRule,
    value as DcsMetadataTypedValueXML
  )

registerTypeRule("DcsMetadataTypedValue", "importFromXML", importDcsMetadataTypedValueFromXMLForRule)
