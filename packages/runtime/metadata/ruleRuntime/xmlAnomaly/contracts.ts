import type { XmlElementNode } from "../../../xml/import/document"

export type XmlAnomalyBoundary =
  | { readonly propertyType: string }
  | { readonly itemType: string; readonly propertyKey: string }

export interface XmlAnomalyLocation {
  readonly itemType: string
  readonly propertyKey: string
  readonly propertyType: string
}

export interface XmlCompactRawInput {
  readonly name: string
  readonly propertyPath: readonly string[]
}

export interface XmlCompactRawRegistration {
  readonly kind: "compactRaw"
  readonly boundary: XmlAnomalyBoundary
  readonly inputs: readonly XmlCompactRawInput[]
  readonly generate: (
    inputs: Readonly<Record<string, unknown>>,
  ) => readonly XmlElementNode[]
}

export interface XmlImportantRegistration {
  readonly kind: "important"
  readonly boundary: XmlAnomalyBoundary
}

export interface XmlHiddenSingletonNameRegistration {
  readonly kind: "hiddenSingletonName"
  readonly boundary: XmlAnomalyBoundary
}

export type XmlAnomalyRegistration =
  | XmlCompactRawRegistration
  | XmlImportantRegistration
  | XmlHiddenSingletonNameRegistration
