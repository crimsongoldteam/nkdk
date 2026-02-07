import { ConfigurationContext } from "~/metadata/context/types"
import { InputField } from "~/metadata/forms/elements/inputField/types"
import { exportElementToXML, registerMetadata } from "~/metadata/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function exportInputFieldToXML<From extends InputField | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToXMLType<From> {
  return exportElementToXML(context, "InputField", data) as ToXMLType<From>
}

registerMetadata("ExportToXML", "InputField", exportInputFieldToXML as ExportToXMLFn)
