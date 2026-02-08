import { ConfigurationContext } from "~/metadata/context/types"
import { ChartField } from "~/metadata/forms/elements/chartField/types"
import { importElementFromXML, registerMetadata } from "~/metadata/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export function importChartFieldFromXML<To extends ChartField | undefined>(
  context: ConfigurationContext,
  xml: ElementXML | undefined
): To {
  return importElementFromXML<ChartField>(context, FormElementType.ChartField, xml) as To
}

registerMetadata("ImportFromXML", "ChartField", importChartFieldFromXML as any)
