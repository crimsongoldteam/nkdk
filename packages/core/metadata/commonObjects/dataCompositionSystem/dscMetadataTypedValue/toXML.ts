import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { DcsMetadataTypedValueRegistry } from "./rules"
import { DcsMetadataTypedValue, DcsMetadataTypedValuePropertyRule, DcsMetadataTypedValueXML } from "./types"

const exportSingle = (
  context: ConfigurationContextWithExportToXML,
  rule: DcsMetadataTypedValuePropertyRule,
  value: DcsMetadataTypedValue
): DcsMetadataTypedValueXML =>
  DcsMetadataTypedValueRegistry[value.type].toXML({ context, rule, item: value })

export const exportDcsMetadataTypedValueToXML = (
  context: ConfigurationContextWithExportToXML,
  rule: DcsMetadataTypedValuePropertyRule,
  value: DcsMetadataTypedValue | DcsMetadataTypedValue[] | undefined
): DcsMetadataTypedValueXML | DcsMetadataTypedValueXML[] | undefined => {
  if (value === undefined) return undefined
  if (Array.isArray(value)) return value.map((item) => exportSingle(context, rule, item))
  return exportSingle(context, rule, value)
}

const exportDcsMetadataTypedValueToXMLForRule = (
  context: ConfigurationContextWithExportToXML,
  rule: PropertyRule,
  value: unknown
): DcsMetadataTypedValueXML | DcsMetadataTypedValueXML[] | undefined =>
  exportDcsMetadataTypedValueToXML(
    context,
    rule as DcsMetadataTypedValuePropertyRule,
    value as DcsMetadataTypedValue | DcsMetadataTypedValue[]
  )

registerTypeRule("DcsMetadataTypedValue", "exportToXML", exportDcsMetadataTypedValueToXMLForRule)
