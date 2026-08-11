import type { TSchema } from "typebox"

import type { ConfigurationContext, JSONSchemaExportMode } from "../context/types"
import {
  attachCollectedSchemaRefs,
  createJSONSchemaExportContext,
} from "./jsonSchemaRefs"
import type { MetadataSchemaDefinition } from "./definition"
import type { RuleRegistrySet } from "./ruleRegistrySet"
import type { PropertyRule } from "./property/types"

export interface ExportRuleSchemaByNameParams {
  readonly context: ConfigurationContext
  readonly name: string
  readonly mode?: JSONSchemaExportMode
  readonly excludeImplicitValueYAML?: boolean
  readonly includeNestedChildItems?: boolean
}

export interface RuleSchemaRuntime {
  exportByName(params: ExportRuleSchemaByNameParams): TSchema
}

export function createRuleSchemaRuntime(
  rules: RuleRegistrySet,
  unknownSchemaError: (name: string, availableNames: readonly string[]) => Error,
): RuleSchemaRuntime {
  return {
    exportByName(params) {
      const dynamicSchemas = new Map<string, MetadataSchemaDefinition>()
      const defineSchema = (
        name: string,
        exporter: MetadataSchemaDefinition["export"],
      ): void => {
        const existing = dynamicSchemas.get(name)
        if (existing?.export !== undefined && existing.export !== exporter) {
          throw new Error(`JSON Schema "${name}" определена несколько раз`)
        }
        dynamicSchemas.set(name, { export: exporter })
      }
      const context = createJSONSchemaExportContext(
        params.context,
        params.mode ?? "externalRefs",
        {
          excludeImplicitValueYAML: params.excludeImplicitValueYAML,
          includeNestedChildItems: params.includeNestedChildItems,
          defineSchema,
          propertyRef: ({ context: propertyContext, rule }) => {
            const propertyRule = asPropertyRule(rule)
            return rules.schemas.propertyRef(propertyRule.type)?.({
              context: propertyContext,
              rule: propertyRule,
            })
          },
        },
      )
      const definition = rules.schemas.get(params.name) ?? dynamicSchemas.get(params.name)
      if (definition === undefined) {
        throw unknownSchemaError(params.name, listSchemaNames(rules))
      }
      const schema = definition.export({ context })
      return context.exportToJSONSchema?.mode === "externalRefs"
        ? attachCollectedSchemaRefs(context, schema)
        : schema
    },
  }
}

function asPropertyRule(rule: unknown): PropertyRule {
  return rule as PropertyRule
}

function listSchemaNames(rules: RuleRegistrySet): string[] {
  return [...rules.schemas.names()].sort()
}
