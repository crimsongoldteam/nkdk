import { ConfigurationContext } from "~/metadata/context/types"
import { LabelField } from "~/metadata/forms/elements/labelField/types"
import { exportElementToXML, registerMetadata } from "~/metadata/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"

export function exportLabelFieldToXML<From extends LabelField | undefined>(
  context: ConfigurationContext,
  data: From
): ToXMLType<From> {
  return exportElementToXML(context, "LabelField", data) as ToXMLType<From>
}

registerMetadata("ExportToXML", "LabelField", exportLabelFieldToXML as ExportToXMLFn)
