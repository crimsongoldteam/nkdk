import { FormElementType } from "~/metadata/metadataFactory"
import { MetadataItem } from "~/metadata/metadataFactory/properties/types"

export interface BaseElement extends MetadataItem {
  itemType: FormElementType
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

export interface BaseElementPropsEnterprise {}

export interface EventedElementYAML {
  События?: {}
}
