import type { MetadataRootName } from "../metadataTargets/types"

export type {
  DefinedTypeLookup,
  FillValueAlternative,
  FillValueClassification,
  FillValueEffectiveType,
  FillValueTypedValue,
} from "../../ruleRuntime/property/fillValueSemantics"

export interface FillValueReferenceTypeMapping {
  readonly root: MetadataRootName
}
