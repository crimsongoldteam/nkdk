import { ConfigurationContext } from "~/metadata/context/types"
import { ButtonGroup } from "./types"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToXMLFn, FormElementType, ToXMLType } from "~/metadata/metadataFactory/types"

export function exportButtonGroupToXML<From extends ButtonGroup | undefined>(
  context: ConfigurationContext,
  data: From
): ToXMLType<From> {
  return exportElementToXML(context, FormElementType.ButtonGroup, data) as ToXMLType<From>
}

registerMetadata("ExportToXML", "ButtonGroup", exportButtonGroupToXML as ExportToXMLFn)
