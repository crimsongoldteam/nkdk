import { exportJSONSchemaForProjectFile } from "@nakidka/core"

export interface SchemaCommandOptions {
  project?: string
}

export const printJSONSchema = async (filePath: string, options: SchemaCommandOptions): Promise<void> => {
  const schema = exportJSONSchemaForProjectFile({
    context: {
      defaultLanguage: "ru",
      version: "2.20",
    },
    filePath,
    projectDir: options.project,
  })

  process.stdout.write(`${JSON.stringify(schema, null, 2)}\n`)
}
