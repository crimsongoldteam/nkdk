import { Type, type TSchema } from "typebox"
import type { MetadataItemRule } from "./types"
import type { ResolvedPropertyStateItemCapability } from "../definition"

export function exportBorrowedPropertyStateSchema(params: {
  readonly rule: MetadataItemRule
  readonly capability: ResolvedPropertyStateItemCapability
  readonly source: TSchema
}): TSchema {
  const source = params.source as TSchema & {
    properties?: Record<string, TSchema>
    required?: string[]
  }
  const allowedYamlNames = new Set(
    Object.keys(params.capability.properties).flatMap((propertyKey) => {
      const yaml = params.rule.properties[propertyKey]?.yaml
      return typeof yaml === "string" ? [yaml] : []
    }),
  )
  const properties = Object.fromEntries(
    Object.entries(source.properties ?? {}).filter(([yamlName]) => allowedYamlNames.has(yamlName)),
  )
  const notify = sectionNames(params.capability, "notify")
  const extend = sectionNames(params.capability, "extend")
  if (notify.length > 0) properties.Проверять = sectionSchema(notify)
  if (extend.length > 0) properties.Изменять = sectionSchema(extend)

  return {
    ...source,
    properties,
    required: (source.required ?? []).filter((yamlName) => allowedYamlNames.has(yamlName)),
    additionalProperties: false,
  }
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
