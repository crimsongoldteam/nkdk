import { registerTypeRule } from "~/metadata/orchestration"
import { exportChildItemsToXML } from "../../commonObjects/childItems/toXML"

export type TableAdditionalSourceTypes = "SearchStringRepresentation" | "SearchControl" | "ViewStatusRepresentation"

export interface TableAdditionalSourceXML {
  Item: string
  Type: TableAdditionalSourceTypes
}

registerTypeRule("ChildItems", "exportToXML", exportChildItemsToXML as any)
