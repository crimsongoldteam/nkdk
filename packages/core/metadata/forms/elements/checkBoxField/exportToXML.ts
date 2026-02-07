import { ConfigurationContext } from "~/metadata/context/types"
import { CheckBoxField } from "~/metadata/forms/elements/checkBoxField/types"
import { exportElementToXML, registerMetadata } from "~/metadata/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function exportCheckBoxFieldToXML<From extends CheckBoxField | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToXMLType<From> {
  return exportElementToXML(context, "CheckBoxField", data) as ToXMLType<From>
}

registerMetadata("ExportToXML", "CheckBoxField", exportCheckBoxFieldToXML as ExportToXMLFn)
