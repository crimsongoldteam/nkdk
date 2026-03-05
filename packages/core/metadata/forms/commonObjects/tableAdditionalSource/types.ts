export type TableAdditionalSourceTypes = "SearchStringRepresentation" | "SearchControl" | "ViewStatusRepresentation"

export interface TableAdditionalSourceXML {
  Item: string
  Type: TableAdditionalSourceTypes
}
