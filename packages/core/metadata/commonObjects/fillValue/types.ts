import type { MetadataTargetConstraint, MetadataRootName } from "../metadataTargets/types"
import type { TypeDescriptionView } from "../../ruleRuntime/property/typeDescriptionView"

export type DefinedTypeLookup = (name: string) =>
  | { readonly status: "ok"; readonly type?: TypeDescriptionView }
  | { readonly status: "unresolved"; readonly reason: string }

export type FillValueAlternative =
  | { readonly kind: "string"; readonly length?: number; readonly allowedLength?: "Variable" | "Fixed" }
  | {
      readonly kind: "number"
      readonly digits?: number
      readonly fractionDigits?: number
      readonly allowedSign?: "Any" | "Nonnegative"
    }
  | { readonly kind: "boolean" }
  | { readonly kind: "dateTime"; readonly dateFractions: "Date" | "Time" | "DateTime" }
  | {
      readonly kind: "reference"
      readonly constraint: Extract<MetadataTargetConstraint, { kind: "value" }>
      readonly objectName?: string
    }

export type FillValueEffectiveType =
  | {
      readonly status: "known"
      readonly alternatives: readonly FillValueAlternative[]
      readonly composite: boolean
    }
  | { readonly status: "unresolved"; readonly reason: string }
  | { readonly status: "notSpecified" }

export type FillValueClassification =
  | { readonly kind: "valid" }
  | { readonly kind: "implicit" }
  | { readonly kind: "invalid"; readonly reason: string }
  | { readonly kind: "unresolved"; readonly reason: string }
  | { readonly kind: "notSpecified" }

export interface FillValueReferenceTypeMapping {
  readonly root: MetadataRootName
}
