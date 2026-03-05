import { ExtendedFormElementType, MetadataItem } from "~/metadata/orchestration"

export interface BaseElement extends MetadataItem {
  itemType: ExtendedFormElementType
}

export interface NamedElement extends BaseElement {
  name: string
}

export interface EventedElement extends NamedElement {
  events?: Record<string, string>
}

export interface BaseElementXML {
  _name: string
  _id: string
}

export interface BaseElementPropsYAML {}

export interface EventedElementYAML {
  События?: {}
}
