export type MetadataRootName =
  | "Constant"
  | "Catalog"
  | "Document"
  | "Enum"
  | "DefinedType"
  | "Characteristic"
  | "CommandGroup"
  | "Role"
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
  | "DocumentNumerator"
  | "CommonCommand"
  | "CommonPicture"
  | "CommonTemplate"
  | "CommonModule"
  | "CommonAttribute"
  | "CommonForm"
  | "FilterCriterion"
  | "ScheduledJob"
  | "IntegrationService"
  | "Language"
  | "Style"
  | "StyleItem"
  | "FunctionalOption"
  | "FunctionalOptionParameter"
  | "DocumentJournal"
  | "HTTPService"
  | "WebSocketClient"
  | "WebService"
  | "Bot"
  | "ExternalDataSource"
  | "SessionParameter"
  | "SettingsStorage"
  | "Subsystem"

export type MetadataMemberKind =
  | "Attribute"
  | "StandardAttribute"
  | "TabularSection"
  | "Dimension"
  | "Resource"
  | "Form"
  | "Template"
  | "Command"

export type MetadataFieldKind = Extract<
  MetadataMemberKind,
  "Attribute" | "StandardAttribute" | "TabularSection" | "Dimension" | "Resource"
>
export type MetadataValueKind = "predefinedValue" | "enumValue" | "emptyRef"
export type MetadataTypeFilterValue = "string" | "decimal" | "dateTime" | "boolean" | "ValueStorage" | "UUID"
export type StyleItemTargetType = "Color" | "Font" | "Border"

export type MetadataTargetFilter =
  | { kind: "directMember" }
  | { kind: "hasType"; type: MetadataTypeFilterValue }
  | { kind: "styleItemType"; values: readonly StyleItemTargetType[] }
  | { kind: "stringIndexedAttribute" }

export interface MetadataTargetOwner {
  root: MetadataRootName
  objectName: string
}

export interface ObjectTargetConstraint {
  kind: "object"
  roots?: readonly MetadataRootName[]
  scope?: "project" | "owner"
  allowNested?: boolean
  filters?: readonly MetadataTargetFilter[]
}

export interface MemberTargetConstraint {
  kind: "member"
  owner: "this" | "explicit"
  roots?: readonly MetadataRootName[]
  memberKinds?: readonly MetadataMemberKind[]
  filters?: readonly MetadataTargetFilter[]
  allowOwner?: boolean
}

export interface ValueTargetConstraint {
  kind: "value"
  roots?: readonly MetadataRootName[]
  valueKinds?: readonly MetadataValueKind[]
  allowEmptyRef?: boolean
}

export interface TypeTargetConstraint {
  kind: "type"
  roots?: readonly MetadataRootName[]
  typeKinds?: readonly ("ref" | "object" | "primitive")[]
  primitives?: readonly ("string" | "decimal" | "dateTime" | "boolean" | "ValueStorage")[]
}

export interface DataPathTargetConstraint {
  kind: "dataPath"
  context: "form"
  allowedKinds?: readonly string[]
  allowComposite?: boolean
}

export type MetadataTargetConstraint =
  | ObjectTargetConstraint
  | MemberTargetConstraint
  | ValueTargetConstraint
  | TypeTargetConstraint
  | DataPathTargetConstraint

export type ParsedMetadataTarget =
  | { kind: "object"; root: MetadataRootName; objectName: string; segments?: MetadataObjectSegment[] }
  | { kind: "member"; root: MetadataRootName; objectName: string; segments: MetadataMemberSegment[] }
  | { kind: "value"; root: MetadataRootName; objectName: string; valueKind: "predefinedValue"; valueName: string }
  | { kind: "value"; root: MetadataRootName; objectName: string; valueKind: "enumValue"; valueName: string }
  | { kind: "value"; root: MetadataRootName; objectName: string; valueKind: "emptyRef" }

export interface MetadataMemberSegment {
  kind: MetadataMemberKind
  name: string
}

export interface MetadataObjectSegment {
  root: MetadataRootName
  objectName: string
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
