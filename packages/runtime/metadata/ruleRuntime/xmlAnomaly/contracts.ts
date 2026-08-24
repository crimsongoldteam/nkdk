export type XmlAnomalyBoundary =
  | { readonly propertyType: string }
  | { readonly itemType: string; readonly propertyKey: string }

export interface XmlAnomalyLocation {
  readonly itemType: string
  readonly propertyKey: string
  readonly propertyType: string
}

export interface XmlImportantRegistration {
  readonly kind: "important"
  readonly boundary: XmlAnomalyBoundary
}

export type XmlAnomalyRegistration = XmlImportantRegistration
