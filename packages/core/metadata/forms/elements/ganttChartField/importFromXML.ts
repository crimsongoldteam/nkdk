import { ConfigurationContext } from "~/metadata/context/types"
import { GanttChartField } from "~/metadata/forms/elements/ganttChartField/types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ElementXML, ImportFromXMLFn } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importGanttChartFieldFromXML<To extends GanttChartField | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ElementXML | undefined
): To {
  return importElementFromXML<GanttChartField>(context, "GanttChartField", xml) as To
}

registerMetadata("ImportFromXML", "GanttChartField", importGanttChartFieldFromXML as ImportFromXMLFn)
