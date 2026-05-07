import { Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule } from "~/metadata/orchestration/property/types"

export const DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD =
  "ПолеНабораДанныхСхемыКомпоновкиДанных"
export const DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FOLDER =
  "ПапкаПолейНабораДанныхСхемыКомпоновкиДанных"
export const DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_NESTED_DATA_SET =
  "ВложенныйНаборДанныхСхемыКомпоновкиДанных"

export const DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KINDS = [
  DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD,
  DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FOLDER,
  DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_NESTED_DATA_SET,
] as const

export type DataCompositionSchemaDataSetFieldKind =
  (typeof DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KINDS)[number]

const KIND_TO_XSI_TYPE: Record<DataCompositionSchemaDataSetFieldKind, string> = {
  [DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD]: "dcssch:DataSetFieldField",
  [DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FOLDER]: "dcssch:DataSetFieldFolder",
  [DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_NESTED_DATA_SET]: "dcssch:DataSetFieldNestedDataSet",
}

const XSI_TYPE_TO_KIND: Record<string, DataCompositionSchemaDataSetFieldKind> = Object.fromEntries(
  Object.entries(KIND_TO_XSI_TYPE).map(([kind, xsiType]) => [xsiType, kind])
) as Record<string, DataCompositionSchemaDataSetFieldKind>

export const dataCompositionSchemaDataSetFieldKindFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: unknown
): DataCompositionSchemaDataSetFieldKind => {
  if (value === undefined || value === null || value === "") {
    return DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD
  }

  if (typeof value !== "string" || XSI_TYPE_TO_KIND[value] === undefined) {
    throw new Error(`Unsupported DataCompositionSchemaDataSetField xsi:type: ${String(value)}`)
  }

  return XSI_TYPE_TO_KIND[value]
}

export const dataCompositionSchemaDataSetFieldKindToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: DataCompositionSchemaDataSetFieldKind | undefined
): string => {
  const kind = value ?? DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD
  const xsiType = KIND_TO_XSI_TYPE[kind]
  if (xsiType === undefined) {
    throw new Error(`Unsupported DataCompositionSchemaDataSetField kind: ${String(kind)}`)
  }
  return xsiType
}

export const dataCompositionSchemaDataSetFieldKindFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: unknown
): DataCompositionSchemaDataSetFieldKind => {
  if (value === undefined || value === null || value === "") {
    return DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD
  }

  if (typeof value !== "string" || !isDataCompositionSchemaDataSetFieldKind(value)) {
    throw new Error(`Unsupported DataCompositionSchemaDataSetField Вид: ${String(value)}`)
  }

  return value
}

export const dataCompositionSchemaDataSetFieldKindToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: DataCompositionSchemaDataSetFieldKind | undefined
): DataCompositionSchemaDataSetFieldKind => value ?? DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD

export const isDataCompositionSchemaDataSetFieldKind = (
  value: string
): value is DataCompositionSchemaDataSetFieldKind =>
  DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KINDS.includes(value as DataCompositionSchemaDataSetFieldKind)

export const getDataCompositionSchemaDataSetFieldKind = (
  item: { kind?: DataCompositionSchemaDataSetFieldKind } | undefined
): DataCompositionSchemaDataSetFieldKind => item?.kind ?? DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD

registerTypeRule("DataCompositionSchemaDataSetFieldKind", "importFromXML", dataCompositionSchemaDataSetFieldKindFromXML)
registerTypeRule("DataCompositionSchemaDataSetFieldKind", "exportToXML", dataCompositionSchemaDataSetFieldKindToXML)
registerTypeRule("DataCompositionSchemaDataSetFieldKind", "importFromYAML", dataCompositionSchemaDataSetFieldKindFromYAML)
registerTypeRule("DataCompositionSchemaDataSetFieldKind", "exportToYAML", dataCompositionSchemaDataSetFieldKindToYAML)
registerTypeRule("DataCompositionSchemaDataSetFieldKind", "exportToJSONSchema", () =>
  Type.Union([
    Type.Literal(DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD),
    Type.Literal(DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FOLDER),
    Type.Literal(DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_NESTED_DATA_SET),
  ])
)
