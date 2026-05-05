import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { DcsMetadataTypedValueRegistry, DcsMetadataTypedValueTypeFromXML } from "./rules"
import { DcsMetadataTypedValue, DcsMetadataTypedValuePropertyRule, DcsMetadataTypedValueXML } from "./types"

const importSingle = (
  context: ConfigurationContextFromXML,
  rule: DcsMetadataTypedValuePropertyRule,
  xml: DcsMetadataTypedValueXML
): DcsMetadataTypedValue => {
  const type = DcsMetadataTypedValueTypeFromXML(xml["_xsi:type"])
  return DcsMetadataTypedValueRegistry[type].fromXML({ context, rule, xml })
}

export const importDcsMetadataTypedValueFromXML = (
  context: ConfigurationContextFromXML,
  rule: DcsMetadataTypedValuePropertyRule,
  xml: DcsMetadataTypedValueXML | DcsMetadataTypedValueXML[] | undefined
): DcsMetadataTypedValue | DcsMetadataTypedValue[] | undefined => {
  if (xml === undefined) return undefined
  if (Array.isArray(xml)) return xml.map((item) => importSingle(context, rule, item))
  return importSingle(context, rule, xml)
}

const importDcsMetadataTypedValueFromXMLForRule = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule,
  value: unknown
): DcsMetadataTypedValue | DcsMetadataTypedValue[] | undefined =>
  importDcsMetadataTypedValueFromXML(
    context,
    rule as DcsMetadataTypedValuePropertyRule,
    value as DcsMetadataTypedValueXML | DcsMetadataTypedValueXML[]
  )

registerTypeRule("DcsMetadataTypedValue", "importFromXML", importDcsMetadataTypedValueFromXMLForRule)
