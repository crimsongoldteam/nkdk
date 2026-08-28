import { Type, type TSchema } from "typebox"
import type { MetadataItemRule, PropertyRule } from "./types"
import type { ResolvedPropertyStateItemCapability } from "../definition"
import { getImplicitValueYAML } from "./toJSONSchema"
import { structuralYAMLProperties } from "@nkdk/runtime/rule-kit"

export function exportBorrowedPropertyStateSchema(params: {
  readonly rule: MetadataItemRule
  readonly capability: ResolvedPropertyStateItemCapability
  readonly source: TSchema
  readonly structuralPropertyKeys?: readonly string[]
  readonly closed?: boolean
  readonly includeExtendedConfigurationObject?: boolean
}): TSchema {
  const localRoot = localSchemaRoot(params.source)
  if (localRoot !== undefined) {
    const source = schemaWithDefinitions(params.source)
    return {
      ...source,
      $defs: {
        ...source.$defs,
        [localRoot.key]: exportBorrowedPropertyStateSchema({
          ...params,
          source: localRoot.schema,
        }),
      },
    }
  }
  const source = params.source as TSchema & {
    properties?: Record<string, TSchema>
    required?: string[]
  }
  const allowedPropertyKeys = new Set([
    ...Object.keys(params.capability.properties),
    ...(params.structuralPropertyKeys ?? []),
    ...(params.rule.properties.objectBelonging === undefined ? [] : ["objectBelonging"]),
  ])
  const allowedYamlNames = new Set(
    [...allowedPropertyKeys].flatMap((propertyKey) => {
      const yaml = params.rule.properties[propertyKey]?.yaml
      return typeof yaml === "string" ? [yaml] : []
    }),
  )
  const structuralYamlNames = structuralYAMLProperties(source)
  const technicalProperties = Object.fromEntries(
    Object.entries(source.properties ?? {}).filter(([yamlName]) => structuralYamlNames.has(yamlName)),
  )
  const allowedProperties = Object.fromEntries(
    Object.entries(source.properties ?? {}).flatMap(([yamlName, schema]) => {
      if (!allowedYamlNames.has(yamlName)) return []
      const propertyKey = propertyKeyByYamlName(params.rule, yamlName)
      const capability = propertyKey === undefined ? undefined : params.capability.properties[propertyKey]
      const propertyRule = propertyKey === undefined ? undefined : params.rule.properties[propertyKey]
      const withImplicitValue = propertyRule === undefined
        ? schema
        : capability?.availability === "own"
          ? ownPropertySchema(schema, propertyRule)
          : borrowedPropertySchema(schema, propertyRule, capability)
      return [[yamlName, capability?.representation === "tagged"
        ? taggedScalarSchema(withImplicitValue)
        : withImplicitValue]]
    }),
  )
  const properties = params.closed === false
    ? {
        ...(source.properties ?? {}),
        ...allowedProperties,
      }
    : {
        ...technicalProperties,
        ...allowedProperties,
      }
  if (
    params.includeExtendedConfigurationObject === true ||
    params.capability.properties.extendedConfigurationObject !== undefined
  ) {
    properties.ОбъектРасширяемойКонфигурации = Type.Optional(Type.Union([
      Type.Object({}, { additionalProperties: false, maxProperties: 0 }),
      Type.Literal(""),
    ]))
  }
  const notify = sectionNames(params.capability, "notify")
  const extend = sectionNames(params.capability, "extend")
  if (notify.length > 0) properties.Проверять = sectionSchema(notify)
  if (extend.length > 0) properties.Изменять = sectionSchema(extend)

  return {
    ...source,
    properties,
    required: params.closed === false
      ? source.required
      : (source.required ?? []).filter((yamlName) =>
          allowedYamlNames.has(yamlName) || Object.hasOwn(technicalProperties, yamlName)),
    additionalProperties: false,
  }
}

function borrowedPropertySchema(
  source: TSchema,
  rule: PropertyRule,
  capability: ResolvedPropertyStateItemCapability["properties"][string] | undefined,
): TSchema {
  const base = capability?.representation === "plain"
    ? plainEmptySchema(source, rule)
    : isScalarMetadataTarget(rule)
      ? Type.Union([source, Type.Null()])
      : source
  const implicit = controlledDefaultYAML(rule, capability)
  if (implicit === undefined) return base
  if (capability?.modes.includes("control") !== true) return implicitValueSchema(base, implicit)
  return Type.Union([
    Type.Intersect([base, notSchema(Type.Literal(implicit))]),
    Type.Null(),
  ])
}

function controlledDefaultYAML(
  rule: PropertyRule,
  capability: ResolvedPropertyStateItemCapability["properties"][string] | undefined,
): string | number | undefined {
  const implicit = getImplicitValueYAML(rule)
  if (implicit !== undefined || capability?.modes.includes("control") !== true) return implicit
  const defaultValue = Object.prototype.hasOwnProperty.call(rule, "defaultValueAdoptedXML")
    ? rule.defaultValueAdoptedXML
    : Object.prototype.hasOwnProperty.call(rule, "defaultValueXML")
      ? rule.defaultValueXML
      : undefined
  return getImplicitValueYAML({ ...rule, implicitValueYAML: defaultValue })
}

function isScalarMetadataTarget(rule: PropertyRule): boolean {
  return rule.metadataTarget !== undefined &&
    (rule.type === "string" || rule.type === "MetadataItemLink" || rule.type === "MetadataField")
}

function plainEmptySchema(
  schema: TSchema,
  rule: PropertyRule,
): TSchema {
  if (rule.type === "string" || rule.type === "I8nText" || rule.type === "MetadataItemLink" || rule.type === "Picture") {
    return Type.Union([schema, Type.Literal("")])
  }
  return schema
}

function ownPropertySchema(source: TSchema, rule: PropertyRule): TSchema {
  const implicit = getOwnPropertyImplicitValueYAML(rule)
  return implicit === undefined
    ? source
    : Type.Intersect([source, notSchema(Type.Literal(implicit))])
}

export function getOwnPropertyImplicitValueYAML(rule: PropertyRule): string | number | undefined {
  if (rule.preserveExplicitDefaultXML === true) return undefined
  return getImplicitValueYAML(rule) ?? (
    (rule.type === "string" || rule.type === "I8nText") && rule.defaultValueXMLRaw === ""
      ? ""
      : undefined
  )
}

function notSchema(source: TSchema): TSchema {
  return { not: source } as TSchema
}

function localSchemaRoot(source: TSchema): { readonly key: string; readonly schema: TSchema } | undefined {
  const candidate = source as TSchema & { $ref?: unknown; $defs?: unknown }
  if (typeof candidate.$ref !== "string" || candidate.$defs === null || typeof candidate.$defs !== "object") return undefined
  const definitions = candidate.$defs as Record<string, TSchema>
  const direct = definitions[candidate.$ref]
  if (direct !== undefined) return { key: candidate.$ref, schema: direct }
  const entry = Object.entries(definitions).find(([, schema]) =>
    (schema as TSchema & { $id?: unknown }).$id === candidate.$ref)
  return entry === undefined ? undefined : { key: entry[0], schema: entry[1] }
}

function schemaWithDefinitions(source: TSchema): TSchema & { $defs: Record<string, TSchema> } {
  return source as TSchema & { $defs: Record<string, TSchema> }
}

export function exportNestedPropertyStateSchema(params: {
  readonly rule: MetadataItemRule
  readonly capability: ResolvedPropertyStateItemCapability
  readonly source: TSchema
  readonly structuralPropertyKeys?: readonly string[]
}): TSchema {
  const belongingYamlName = objectBelongingYamlName(params.rule)
  if (
    belongingYamlName === undefined &&
    Object.values(params.capability.properties).every((property) => property.representation === "section")
  ) return params.source
  return exportBorrowedPropertyStateSchema({
    ...params,
    rule: params.rule,
    source: params.source,
    structuralPropertyKeys: [
      ...(params.structuralPropertyKeys ?? []),
      ...(belongingYamlName === undefined ? [] : [propertyKeyByYamlName(params.rule, belongingYamlName)!]),
    ],
  })
}

function objectBelongingYamlName(rule: MetadataItemRule): string | undefined {
  return Object.values(rule.properties).find((property) =>
    property.yaml === "ПринадлежностьОбъекта")?.yaml as string | undefined
}

function propertyKeyByYamlName(rule: MetadataItemRule, yamlName: string): string | undefined {
  return Object.entries(rule.properties).find(([, property]) => property.yaml === yamlName)?.[0]
}

function taggedScalarSchema(source: TSchema): TSchema {
  return Type.Union([
    source,
    Type.Object({}, { additionalProperties: false, maxProperties: 0 }),
  ])
}

function implicitValueSchema(source: TSchema, implicitValue: string | number | undefined): TSchema {
  return implicitValue === undefined ? source : Type.Union([source, Type.Literal(implicitValue)])
}

function sectionNames(
  capability: ResolvedPropertyStateItemCapability,
  mode: "notify" | "extend",
): string[] {
  return Object.values(capability.properties).flatMap((property) =>
    property.representation === "section" &&
    property.externalName !== undefined &&
    property.modes.includes(mode)
      ? [property.externalName]
      : [],
  )
}

function sectionSchema(names: readonly string[]): TSchema {
  return Type.Array(Type.Enum([...names]), {
    uniqueItems: true,
  })
}
