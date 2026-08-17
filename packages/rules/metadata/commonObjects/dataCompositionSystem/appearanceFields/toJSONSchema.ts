import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { TSchema, Type } from "typebox"
import { BooleanJSONSchema } from "../../boolean/types"
import { ColorJSONSchema } from "../../color/types"
import { I8nTextJSONSchema } from "../../i8nText/types"
import { ConfigurationContext } from "@nkdk/runtime"
import { ExportToJSONSchemaFn } from "../../../ruleRuntime"
import { schemaRef } from "../../../ruleRuntime/jsonSchemaRefs"
import { exportSystemEnumerationToJSONSchema } from "../../../systemEnumerations/toJSONSchema"
import {
  type SystemEnumerationPropertyRule,
  type SystemEnumerationTypeMap,
} from "../../../systemEnumerations/types"
import { createSettingsParameterValueJSONSchema } from "../parameterValue/toJSONSchema"
import type { SettingsParameterValuePropertyRule } from "../parameterValue/types"
import { AppearanceFieldsRules } from "./rules"

const Nullable = (schema: TSchema): TSchema => Type.Union([Type.Null(), schema])
const notSchema = (schema: TSchema): TSchema => ({ not: schema }) as TSchema
const AppearanceBooleanValueJSONSchema = Nullable(BooleanJSONSchema)

const LanguageMapJSONSchema = Type.Record(Type.String(), Type.String(), { additionalProperties: false })

const StrictFontJSONSchema = Type.Object(
  {
    Вид: Type.Optional(Type.String()),
    ВидXML: Type.Optional(Type.String()),
    Значение: Type.Optional(Type.String()),
    Имя: Type.Optional(Type.String()),
    Масштаб: Type.Optional(Type.Number()),
    Размер: Type.Optional(Type.Number()),
    Наклонный: Type.Optional(BooleanJSONSchema),
    Подчеркивание: Type.Optional(BooleanJSONSchema),
    Полужирный: Type.Optional(BooleanJSONSchema),
    Зачеркивание: Type.Optional(BooleanJSONSchema),
  },
  { additionalProperties: false }
)

const requiredSystemEnumerationJSONSchema = (
  context: ConfigurationContext,
  typeSE: keyof SystemEnumerationTypeMap
): TSchema => {
  const schema = exportSystemEnumerationToJSONSchema({
    context,
    rule: { type: "SystemEnumeration", typeSE } as SystemEnumerationPropertyRule,
    value: undefined,
  })
  if (schema === undefined) {
    throw new Error(`AppearanceFields JSON Schema: schema for SystemEnumeration ${typeSE} is undefined`)
  }
  return schema
}

const appearanceStringServiceProperties = (context: ConfigurationContext) => ({
  Использовать: Type.Optional(Type.Literal("Ложь")),
  РежимОтображения: Type.Optional(
    requiredSystemEnumerationJSONSchema(context, "DataCompositionSettingsItemViewMode")
  ),
  ИдентификаторПользовательскойНастройки: Type.Optional(Type.String()),
  ПредставлениеПользовательскойНастройки: Type.Optional(I8nTextJSONSchema),
})

const propertySchema = (
  context: ConfigurationContext,
  property: SettingsParameterValuePropertyRule,
  rawValueSchema: (context: ConfigurationContext) => TSchema
): TSchema => {
  const useExternalRefs = context.exportToJSONSchema?.mode === "externalRefs"
  const schema = useExternalRefs
    ? schemaRef(ensureAppearanceSettingsParameterValueJSONSchema(context, property, rawValueSchema))
    : createSettingsParameterValueJSONSchema({
        context,
        rawValueSchema: rawValueSchema(context),
        rule: property,
      })

  return Type.Optional(schema)
}

const appearanceStringPropertySchema = (context: ConfigurationContext): TSchema => {
  const service = appearanceStringServiceProperties(context)
  return Type.Optional(
    Type.Union([
      Type.String(),
      Type.Object(
        {
          ...service,
          Значение: Type.Optional(Type.Union([Type.String(), LanguageMapJSONSchema, Type.Null()])),
        },
        { additionalProperties: false }
      ),
      Type.Object(
        { ...service, Тип: Type.Literal("Поле"), Значение: Type.String() },
        { additionalProperties: false }
      ),
      Type.Object(
        { ...service, Тип: Type.Literal("ФорматированнаяСтрока"), Значение: LanguageMapJSONSchema },
        { additionalProperties: false }
      ),
    ])
  )
}

function ensureAppearanceSettingsParameterValueJSONSchema(
  exportContext: ConfigurationContext,
  property: SettingsParameterValuePropertyRule,
  rawValueSchema: (context: ConfigurationContext) => TSchema
): string {
  const schemaName = appearanceSettingsParameterValueSchemaName(property)
  exportContext.exportToJSONSchema?.defineSchema?.(schemaName, ({ context }) =>
    createSettingsParameterValueJSONSchema({
      context,
      rawValueSchema: rawValueSchema(context),
      rule: property,
    })
  )
  return schemaName
}

function appearanceSettingsParameterValueSchemaName(property: SettingsParameterValuePropertyRule): string {
  return ["SettingsParameterValue", property.valueType, property.typeSE, "yaml", encodeAppearanceSchemaKeySegment(property.yaml)]
    .filter(Boolean)
    .join("/")
}

const encodeAppearanceSchemaKeySegment = (value: string | undefined): string | undefined =>
  value === undefined ? undefined : encodeURIComponent(value)

export const exportAppearanceFieldsToJSONSchema: ExportToJSONSchemaFn = ({ context }) => {
  const properties = AppearanceFieldsRules.properties

  return Type.Intersect([
    Type.Object(
      {
        ЦветФона: propertySchema(context, properties.ЦветФона, () => Nullable(ColorJSONSchema)),
        ЦветТекста: propertySchema(context, properties.ЦветТекста, () => Nullable(ColorJSONSchema)),
        Шрифт: propertySchema(context, properties.Шрифт, () => Nullable(StrictFontJSONSchema)),
        ГоризонтальноеПоложение: propertySchema(
          context,
          properties.ГоризонтальноеПоложение,
          (context) => Nullable(requiredSystemEnumerationJSONSchema(context, "HorizontalAlign"))
        ),
        Формат: appearanceStringPropertySchema(context),
        ВыделятьОтрицательные: propertySchema(
          context,
          properties.ВыделятьОтрицательные,
          () => AppearanceBooleanValueJSONSchema
        ),
        ОтметкаНезаполненного: propertySchema(
          context,
          properties.ОтметкаНезаполненного,
          () => AppearanceBooleanValueJSONSchema
        ),
        Текст: appearanceStringPropertySchema(context),
        Видимость: propertySchema(context, properties.Видимость, () => AppearanceBooleanValueJSONSchema),
        Доступность: propertySchema(context, properties.Доступность, () => AppearanceBooleanValueJSONSchema),
        ТолькоПросмотр: propertySchema(context, properties.ТолькоПросмотр, () => AppearanceBooleanValueJSONSchema),
        Отображать: propertySchema(context, properties.Отображать, () => AppearanceBooleanValueJSONSchema),
      },
      { additionalProperties: false }
    ),
    notSchema(
      Type.Union([
        Type.Object({ ЦветФона: Type.Undefined() }),
        Type.Object({ ЦветТекста: Type.Undefined() }),
      ])
    ),
  ])
}

export const metadataPropertyRule000 = definePropertyTypeRule("AppearanceFields", "exportToJSONSchema", exportAppearanceFieldsToJSONSchema)
