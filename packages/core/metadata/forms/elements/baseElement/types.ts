export interface BaseElement {
  elementType: any
}

export interface NamedElement extends BaseElement {
  name: string
  // events?: {}
}

export interface BaseElementXML {
  _name: string
  _id: string
}

export interface BaseElementPropsEnterprise {}
