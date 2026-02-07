import { ConfigurationContext } from "~/metadata/context/types"
import { Button } from "~/metadata/forms/elements/button/types"
import { exportElementToXML, registerMetadata } from "~/metadata/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function exportButtonToXML<From extends Button | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToXMLType<From> {
  return exportElementToXML(context, "Button", data) as ToXMLType<From>
}

registerMetadata("ExportToXML", "Button", exportButtonToXML as ExportToXMLFn)
