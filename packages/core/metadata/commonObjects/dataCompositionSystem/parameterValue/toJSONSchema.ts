import { TSchema, Type } from "typebox"
import { I8nTextJSONSchema } from "../../i8nText/types"
import type { ConfigurationContext } from "../../../context/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../../orchestration"
import { exportSystemEnumerationToJSONSchema } from "../../../systemEnumerations/toJSONSchema"
import type { SystemEnumerationPropertyRule, SystemEnumerationTypeMap } from "../../../systemEnumerations/types"
import { exportDcsMetadataValueToJSONSchema } from "../dcsMetadataValue/toJSONSchema"
import type { DcsMetadataValuePropertyRule } from "../dcsMetadataValue/types"
import { toDcsMetadataValueRule } from "./dcsValueRule"
import type { SettingsParameterValuePropertyRule } from "./types"

const EmptyObjectJSONSchema = Type.Object({}, { maxProperties: 0 })
const unionOf = (schemas: TSchema[]): TSchema => {
  if (schemas.length === 0) return Type.Never()
  if (schemas.length === 1) return schemas[0]
  return Type.Union(schemas as [TSchema, TSchema, ...TSchema[]])
}

const intersectOf = (schemas: TSchema[]): TSchema => {
  if (schemas.length === 0) return Type.Unknown()
  if (schemas.length === 1) return schemas[0]
  return Type.Intersect(schemas as [TSchema, TSchema, ...TSchema[]])
}

const notSchema = (schema: TSchema): TSchema => ({ not: schema }) as TSchema

const wrapperKeys = [
  "Использовать",
  "Значение",
  "РежимОтображения",
  "ИдентификаторПользовательскойНастройки",
  "ПредставлениеПользовательскойНастройки",
  "Элементы",
] as const
const ObjectWithWrapperKeysJSONSchema = unionOf(
  wrapperKeys.map((key) =>
    Type.Object({
      [key]: Type.Unknown(),
    })
  )
)
const ObjectWithWrapperKeysExceptValueJSONSchema = unionOf(
  wrapperKeys
    .filter((key) => key !== "Значение")
    .map((key) =>
      Type.Object({
        [key]: Type.Unknown(),
      })
    )
)
const ObjectWithParameterKeyJSONSchema = Type.Object({
  Параметр: Type.Unknown(),
})
const ObjectWithTypeKeyJSONSchema = Type.Object({
  Тип: Type.Unknown(),
})

const rejectEmptyObject = (schema: TSchema): TSchema => Type.Intersect([schema, notSchema(EmptyObjectJSONSchema)])

const metadataValueObjectMarkerJSONSchema = (rule: SettingsParameterValuePropertyRule): TSchema | undefined => {
  if (rule.valueType !== "Field" && rule.valueType !== "Primitive") return undefined
  return Type.Object({
    Представление: Type.Unknown(),
  })
}

const fontObjectMarkerJSONSchema = (rule: SettingsParameterValuePropertyRule): TSchema | undefined => {
  if (rule.valueType !== "Font") return undefined
  return Type.Object({
    Вид: Type.Unknown(),
  })
}

const explicitDcsObjectMarkerJSONSchema = (rule: SettingsParameterValuePropertyRule): TSchema | undefined => {
  switch (rule.valueType) {
    case "Field":
      return Type.Object({
        Тип: unionOf([
          Type.Literal("Строка"),
          Type.Literal("СистемноеПеречисление"),
          Type.Literal("ВидСчета"),
          Type.Literal("ВидСравненияКомпоновкиДанных"),
        ]),
      })
    case "DesignTimeValue":
      return Type.Object({
        Тип: Type.Union([
          Type.Literal("Поле"),
          Type.Literal("ЗначениеВремениПроектирования"),
          Type.Literal("МногоязычнаяСтрока"),
          Type.Literal("МногоязычнаяФорматированнаяСтрока"),
        ]),
      })
    case "Primitive":
      return Type.Object({
        Тип: Type.Union([
          Type.Literal("СистемноеПеречисление"),
          Type.Literal("ВидСчета"),
          Type.Literal("ВидСравненияКомпоновкиДанных"),
        ]),
      })
    default:
      return undefined
  }
}

const rejectCompactObjectShapes = (schema: TSchema, settingsRule: SettingsParameterValuePropertyRule): TSchema => {
  type ValueObjectMarker = [TSchema | undefined, TSchema[]]
  type DefinedValueObjectMarker = [TSchema, TSchema[]]
  const compactShapeRejects: TSchema[] = [
    notSchema(ObjectWithWrapperKeysJSONSchema),
    ...(settingsRule.valueType === "Parameter" ? [] : [notSchema(ObjectWithParameterKeyJSONSchema)]),
    ...(settingsRule.valueType === "Parameter" ? [] : [notSchema(ObjectWithTypeKeyJSONSchema)]),
  ]
  const valueObjectShapeRejects: TSchema[] = [
    notSchema(ObjectWithWrapperKeysExceptValueJSONSchema),
    ...(settingsRule.valueType === "Parameter" ? [] : [notSchema(ObjectWithParameterKeyJSONSchema)]),
  ]
  const fontObjectShapeRejects: TSchema[] = [...valueObjectShapeRejects, notSchema(ObjectWithTypeKeyJSONSchema)]
  const valueObjectMarkerSchemas: DefinedValueObjectMarker[] = []
  const addMarker = (marker: ValueObjectMarker): void => {
    if (marker[0] !== undefined) valueObjectMarkerSchemas.push([marker[0], marker[1]])
  }
  addMarker([explicitDcsObjectMarkerJSONSchema(settingsRule), valueObjectShapeRejects])
  addMarker([metadataValueObjectMarkerJSONSchema(settingsRule), valueObjectShapeRejects])
  addMarker([fontObjectMarkerJSONSchema(settingsRule), fontObjectShapeRejects])
  const compactSchemas = [
    intersectOf([rejectEmptyObject(schema), ...compactShapeRejects]),
    ...valueObjectMarkerSchemas.map(([marker, rejects]) =>
      Type.Intersect([rejectEmptyObject(schema), marker, ...rejects])
    ),
  ]

  return unionOf(compactSchemas)
}

const requiredSystemEnumerationJSONSchema = <T extends keyof SystemEnumerationTypeMap>(
  context: ConfigurationContext,
  typeSE: T
): TSchema => {
  const rule = { type: "SystemEnumeration", typeSE } as SystemEnumerationPropertyRule<T>
  const schema = exportSystemEnumerationToJSONSchema({
    context,
    rule,
    value: undefined,
  })
  if (schema === undefined) {
    throw new Error(`SettingsParameterValue JSON Schema: schema for SystemEnumeration ${typeSE} is undefined`)
  }
  return schema
}

const requiredDcsMetadataValueJSONSchema = (
  context: ConfigurationContext,
  rule: DcsMetadataValuePropertyRule
): TSchema => {
  const schema = exportDcsMetadataValueToJSONSchema({
    context,
    rule,
    value: undefined,
  })
  if (schema === undefined) {
    throw new Error(`SettingsParameterValue JSON Schema: schema for DCS valueType ${rule.valueType} is undefined`)
  }
  return schema
}

const valueOrArrayJSONSchema = (valueSchema: TSchema, settingsRule: SettingsParameterValuePropertyRule): TSchema => {
  if (settingsRule.valueType === "ChoiceParameterLinks") return valueSchema
  return Type.Union([valueSchema, Type.Array(valueSchema)])
}

const optionalValueLessExplicitTypeJSONSchema = (
  settingsRule: SettingsParameterValuePropertyRule
): TSchema | undefined => {
  if (settingsRule.valueType !== "DesignTimeValue") return undefined
  return Type.Optional(
    Type.Union([Type.Literal("МногоязычнаяСтрока"), Type.Literal("МногоязычнаяФорматированнаяСтрока")])
  )
}

const explicitStringFieldWrapperJSONSchema = (
  settingsRule: SettingsParameterValuePropertyRule,
  viewModeSchema: TSchema,
  elementSchema: TSchema
): TSchema | undefined => {
  if (settingsRule.valueType !== "Field") return undefined
  return Type.Object(
    {
      Использовать: Type.Optional(Type.Literal("Ложь")),
      Тип: Type.Literal("Строка"),
      Значение: Type.String(),
      РежимОтображения: Type.Optional(viewModeSchema),
      ИдентификаторПользовательскойНастройки: Type.Optional(Type.String()),
      ПредставлениеПользовательскойНастройки: Type.Optional(I8nTextJSONSchema),
      Элементы: Type.Optional(Type.Array(elementSchema)),
    },
    { additionalProperties: false }
  )
}

const settingsParameterValueSchemaKey = (rule: SettingsParameterValuePropertyRule): string =>
  ["SettingsParameterValue", rule.valueType, rule.yaml].join("_").replace(/[^\p{L}\p{N}_]/gu, "_")

export const createSettingsParameterValueJSONSchema = (params: {
  context: ConfigurationContext
  rawValueSchema: TSchema
  rule: SettingsParameterValuePropertyRule
}): TSchema => {
  const { context, rawValueSchema, rule: settingsRule } = params
  const compactValueSchema = rejectCompactObjectShapes(rawValueSchema, settingsRule)
  const wrapperValueSchema = rejectEmptyObject(rawValueSchema)
  const valueOrArraySchema = valueOrArrayJSONSchema(wrapperValueSchema, settingsRule)
  const viewModeSchema = requiredSystemEnumerationJSONSchema(context, "DataCompositionSettingsItemViewMode")
  const optionalExplicitTypeSchema = optionalValueLessExplicitTypeJSONSchema(settingsRule)
  const schemaKey = settingsParameterValueSchemaKey(settingsRule)
  const self = Type.Ref(schemaKey)

  const schemas = [
    compactValueSchema,
    Type.Object(
      {
        Использовать: Type.Optional(Type.Literal("Ложь")),
        ...(optionalExplicitTypeSchema === undefined ? {} : { Тип: optionalExplicitTypeSchema }),
        Значение: Type.Optional(valueOrArraySchema),
        РежимОтображения: Type.Optional(viewModeSchema),
        ИдентификаторПользовательскойНастройки: Type.Optional(Type.String()),
        ПредставлениеПользовательскойНастройки: Type.Optional(I8nTextJSONSchema),
        Элементы: Type.Optional(Type.Array(self)),
      },
      { additionalProperties: false, minProperties: 1 }
    ),
    explicitStringFieldWrapperJSONSchema(settingsRule, viewModeSchema, self),
  ].filter((schema): schema is TSchema => schema !== undefined)

  return Type.Cyclic(
    {
      [schemaKey]: unionOf(schemas),
    },
    schemaKey
  )
}

export const exportSettingsParameterValueToJSONSchema: ExportToJSONSchemaFn = ({ context, rule }): TSchema => {
  const settingsRule = rule as SettingsParameterValuePropertyRule
  const rawValueSchema = requiredDcsMetadataValueJSONSchema(context, toDcsMetadataValueRule(settingsRule))

  return createSettingsParameterValueJSONSchema({
    context,
    rawValueSchema,
    rule: settingsRule,
  })
}

registerTypeRule("SettingsParameterValue", "exportToJSONSchema", exportSettingsParameterValueToJSONSchema)
