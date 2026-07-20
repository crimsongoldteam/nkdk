import { TSchema, Type } from "typebox"
import { ColorJSONSchema } from "../../color/types"
import { FontJSONSchema } from "../../font/types"
import { FormattedI8nTextJSONSchema } from "../../formattedI8nText/types"
import { I8nTextJSONSchema } from "../../i8nText/types"
import { MetadataFieldJSONSchema } from "../../metadataField/types"
import { MetadataSingleValueJSONSchema } from "../../metadataValue/types"
import { TypeLinkJSONSchema } from "../../typeLink/types"
import { ChoiceParameterLinksJSONSchema } from "../../сhoiceParameterLinks/types"
import { ChoiceParametersJSONSchema } from "../../сhoiceParameters/types"
import type { ConfigurationContext } from "../../../context/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../../orchestration"
import { schemaRef } from "../../../orchestration/jsonSchemaRefs"
import { registerProjectJSONSchema, registerProjectJSONSchemaPropertyRefFactory } from "../../../project/schemaRegistry"
import { exportSystemEnumerationToJSONSchema } from "../../../systemEnumerations/toJSONSchema"
import * as SE from "../../../systemEnumerations/types"
import {
  StandardPeriodVariantFromYAML,
  type SystemEnumerationPropertyRule,
  type SystemEnumerationTypeMap,
} from "../../../systemEnumerations/types"
import type { DcsMetadataValuePropertyRule } from "./types"

const russianDateTimeWithSecondsPattern =
  "^(0[1-9]|[12][0-9]|3[01])\\.(0[1-9]|1[0-2])\\.[0-9]{4} ([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$"
const standardPeriodVariants = Object.keys(StandardPeriodVariantFromYAML).map((variant) => Type.Literal(variant))

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

const ExplicitPrimitiveStringValueJSONSchema = Type.Object(
  {
    Тип: Type.Literal("Строка"),
    Значение: Type.String(),
  },
  { additionalProperties: false }
)

const unionOf = (schemas: TSchema[]): TSchema => {
  if (schemas.length === 0) return Type.Never()
  if (schemas.length === 1) return schemas[0]
  return Type.Union(schemas as [TSchema, TSchema, ...TSchema[]])
}

const StrictMetadataExplicitDataCompositionComparisonTypeYAMLJSONSchema = Type.Object(
  {
    Тип: Type.Literal("ВидСравненияКомпоновкиДанных"),
    Значение: Type.String(),
  },
  { additionalProperties: false }
)

const StrictMetadataExplicitAccountTypeYAMLJSONSchema = Type.Object(
  {
    Тип: Type.Literal("ВидСчета"),
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

const DcsMetadataSingleValueJSONSchema = Type.Cyclic(
  {
    DcsMetadataSingleValue: Type.Union([
      MetadataSingleValueJSONSchema,
      StrictMetadataExplicitDataCompositionComparisonTypeYAMLJSONSchema,
      StrictMetadataExplicitAccountTypeYAMLJSONSchema,
      StrictStandardPeriodYAMLJSONSchema,
      Type.Object(
        {
          Представление: I8nTextJSONSchema,
          Значение: Type.Optional(
            Type.Union([
              Type.Ref("DcsMetadataSingleValue"),
              Type.Array(Type.Union([Type.Ref("DcsMetadataSingleValue"), Type.Undefined(), Type.Null()])),
            ])
          ),
        },
        { additionalProperties: false }
      ),
      Type.Object(
        {
          Значение: Type.Union([
            Type.Ref("DcsMetadataSingleValue"),
            Type.Array(Type.Union([Type.Ref("DcsMetadataSingleValue"), Type.Undefined(), Type.Null()])),
          ]),
        },
        { additionalProperties: false }
      ),
    ]),
  },
  "DcsMetadataSingleValue"
)

const DesignTimeI8nTextJSONSchema = Type.Union([
  Type.String(),
  {
    ...Type.Record(Type.String({ pattern: "^[a-z]{2}(-[A-Z]{2})?$" }), Type.String()),
    additionalProperties: false,
    minProperties: 1,
  } as TSchema,
])

const Nullable = (schema: TSchema): TSchema => Type.Union([Type.Null(), schema])

const DCS_METADATA_SINGLE_VALUE_SCHEMA_NAME = "DcsMetadataSingleValue"
const DCS_EXPLICIT_SYSTEM_ENUMERATION_SCHEMA_NAME = "DcsExplicitSystemEnumerationValue"

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
    throw new Error(`MetadataDcsMetadataValue JSON Schema: schema for SystemEnumeration ${typeSE} is undefined`)
  }
  return schema
}

const SystemEnumerationTypeMapMissingFromYAMLKeys = new Set([
  "OnUnavailabilityDataCompositionSettingsAction",
  "InternetMailMessageNonASCIISymbolsEncodingMode",
  "POP3AuthenticationMode",
  "ConfigurationExtensionApplicationIssueSeverity",
  "DataBaseConfigurationUpdateExecutionInformationItemType",
  "CollaborationSystemFromDataDumpRestoreStatus",
  "CollaborationSystemMessageButtonPanelButtonAction",
  "CollaborationSystemMessageButtonPanelButtonType",
  "CollaborationSystemNotificationRepresentation",
  "AdministrationActionOnResourceConsumptionLimitExcess",
  "AdministrationResourceConsumptionCounterFilterType",
  "AdministrationResourceConsumptionCounterGroupType",
  "ConnectedComponentsOfSystemOfLinearEquationsCalculationGettingMethod",
  "PointsConnectionAcrossSkippedChartValuesType",
  "GeographicalSchemaDataSourceOrganizationType",
  "SynchronousPlatformExtensionAndAddInCallUseMode",
])

const explicitDcsSystemEnumerationValueJSONSchema = (context: ConfigurationContext): TSchema =>
  unionOf(
    Object.entries(SE)
      .filter(([key, enumeration]) => {
        if (!key.endsWith("FromYAML") || typeof enumeration !== "object" || enumeration === null) return false
        return !SystemEnumerationTypeMapMissingFromYAMLKeys.has(key.slice(0, -"FromYAML".length))
      })
      .map(([key]) => {
        const typeSE = key.slice(0, -"FromYAML".length) as keyof SystemEnumerationTypeMap
        return Type.Object(
          {
            Тип: Type.Literal("СистемноеПеречисление"),
            Имя: Type.Literal(typeSE),
            Значение: requiredSystemEnumerationJSONSchema(context, typeSE),
          },
          { additionalProperties: false }
        )
      })
  )

function createDcsMetadataValueJSONSchema(context: ConfigurationContext, rule: DcsMetadataValuePropertyRule): TSchema {
  const dcsRule = rule as DcsMetadataValuePropertyRule
  const useExternalRefs = context.exportToJSONSchema?.mode === "externalRefs"
  const dcsMetadataSingleValueJSONSchema = useExternalRefs
    ? schemaRef(DCS_METADATA_SINGLE_VALUE_SCHEMA_NAME)
    : DcsMetadataSingleValueJSONSchema
  const dcsMetadataValueJSONSchema = Type.Union([
    dcsMetadataSingleValueJSONSchema,
    Type.Array(Type.Union([dcsMetadataSingleValueJSONSchema, Type.Undefined(), Type.Null()])),
  ])
  let explicitDcsSystemEnumerationSchema: TSchema | undefined
  let primitiveValueSchema: TSchema | undefined
  const explicitDcsSystemEnumerationJSONSchema = (): TSchema =>
    (explicitDcsSystemEnumerationSchema ??= useExternalRefs
      ? schemaRef(DCS_EXPLICIT_SYSTEM_ENUMERATION_SCHEMA_NAME)
      : explicitDcsSystemEnumerationValueJSONSchema(context))
  const primitiveValueJSONSchema = (): TSchema =>
    (primitiveValueSchema ??= Type.Union([
      dcsMetadataSingleValueJSONSchema,
      explicitDcsSystemEnumerationJSONSchema(),
      Type.Null(),
    ]))

  switch (dcsRule.valueType) {
    case "Color":
      return Nullable(ColorJSONSchema)
    case "Font":
      return Nullable(FontJSONSchema)
    case "Field":
      return Nullable(
        Type.Union([
          MetadataFieldJSONSchema,
          dcsMetadataValueJSONSchema,
          ExplicitPrimitiveStringValueJSONSchema,
          explicitDcsSystemEnumerationJSONSchema(),
        ])
      )
    case "Parameter":
      return Nullable(ChoiceParametersJSONSchema)
    case "DesignTimeValue":
      return Nullable(Type.Union([DesignTimeI8nTextJSONSchema, ExplicitTextValueJSONSchema]))
    case "Primitive":
      return Nullable(Type.Union([primitiveValueJSONSchema(), Type.Array(primitiveValueJSONSchema())]))
    case "TypeLink":
      return Nullable(TypeLinkJSONSchema)
    case "ChoiceParameterLinks":
      return Nullable(ChoiceParameterLinksJSONSchema)
    case "SystemEnumeration":
      return Nullable(requiredSystemEnumerationJSONSchema(context, dcsRule.typeSE))
    default:
      throw new Error("MetadataDcsMetadataValue JSON Schema: unsupported valueType")
  }
}

export const exportDcsMetadataValueToJSONSchema: ExportToJSONSchemaFn = ({ context, rule }): TSchema => {
  const dcsRule = rule as DcsMetadataValuePropertyRule
  if (context.exportToJSONSchema?.mode === "externalRefs") {
    return schemaRef(ensureDcsMetadataValueJSONSchema(dcsRule))
  }

  return createDcsMetadataValueJSONSchema(context, dcsRule)
}

registerTypeRule("MetadataDcsMetadataValue", "exportToJSONSchema", exportDcsMetadataValueToJSONSchema)

registerProjectJSONSchema(DCS_METADATA_SINGLE_VALUE_SCHEMA_NAME, () => DcsMetadataSingleValueJSONSchema)
registerProjectJSONSchema(DCS_EXPLICIT_SYSTEM_ENUMERATION_SCHEMA_NAME, ({ context }) =>
  context.exportToJSONSchema?.validationPropertyRefs === true
    ? Type.Any()
    : explicitDcsSystemEnumerationValueJSONSchema(context)
)

registerProjectJSONSchemaPropertyRefFactory("MetadataDcsMetadataValue", ({ rule }) => {
  const dcsRule = rule as DcsMetadataValuePropertyRule
  return schemaRef(ensureDcsMetadataValueJSONSchema(dcsRule))
})

export function ensureDcsMetadataValueJSONSchema(rule: DcsMetadataValuePropertyRule): string {
  const schemaName = dcsMetadataValueSchemaName(rule)
  registerProjectJSONSchema(schemaName, ({ context }) =>
    createDcsMetadataValueJSONSchema(context, rule)
  )
  return schemaName
}

export function dcsMetadataValueSchemaName(rule: DcsMetadataValuePropertyRule): string {
  return ["DcsMetadataValue", rule.valueType, "typeSE" in rule ? rule.typeSE : undefined].filter(Boolean).join("/")
}
