import { exportJSONSchemaForProjectFile, exportJSONSchemaForSchemaName } from "@nakidka/core"

export interface SchemaCommandOptions {
  project?: string
  inline?: boolean
}

export const printJSONSchema = async (target: string, options: SchemaCommandOptions): Promise<void> => {
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

  process.stdout.write(`${JSON.stringify(schema, null, 2)}\n`)
}
