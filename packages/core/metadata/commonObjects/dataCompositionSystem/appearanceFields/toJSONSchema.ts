import { TSchema, Type } from "typebox"
import { BooleanJSONSchema } from "../../boolean/types"
import { ColorJSONSchema } from "../../color/types"
import { FormattedI8nTextJSONSchema } from "../../formattedI8nText/types"
import { I8nTextJSONSchema } from "../../i8nText/types"
import { MetadataSingleValueJSONSchema } from "../../metadataValue/types"
import { ConfigurationContext } from "../../../context/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../../orchestration"
import { schemaRef } from "../../../orchestration/jsonSchemaRefs"
import { registerProjectJSONSchema } from "../../../project/schemaRegistry"
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

const DesignTimeI8nTextJSONSchema = Type.Union([
  Type.String(),
  {
    ...Type.Record(Type.String({ pattern: "^[a-z]{2}(-[A-Z]{2})?$" }), Type.String()),
    additionalProperties: false,
    minProperties: 1,
  } as TSchema,
])

const ExplicitTextValueJSONSchema = Type.Union([
  Type.Object(
    {
      Тип: Type.Literal("Поле"),
      Значение: Type.String(),
    },
    { additionalProperties: false }
  ),
  Type.Object(
    {
      Тип: Type.Literal("ЗначениеВремениПроектирования"),
      Значение: Type.String(),
    },
    { additionalProperties: false }
  ),
  Type.Object(
    {
      Тип: Type.Literal("МногоязычнаяСтрока"),
      Значение: Type.Optional(I8nTextJSONSchema),
    },
    { additionalProperties: false }
  ),
  Type.Object(
    {
      Тип: Type.Literal("МногоязычнаяФорматированнаяСтрока"),
      Значение: Type.Optional(FormattedI8nTextJSONSchema),
    },
    { additionalProperties: false }
  ),
])

const AppearanceDesignTimeValueJSONSchema = Nullable(
  Type.Union([DesignTimeI8nTextJSONSchema, ExplicitTextValueJSONSchema])
)

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
  return ["AppearanceSettingsParameterValue", property.valueType, property.typeSE, property.yaml]
    .filter(Boolean)
    .join("_")
    .replace(/[^\w]/gu, (char) => `_u${char.codePointAt(0)!.toString(16).padStart(4, "0")}`)
}

export const exportAppearanceFieldsToJSONSchema: ExportToJSONSchemaFn = ({ context }) => {
  const properties = AppearanceFieldsRules.properties

  return Type.Object(
    {
      ЦветФона: propertySchema(context, properties.ЦветФона, () => Nullable(ColorJSONSchema)),
      ЦветТекста: propertySchema(context, properties.ЦветТекста, () => Nullable(ColorJSONSchema)),
      Шрифт: propertySchema(context, properties.Шрифт, () => Nullable(StrictFontJSONSchema)),
      ГоризонтальноеПоложение: propertySchema(
        context,
        properties.ГоризонтальноеПоложение,
        (context) => Nullable(requiredSystemEnumerationJSONSchema(context, "HorizontalAlign"))
      ),
      Формат: propertySchema(context, properties.Формат, () => AppearanceDesignTimeValueJSONSchema),
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
      Текст: propertySchema(context, properties.Текст, () => AppearanceDesignTimeValueJSONSchema),
      Видимость: propertySchema(context, properties.Видимость, () => AppearancePrimitiveValueJSONSchema),
      Доступность: propertySchema(context, properties.Доступность, () => AppearancePrimitiveValueJSONSchema),
      ТолькоПросмотр: propertySchema(context, properties.ТолькоПросмотр, () => AppearancePrimitiveValueJSONSchema),
      Отображать: propertySchema(context, properties.Отображать, () => AppearancePrimitiveValueJSONSchema),
    },
    { additionalProperties: false }
  )
}

registerTypeRule("AppearanceFields", "exportToJSONSchema", exportAppearanceFieldsToJSONSchema)
