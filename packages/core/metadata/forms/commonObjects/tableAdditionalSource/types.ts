import { registerTypeRule } from "~/metadata/metadataFactory"
import { exportChildItemsToXML } from "../../collections/childItems/exportToXML"

export type TableAdditionalSourceTypes = "SearchStringRepresentation" | "SearchControl" | "ViewStatusRepresentation"

export interface TableAdditionalSourceXML {
  Item: string
  Type: TableAdditionalSourceTypes
}

registerTypeRule("ChildItems", "exportToXML", exportChildItemsToXML as any)
