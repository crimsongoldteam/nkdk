export type MetadataRootName =
  | "Catalog"
  | "Document"
  | "Enum"
  | "InformationRegister"
  | "AccumulationRegister"
  | "AccountingRegister"
  | "CalculationRegister"
  | "ExchangePlan"
  | "ChartOfAccounts"
  | "ChartOfCharacteristicTypes"
  | "ChartOfCalculationTypes"
  | "BusinessProcess"
  | "BusinessProcessRoutePoint"
  | "Task"
  | "DataProcessor"
  | "Report"
  | "CommonPicture"
  | "StyleItem"

export type MetadataFieldKind = "Attribute" | "StandardAttribute" | "TabularSection" | "Dimension" | "Resource"
export type MetadataValueKind = "predefinedValue" | "enumValue" | "emptyRef"
export type MetadataTargetFilterName = "stringIndexedAttribute"
export type StyleItemTargetType = "Color" | "Font" | "Border"

export type MetadataTargetConstraint =
  | { kind: "object"; roots?: readonly MetadataRootName[]; scope?: "project" | "owner" }
  | {
      kind: "field"
      owner: "this" | "explicit"
      roots?: readonly MetadataRootName[]
      fieldKinds?: readonly MetadataFieldKind[]
      filters?: readonly MetadataTargetFilterName[]
    }
  | {
      kind: "value"
      roots?: readonly MetadataRootName[]
      valueKinds?: readonly MetadataValueKind[]
      allowEmptyRef?: boolean
    }
  | {
      kind: "type"
      roots?: readonly MetadataRootName[]
      typeKinds?: readonly ("ref" | "object" | "primitive")[]
      primitives?: readonly ("string" | "decimal" | "dateTime" | "boolean" | "ValueStorage")[]
    }
  | { kind: "dataPath"; context: "form"; allowedKinds?: readonly string[]; allowComposite?: boolean }
  | { kind: "localChild"; owner: "this"; childKind: "Form" | "Template" }
  | { kind: "styleItem"; styleItemTypes: readonly StyleItemTargetType[] }
  | { kind: "commonPicture" }

export type ParsedMetadataTarget =
  | { kind: "object"; root: MetadataRootName; objectName: string }
  | { kind: "field"; root: MetadataRootName; objectName: string; segments: MetadataFieldSegment[] }
  | { kind: "value"; root: MetadataRootName; objectName: string; valueKind: MetadataValueKind; valueName?: string }
  | { kind: "styleItem"; name: string }
  | { kind: "commonPicture"; name: string }

export interface MetadataFieldSegment {
  kind: MetadataFieldKind
  name: string
}

export type MetadataTargetParseErrorCode =
  | "unknown-root"
  | "disallowed-root"
  | "unknown-segment"
  | "disallowed-kind"
  | "invalid-shape"

export type MetadataTargetParseResult =
  | { ok: true; canonical: string; target: ParsedMetadataTarget }
  | { ok: false; code: MetadataTargetParseErrorCode; message: string }
