import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { TSchema, Type } from "typebox"
import { BooleanJSONSchema } from "../../boolean/types"
import { ColorJSONSchema } from "../../color/types"
import { I8nTextJSONSchema } from "../../i8nText/types"
import { MetadataSingleValueJSONSchema } from "../../metadataValue/types"
import { ConfigurationContext } from "../../../context/types"
import { ExportToJSONSchemaFn } from "../../../ruleRuntime"
import { schemaRef } from "../../../ruleRuntime/jsonSchemaRefs"
import { registerProjectJSONSchema } from "../../../projectDefinition/schemaRegistry"
import { exportSystemEnumerationToJSONSchema } from "../../../systemEnumerations/toJSONSchema"
import {
  StandardPeriodVariantFromYAML,
  type SystemEnumerationPropertyRule,
  type SystemEnumerationTypeMap,
} from "../../../systemEnumerations/types"
import { createSettingsParameterValueJSONSchema } from "../parameterValue/toJSONSchema"
import type { SettingsParameterValuePropertyRule } from "../parameterValue/types"
import { AppearanceFieldsRules } from "./rules"

const russianDateTimeWithSecondsPattern =
  "^(0[1-9]|[12][0-9]|3[01])\\.(0[1-9]|1[0-2])\\.[0-9]{4} ([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$"
const standardPeriodVariants = Object.keys(StandardPeriodVariantFromYAML).map((variant) => Type.Literal(variant))

const unionOf = (schemas: TSchema[]): TSchema => {
  if (schemas.length === 0) return Type.Never()
  if (schemas.length === 1) return schemas[0]
  return Type.Union(schemas as [TSchema, TSchema, ...TSchema[]])
}

const Nullable = (schema: TSchema): TSchema => Type.Union([Type.Null(), schema])
const notSchema = (schema: TSchema): TSchema => ({ not: schema }) as TSchema

const StrictMetadataExplicitAccountTypeYAMLJSONSchema = Type.Object(
  {
    Тип: Type.Literal("ВидСчета"),
    Значение: Type.String(),
  },
  { additionalProperties: false }
)

const StrictExplicitDcsSystemEnumerationValueJSONSchema = Type.Object(
  {
    Тип: Type.Literal("СистемноеПеречисление"),
    Имя: Type.String(),
    Значение: Type.String(),
  },
  { additionalProperties: false }
)

const StrictStandardPeriodYAMLJSONSchema = Type.Object(
  {
    Вариант: unionOf(standardPeriodVariants),
    ДатаНачала: Type.Optional(Type.String({ pattern: russianDateTimeWithSecondsPattern })),
    ДатаОкончания: Type.Optional(Type.String({ pattern: russianDateTimeWithSecondsPattern })),
  },
  { additionalProperties: false }
)

const AppearancePrimitiveSingleValueJSONSchema = Type.Cyclic(
  {
    AppearancePrimitiveSingleValue: Type.Union([
      MetadataSingleValueJSONSchema,
      StrictMetadataExplicitAccountTypeYAMLJSONSchema,
      StrictExplicitDcsSystemEnumerationValueJSONSchema,
      StrictStandardPeriodYAMLJSONSchema,
      Type.Object(
        {
          Представление: I8nTextJSONSchema,
          Значение: Type.Optional(Type.Ref("AppearancePrimitiveSingleValue")),
        },
        { additionalProperties: false }
      ),
    ]),
  },
  "AppearancePrimitiveSingleValue"
)

const AppearancePrimitiveValueJSONSchema = Nullable(
  Type.Union([
    AppearancePrimitiveSingleValueJSONSchema,
    Type.Array(Type.Union([AppearancePrimitiveSingleValueJSONSchema, Type.Undefined(), Type.Null()])),
  ])
)

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
    ? schemaRef(ensureAppearanceSettingsParameterValueJSONSchema(property, rawValueSchema))
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
  property: SettingsParameterValuePropertyRule,
  rawValueSchema: (context: ConfigurationContext) => TSchema
): string {
  const schemaName = appearanceSettingsParameterValueSchemaName(property)
  registerProjectJSONSchema(schemaName, ({ context }) =>
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
          () => AppearancePrimitiveValueJSONSchema
        ),
        ОтметкаНезаполненного: propertySchema(
          context,
          properties.ОтметкаНезаполненного,
          () => AppearancePrimitiveValueJSONSchema
        ),
        Текст: appearanceStringPropertySchema(context),
        Видимость: propertySchema(context, properties.Видимость, () => AppearancePrimitiveValueJSONSchema),
        Доступность: propertySchema(context, properties.Доступность, () => AppearancePrimitiveValueJSONSchema),
        ТолькоПросмотр: propertySchema(context, properties.ТолькоПросмотр, () => AppearancePrimitiveValueJSONSchema),
        Отображать: propertySchema(context, properties.Отображать, () => AppearancePrimitiveValueJSONSchema),
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
