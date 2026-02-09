export interface BaseElement {
  elementType: any
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
