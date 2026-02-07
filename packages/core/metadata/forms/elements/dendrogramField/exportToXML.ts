import { ConfigurationContext } from "~/metadata/context/types"
import { DendrogramField } from "~/metadata/forms/elements/dendrogramField/types"
import { exportElementToXML, registerMetadata } from "~/metadata/metadataFactory"
import { ToXMLType } from "~/metadata/metadataFactory/types"

export function exportDendrogramFieldToXML<From extends DendrogramField | undefined>(
  context: ConfigurationContext,
  _rule: any,
  data: From
): ToXMLType<From> {
  return exportElementToXML(context, "DendrogramField", data as any) as unknown as ToXMLType<From>
}

registerMetadata("ExportToXML", "DendrogramField", exportDendrogramFieldToXML as any)
