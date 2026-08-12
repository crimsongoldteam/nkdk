import { Type, type TSchema } from "typebox"
import type { MetadataItemRule } from "./types"
import type { ResolvedPropertyStateItemCapability } from "../definition"
import { getImplicitValueYAML } from "./toJSONSchema"

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
      const propertyRule = propertyKey === undefined ? undefined : params.rule.properties[propertyKey]
      const withImplicitValue = propertyRule === undefined
        ? schema
        : implicitValueSchema(schema, getImplicitValueYAML(propertyRule))
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
    : allowedProperties
  if (params.closed !== false) {
    for (const [propertyKey, propertyRule] of Object.entries(params.rule.properties)) {
      if (typeof propertyRule.yaml !== "string" || allowedPropertyKeys.has(propertyKey)) continue
      const sourceSchema = source.properties?.[propertyRule.yaml]
      if (sourceSchema !== undefined) properties[propertyRule.yaml] = explicitPropertyStateXMLSchema()
    }
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
  const borrowed = exportBorrowedPropertyStateSchema({
    ...params,
    rule: params.rule,
    source: params.source,
  })
  const id = (params.source as TSchema & { $id?: string }).$id
  const union = Type.Union([
    withoutId(params.source),
    withoutId(borrowed),
  ])
  return id === undefined ? union : { ...union, $id: id }
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

function implicitValueSchema(source: TSchema, implicitValue: string | number | undefined): TSchema {
  return implicitValue === undefined ? source : Type.Union([source, Type.Literal(implicitValue)])
}

function explicitPropertyStateXMLSchema(): TSchema {
  return Type.String({ pattern: "^!xml configurationExtensionPropertyStateXML:[A-Za-z0-9_-]+$" })
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
