import {
  exportJSONSchemaForProjectFile,
  exportJSONSchemaForSchemaName,
  listSchemaSummaryKeys,
  splitSearchTerms,
  summarizeJSONSchema,
  type SchemaSummaryOptions,
} from "@nakidka/core"
import { stringify } from "yaml"

export interface SchemaCommandOptions {
  project?: string
  inline?: boolean
  jsonSchema?: boolean
  keys?: boolean | string
  required?: boolean
  search?: string
  exact?: boolean
}

export interface NormalizedSchemaCommandInput {
  target: string
  options: SchemaCommandOptions
}

export function normalizeSchemaCommandInput(
  target: string | undefined,
  options: SchemaCommandOptions,
): NormalizedSchemaCommandInput {
  if (target !== undefined) {
    return { target, options }
  }

  if (typeof options.keys === "string") {
    return {
      target: options.keys,
      options: { ...options, keys: true },
    }
  }

  throw new Error("Не указан target для schema")
}

export const printSchema = async (target: string, options: SchemaCommandOptions = {}): Promise<void> => {
  validateSchemaCommandOptions(options)

  const context = {
    defaultLanguage: "ru",
    version: "2.20",
  } as const
  const mode = options.inline === true ? "inline" : "externalRefs"

  const schema = (options.project || target.toLowerCase().endsWith(".yaml"))
    ? exportJSONSchemaForProjectFile({
        context,
        filePath: target,
        projectDir: options.project,
        mode,
      })
    : exportJSONSchemaForSchemaName({
        context,
        name: target,
        mode,
      })

  if (options.jsonSchema === true) {
    process.stdout.write(`${JSON.stringify(schema, null, 2)}\n`)
    return
  }

  const summaryOptions: SchemaSummaryOptions = {
    requiredOnly: options.required === true,
    search: options.search,
    exact: options.exact === true,
    keyTerms: typeof options.keys === "string" ? options.keys : undefined,
  }

  if (options.keys !== undefined) {
    const keys = listSchemaSummaryKeys(schema, summaryOptions)
    if (keys.length > 0) {
      process.stdout.write(`${keys.join("\n")}\n`)
    }
    if (options.exact === true && keys.length === 0) {
      throw new Error(`Поле "${options.search}" не найдено в JSON Schema`)
    }
    return
  }

  const summary = summarizeJSONSchema(schema, summaryOptions)
  if (summary === undefined) {
    if (options.exact === true) {
      throw new Error(`Поле "${options.search}" не найдено в JSON Schema`)
    }
    return
  }

  process.stdout.write(stringify(summary))
}

export const printJSONSchema = async (target: string, options: SchemaCommandOptions = {}): Promise<void> => {
  await printSchema(target, { ...options, jsonSchema: true })
}

function validateSchemaCommandOptions(options: SchemaCommandOptions): void {
  if (options.inline === true && options.jsonSchema !== true) {
    throw new Error("--inline можно использовать только вместе с --json-schema")
  }

  if (
    options.jsonSchema === true &&
    (options.keys !== undefined || options.required === true || options.search !== undefined || options.exact === true)
  ) {
    throw new Error("--json-schema несовместим с --keys, --required, --search и --exact")
  }

  if (options.required === true && options.search !== undefined) {
    throw new Error("--required и --search нельзя использовать одновременно")
  }

  if (options.exact === true && options.search === undefined) {
    throw new Error("--exact можно использовать только вместе с --search")
  }

  if (options.search !== undefined && splitSearchTerms(options.search).length === 0) {
    throw new Error("--search требует непустой запрос")
  }
}
