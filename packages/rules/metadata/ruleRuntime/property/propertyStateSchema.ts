import { Type, type TSchema } from "typebox"
import type { MetadataItemRule } from "./types"
import type { ResolvedPropertyStateItemCapability } from "../definition"

export function exportBorrowedPropertyStateSchema(params: {
  readonly rule: MetadataItemRule
  readonly capability: ResolvedPropertyStateItemCapability
  readonly source: TSchema
  readonly structuralPropertyKeys?: readonly string[]
  readonly closed?: boolean
}): TSchema {
  const source = params.source as TSchema & {
    properties?: Record<string, TSchema>
    required?: string[]
  }
  const allowedPropertyKeys = new Set([
    ...Object.keys(params.capability.properties),
    ...(params.structuralPropertyKeys ?? []),
  ])
  const allowedYamlNames = new Set(
    [...allowedPropertyKeys].flatMap((propertyKey) => {
      const yaml = params.rule.properties[propertyKey]?.yaml
      return typeof yaml === "string" ? [yaml] : []
    }),
  )
  const allowedProperties = Object.fromEntries(
    Object.entries(source.properties ?? {}).flatMap(([yamlName, schema]) => {
      if (!allowedYamlNames.has(yamlName)) return []
      const propertyKey = propertyKeyByYamlName(params.rule, yamlName)
      const capability = propertyKey === undefined ? undefined : params.capability.properties[propertyKey]
      return [[yamlName, capability?.representation === "tagged"
        ? taggedScalarSchema(schema)
        : schema]]
    }),
  )
  const properties = params.closed === false
    ? {
        ...(source.properties ?? {}),
        ...allowedProperties,
      }
    : allowedProperties
  const notify = sectionNames(params.capability, "notify")
  const extend = sectionNames(params.capability, "extend")
  if (notify.length > 0) properties.Проверять = sectionSchema(notify)
  if (extend.length > 0) properties.Изменять = sectionSchema(extend)

  return {
    ...source,
    properties,
    required: params.closed === false
      ? source.required
      : (source.required ?? []).filter((yamlName) => allowedYamlNames.has(yamlName)),
    additionalProperties: false,
  }
}

export function exportNestedPropertyStateSchema(params: {
  readonly rule: MetadataItemRule
  readonly capability: ResolvedPropertyStateItemCapability
  readonly source: TSchema
  readonly structuralPropertyKeys?: readonly string[]
}): TSchema {
  const normalized = withBorrowedMarker(params.rule, params.source)
  const markerYaml = normalized.rule.properties.extendedConfigurationObject?.yaml
  if (typeof markerYaml !== "string") return params.source
  const own = {
    ...normalized.source,
    not: { required: [markerYaml] },
  }
  const borrowed = exportBorrowedPropertyStateSchema({
    ...params,
    rule: normalized.rule,
    source: normalized.source,
  }) as TSchema & { required?: string[] }
  const id = (normalized.source as TSchema & { $id?: string }).$id
  const union = Type.Union([
    withoutId(own),
    {
      ...withoutId(borrowed),
      required: [...new Set([...(borrowed.required ?? []), markerYaml])],
    },
  ])
  return id === undefined ? union : { ...union, $id: id }
}

function withBorrowedMarker(rule: MetadataItemRule, source: TSchema): {
  rule: MetadataItemRule
  source: TSchema
} {
  if (rule.properties.extendedConfigurationObject !== undefined) return { rule, source }
  const markerRule = {
    type: "string",
    yaml: "ОбъектРасширяемойКонфигурации",
  }
  return {
    rule: {
      ...rule,
      properties: {
        ...rule.properties,
        extendedConfigurationObject: markerRule,
      },
    },
    source: {
      ...source,
      properties: {
        ...((source as TSchema & { properties?: Record<string, TSchema> }).properties ?? {}),
        ОбъектРасширяемойКонфигурации: Type.Optional(Type.String()),
      },
    },
  }
}

function withoutId(schema: TSchema): TSchema {
  const { $id: _id, ...rest } = schema as TSchema & { $id?: string }
  return rest
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
  return Type.Optional(Type.Array({ enum: [...names] }, {
    uniqueItems: true,
  }))
}
