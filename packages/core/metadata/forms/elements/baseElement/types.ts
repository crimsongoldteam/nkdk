import { FormElementType } from "../../../metadataFactory/types"

export interface BaseElement {
  elementType: FormElementType
}

export interface NamedElement extends BaseElement {
  name: string
}

export interface BaseElementXML {
  _name: string
  _id: string
}

export interface BaseElementPropsEnterprise {}
