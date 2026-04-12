import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { DcsMetadataTypedValueRegistry } from "./rules"
import { DcsMetadataTypedValue, DcsMetadataTypedValuePropertyRule, DcsMetadataTypedValueXML } from "./types"

export const exportDcsMetadataTypedValueToXML = (
  context: ConfigurationContextWithExportToXML,
  rule: DcsMetadataTypedValuePropertyRule,
  value: DcsMetadataTypedValue | undefined
): DcsMetadataTypedValueXML | undefined => {
  if (value === undefined) return undefined
  return DcsMetadataTypedValueRegistry[value.type].toXML({ context, rule, item: value })
}

const exportDcsMetadataTypedValueToXMLForRule = (
  context: ConfigurationContextWithExportToXML,
  rule: PropertyRule,
  value: unknown
): DcsMetadataTypedValueXML | undefined =>
  exportDcsMetadataTypedValueToXML(
    context,
    rule as DcsMetadataTypedValuePropertyRule,
    value as DcsMetadataTypedValue
  )

registerTypeRule("DcsMetadataTypedValue", "exportToXML", exportDcsMetadataTypedValueToXMLForRule)
