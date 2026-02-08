import { ConfigurationContext } from "~/metadata/context/types"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ElementXML, ExportToXMLFn } from "~/metadata/metadataFactory/types"
import { ButtonGroup } from "./types"

export function exportButtonGroupToXML<From extends ButtonGroup | undefined>(
  context: ConfigurationContext,
  data: From
): ElementXML | undefined {
  return exportElementToXML(context, data)
}

registerMetadata("ExportToXML", "ButtonGroup", exportButtonGroupToXML as ExportToXMLFn)
