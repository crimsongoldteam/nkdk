import { FormElementType, SingleFormElementType } from "~/metadata/metadataFactory"
import { MetadataItem } from "~/metadata/orchestration/property/types"

export type FormElementTypeAll = FormElementType | SingleFormElementType

export interface BaseElement extends MetadataItem {
  itemType: FormElementTypeAll
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
