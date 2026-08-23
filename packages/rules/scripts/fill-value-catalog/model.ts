import type {
  FillValueClassification,
  FillValueTypedValue,
} from "@nkdk/runtime/rule-kit"

export type FillValueForm =
  | "absent"
  | "nil"
  | "typedEmpty"
  | "typedText"
  | "untypedEmpty"
  | "untypedText"

export type ValueCategory =
  | "absent"
  | "xmlEmpty"
  | "initial"
  | "explicit"
  | "emptyRef"
  | "predefinedRef"
  | "enumValue"
  | "concreteRef"
  | "invalid"
  | "unparsed"

export interface RawFillValue {
  readonly form: FillValueForm
  readonly xsiType?: string
  readonly text?: string
}

export type NormalizedTypeAlternative =
  | {
      readonly kind: "string"
      readonly length?: number
      readonly allowedLength?: "Variable" | "Fixed"
    }
  | {
      readonly kind: "number"
      readonly digits?: number
      readonly fractionDigits?: number
      readonly allowedSign?: "Any" | "Nonnegative"
    }
  | { readonly kind: "boolean" }
  | { readonly kind: "dateTime"; readonly dateFractions: "Date" | "Time" | "DateTime" }
  | { readonly kind: "reference"; readonly roots: readonly string[]; readonly objectName?: string }

export interface NormalizedType {
  readonly source: "xml" | "rules" | "unresolved"
  readonly sourceType?: unknown
  readonly family:
    | "string"
    | "number"
    | "boolean"
    | "dateTime"
    | "reference"
    | "composite"
    | "unresolved"
  readonly signature: string
  readonly alternatives: readonly NormalizedTypeAlternative[]
  readonly reason?: string
}

export type RulesClassificationKind =
  | "explicit"
  | "implicit"
  | "invalid"
  | "unresolved"
  | "notSpecified"

export interface RulesEvidence {
  readonly declaration?: unknown
  readonly ownerProperties?: Readonly<Record<string, unknown>>
}

export interface FillValueObservation {
  readonly configuration: string
  readonly file: string
  readonly ownerKind: string
  readonly ownerName?: string
  readonly attributeKind: "ordinary" | "standard"
  readonly attributeName: string
  readonly itemKind: string
  readonly type: NormalizedType
  readonly raw: RawFillValue
  readonly typedValue?: FillValueTypedValue
  readonly valueCategory: ValueCategory
  readonly rulesClassification: RulesClassificationKind
  readonly rulesReason?: string
  readonly rulesEvidence?: RulesEvidence
}

export interface UnresolvedXmlObservation {
  readonly configuration: string
  readonly file: string
  readonly element: string
  readonly reason: string
}

export function stableRulesClassification(classification: FillValueClassification): {
  readonly kind: RulesClassificationKind
  readonly reason?: string
} {
  switch (classification.kind) {
    case "valid": return { kind: "explicit" }
    case "implicit": return { kind: "implicit" }
    case "invalid": return { kind: "invalid", reason: classification.reason }
    case "unresolved": return { kind: "unresolved", reason: classification.reason }
    case "notSpecified": return { kind: "notSpecified" }
  }
}
