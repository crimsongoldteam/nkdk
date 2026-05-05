import { ConfigurationContext } from "~/metadata/context/types"
import { exportI8nTextToXML } from "../../i8nText/toXML"
import { exportMetadataValueToXML } from "../toXML"
import {
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueXML,
  MetadataTypedValue,
  MetadataValuePropertyRule,
} from "../types"

export const exportFormChoiceListToXML = (
  context: ConfigurationContext,
  data: MetadataFormChoiceListValue
): MetadataFormChoiceListValueXML => {
  const rule: MetadataValuePropertyRule = { type: "MetadataValue", exportNilValue: true }
  const value = exportMetadataValueToXML({ context, rule, value: data.value as MetadataTypedValue | undefined })
  const valueXML: any = value ?? { "_xsi:nil": true }
  return {
    "_xsi:type": "FormChoiceListDesTimeValue",
    Presentation: exportI8nTextToXML(context, { type: "I8nText" }, data.presentation) ?? {},
    Value: valueXML,
  } as MetadataFormChoiceListValueXML
}
