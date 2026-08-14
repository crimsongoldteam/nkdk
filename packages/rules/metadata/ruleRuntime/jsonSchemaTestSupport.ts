import type { TSchema } from "typebox"

import type { ConfigurationContext, JSONSchemaExportMode } from "@nkdk/runtime"
import {
  createJSONSchemaExportContext,
  createSchemaRef,
  encodeValidationSchemaKey,
} from "./jsonSchemaRefs"

export function createValidationSchemaTestSession(
  baseContext: ConfigurationContext,
  mode: JSONSchemaExportMode,
  options: {
    readonly excludeImplicitValueYAML?: boolean
    readonly propertyRef?: NonNullable<ConfigurationContext["exportToJSONSchema"]>["propertyRef"]
  } = {},
): {
  readonly context: ConfigurationContext
  get(ref: string): TSchema | undefined
  schemas(): Record<string, TSchema>
} {
  const schemas = new Map<string, (params: { context: ConfigurationContext }) => TSchema>()
  const context = createJSONSchemaExportContext(baseContext, mode, {
    validationPropertyRefs: true,
    excludeImplicitValueYAML: options.excludeImplicitValueYAML,
    propertyRef: options.propertyRef,
    defineSchema(name, exporter) {
      schemas.set(validationRef(baseContext, name), exporter)
    },
  })
  return {
    context,
    get(ref) {
      return schemas.get(ref)?.({ context })
    },
    schemas() {
      return Object.fromEntries(
        [...schemas].map(([ref, exporter]) => [ref, exporter({ context })]),
      )
    },
  }
}

function validationRef(context: ConfigurationContext, key: string): string {
  return createSchemaRef(
    `validation/${context.version}/${context.languages.default}/${encodeValidationSchemaKey(key)}`,
  )
}
