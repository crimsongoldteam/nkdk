import { ConfigurationContext } from "~/metadata/context/types"
import { ButtonGroup } from "~/metadata/forms/elements/buttonGroup/types"
import { exportElementToXML, registerMetadata } from "~/metadata/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"

export function exportButtonGroupToXML<From extends ButtonGroup | undefined>(
  context: ConfigurationContext,
  data: From
): ToXMLType<From> {
  return exportElementToXML(context, "ButtonGroup", data) as ToXMLType<From>
}

registerMetadata("ExportToXML", "ButtonGroup", exportButtonGroupToXML as ExportToXMLFn)
