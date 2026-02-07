import { ConfigurationContext } from "~/metadata/context/types"
import { ChartField } from "~/metadata/forms/elements/chartField/types"
import { exportElementToXML, registerMetadata } from "~/metadata/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"

export function exportChartFieldToXML<From extends ChartField | undefined>(
  context: ConfigurationContext,
  data: From
): ToXMLType<From> {
  return exportElementToXML(context, "ChartField", data) as ToXMLType<From>
}

registerMetadata("ExportToXML", "ChartField", exportChartFieldToXML as ExportToXMLFn)
