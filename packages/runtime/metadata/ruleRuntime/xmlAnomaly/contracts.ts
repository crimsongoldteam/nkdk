import type { XmlElementNode } from "../../../xml/import/document"

export type XmlAnomalyBoundary =
  | { readonly propertyType: string }
  | { readonly itemType: string; readonly propertyKey: string }

export interface XmlAnomalyLocation {
  readonly itemType: string
  readonly propertyKey: string
  readonly propertyType: string
}

export type XmlCompactRawScalar = null | boolean | number | string | bigint

export interface XmlCompactRawRecord {
  readonly [key: string]: XmlCompactRawValue
}

export type XmlCompactRawValue =
  | XmlCompactRawScalar
  | readonly XmlCompactRawValue[]
  | XmlCompactRawRecord

export type XmlCompactRawInputs = Readonly<Record<string, XmlCompactRawValue>>

export type XmlCompactRawInputSource =
  | {
      readonly kind: "yamlProperty"
      readonly propertyPath: readonly string[]
    }
  | {
      readonly kind: "owner"
      readonly projection: "itemType"
    }
  | {
      readonly kind: "propertyRule"
      readonly fieldPath: readonly string[]
    }
  | {
      readonly kind: "standardIndex"
      readonly index: string
      readonly keyInputs: readonly string[]
    }

export interface XmlCompactRawInput {
  readonly name: string
  readonly source: XmlCompactRawInputSource
}

export interface XmlCompactRawRegistration {
  readonly kind: "compactRaw"
  readonly boundary: XmlAnomalyBoundary
  readonly inputs: readonly XmlCompactRawInput[]
  readonly generate: (
    inputs: XmlCompactRawInputs,
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
