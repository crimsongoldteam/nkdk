import { ConfigurationContext } from "~/metadata/context/types"
import { CommandBar } from "~/metadata/forms/elements/commandBar/types"
import { exportElementToXML, registerMetadata } from "~/metadata/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"

export function exportCommandBarToXML<From extends CommandBar | undefined>(
  context: ConfigurationContext,
  data: From
): ToXMLType<From> {
  return exportElementToXML(context, "CommandBar", data) as ToXMLType<From>
}

registerMetadata("ExportToXML", "CommandBar", exportCommandBarToXML as ExportToXMLFn)
