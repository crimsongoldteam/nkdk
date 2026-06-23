import {
  exportJSONSchemaForProjectFile,
  exportJSONSchemaForSchemaName,
  listSchemaSummaryKeys,
  splitSearchTerms,
  summarizeJSONSchema,
  type SchemaSummaryOptions,
} from "@nakidka/core"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import { type GetSchemaInput } from "../contracts/getSchema"

export type GetSchemaPayload = ToolPayload<{
  target: string
  format: "summary" | "jsonSchema"
  result:
    | { kind: "keys"; keys: string[] }
    | { kind: "summary"; summary: unknown | null }
    | { kind: "jsonSchema"; schema: unknown }
}>

export function getSchema(input: GetSchemaInput): GetSchemaPayload {
  const validationError = validateGetSchemaInput(input)
  if (validationError !== undefined) return toolError("invalid_arguments", validationError)

  try {
    const format = input.format ?? "summary"
    const mode = input.mode ?? "externalRefs"
    const schema = readSchema(input, mode)

    if (format === "jsonSchema") {
      return toolSuccess({
        target: input.target,
        format,
        result: { kind: "jsonSchema", schema },
      })
    }

    const summaryOptions: SchemaSummaryOptions = {
      requiredOnly: input.required === true,
      search: input.search,
      exact: input.exact === true,
      keyTerms: typeof input.keys === "string" ? input.keys : undefined,
    }

    if (input.keys !== undefined) {
      const keys = listSchemaSummaryKeys(schema, summaryOptions)
      if (input.exact === true && keys.length === 0) {
        return toolError("invalid_arguments", `Поле "${input.search}" не найдено в JSON Schema`)
      }
      return toolSuccess({
        target: input.target,
        format,
        result: { kind: "keys", keys },
      })
    }

    const summary = summarizeJSONSchema(schema, summaryOptions)
    if (input.exact === true && summary === undefined) {
      return toolError("invalid_arguments", `Поле "${input.search}" не найдено в JSON Schema`)
    }

    return toolSuccess({
      target: input.target,
      format,
      result: { kind: "summary", summary: summary ?? null },
    })
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}

function validateGetSchemaInput(input: GetSchemaInput): string | undefined {
  if (input.mode === "inline" && input.format !== "jsonSchema") {
    return "mode=inline можно использовать только вместе с format=jsonSchema"
  }

  if (
    input.format === "jsonSchema" &&
    (input.keys !== undefined || input.required === true || input.search !== undefined || input.exact === true)
  ) {
    return "format=jsonSchema несовместим с keys, required, search и exact"
  }

  if (input.required === true && input.search !== undefined) {
    return "required и search нельзя использовать одновременно"
  }

  if (input.exact === true && input.search === undefined) {
    return "exact можно использовать только вместе с search"
  }

  if (input.search !== undefined && splitSearchTerms(input.search).length === 0) {
    return "search требует непустой запрос"
  }

  return undefined
}

function readSchema(input: GetSchemaInput, mode: "externalRefs" | "inline"): unknown {
  const context = {
    defaultLanguage: "ru",
    version: "2.20",
  } as const

  if (input.target.toLowerCase().endsWith(".yaml")) {
    return exportJSONSchemaForProjectFile({
      context,
      filePath: input.target,
      projectDir: input.projectDir ?? process.cwd(),
      mode,
    })
  }

  return exportJSONSchemaForSchemaName({
    context,
    name: input.target,
    mode,
  })
}
