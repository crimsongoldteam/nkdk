import type { TSchema } from "typebox"

import type { ConfigurationContext, JSONSchemaExportMode } from "../context/types"
import {
  attachCollectedSchemaRefs,
  createJSONSchemaExportContext,
} from "./jsonSchemaRefs"
import type { MetadataSchemaDefinition } from "./definition"
import type { RuleRegistrySet } from "./ruleRegistrySet"
import type { PropertyRule } from "./property/types"
import type { MetadataItemRule } from "./property/types"
import { exportMetadataItemToJSONSchema } from "./metadataItem/toJSONSchema"

export interface ExportRuleSchemaParams {
  readonly context: ConfigurationContext
  readonly mode?: JSONSchemaExportMode
  readonly excludeImplicitValueYAML?: boolean
  readonly includeNestedChildItems?: boolean
}

export interface ExportRuleSchemaByNameParams extends ExportRuleSchemaParams {
  readonly name: string
}

export interface RuleSchemaRuntime {
  exportByName(params: ExportRuleSchemaByNameParams): TSchema
  exportDefinition(params: ExportRuleSchemaParams & {
    readonly definition: MetadataSchemaDefinition
  }): TSchema
  exportRule(params: ExportRuleSchemaParams & {
    readonly rule: MetadataItemRule
  }): TSchema
}

export function createRuleSchemaRuntime(
  rules: RuleRegistrySet,
  unknownSchemaError: (name: string, availableNames: readonly string[]) => Error,
): RuleSchemaRuntime {
  const execution = rules.execution
  return {
    exportByName(params) {
      const { context, dynamicSchemas } = createExportSession(params, rules)
      const definition = rules.schemas.get(params.name) ?? dynamicSchemas.get(params.name)
      if (definition === undefined) {
        throw unknownSchemaError(params.name, listSchemaNames(rules))
      }
      const schema = definition.export({ context, execution })
      return finishExport(context, schema)
    },
    exportDefinition(params) {
      const { context } = createExportSession(params, rules)
      return finishExport(
        context,
        params.definition.export({ context, execution }),
      )
    },
    exportRule(params) {
      const { context } = createExportSession(params, rules)
      return finishExport(
        context,
        exportMetadataItemToJSONSchema({
          context,
          rule: params.rule,
          execution,
        }),
      )
    },
  }
}

function createExportSession(
  params: ExportRuleSchemaParams,
  rules: RuleRegistrySet,
): {
  readonly context: ConfigurationContext
  readonly dynamicSchemas: Map<string, MetadataSchemaDefinition>
} {
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
  const execution = rules.execution
  return {
    dynamicSchemas,
    context: createJSONSchemaExportContext(
      params.context,
      params.mode ?? "externalRefs",
      {
        excludeImplicitValueYAML: params.excludeImplicitValueYAML,
        includeNestedChildItems: params.includeNestedChildItems,
        defineSchema,
        propertyRef: ({ context, rule }) => {
          const propertyRule = asPropertyRule(rule)
          return rules.schemas.propertyRef(propertyRule.type)?.({
            context,
            rule: propertyRule,
            execution,
          })
        },
      },
    ),
  }
}

function finishExport(context: ConfigurationContext, schema: TSchema): TSchema {
  return context.exportToJSONSchema?.mode === "externalRefs"
    ? attachCollectedSchemaRefs(context, schema)
    : schema
}

function asPropertyRule(rule: unknown): PropertyRule {
  return rule as PropertyRule
}

function listSchemaNames(rules: RuleRegistrySet): string[] {
  return [...rules.schemas.names()].sort()
}
