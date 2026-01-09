import { FormElementType } from "../../../metadataFactory/types"

export interface BaseElement {
  elementType: FormElementType
  name: string
}

export interface BaseElementXML {
  _name: string
  _id: string
}

export interface BaseElementEnterprise {}
