import Ajv2020 from "ajv/dist/2020.js"
import { _ } from "ajv/dist/compile/codegen/index.js"
import standaloneCode from "ajv/dist/standalone/index.js"
import addFormats from "ajv-formats"
import { writeFile } from "node:fs/promises"
import { prepareSchemaForAjv } from "./compileValidationSchema"
import {
  createProjectValidationStandaloneSchemaSet,
  defaultStandaloneValidationContext,
} from "./projectValidationStandaloneSchemas"

const undefinedKeyword = "x-nkdk-undefined"

export async function generateProjectValidationAjvStandalone(params: { outfile: string }): Promise<void> {
  const schemaSet = createProjectValidationStandaloneSchemaSet(defaultStandaloneValidationContext)
  const refs = Object.fromEntries(
    Object.entries(schemaSet.refs).map(([id, sourceSchema]) => [id, withSchemaId(prepareSchemaForAjv(sourceSchema), id)])
  )
  const formSchema = withSchemaId(prepareSchemaForAjv(schemaSet.form), "nkdk://validation/form")
  const validators: Record<string, { schema: object; schemaId: string }> = {
    validateForm: { schema: formSchema, schemaId: formSchema.$id },
  }

  const entries: Array<{ dir: string; exportName: string; schema: unknown }> = []
  let index = 0
  for (const [dir, sourceSchema] of Object.entries(schemaSet.byProjectDir)) {
    const exportName = `validateProperties${index}`
    const schema = withSchemaId(
      prepareSchemaForAjv(sourceSchema),
      `nkdk://validation/properties/${encodeURIComponent(dir)}`
    )
    validators[exportName] = { schema, schemaId: schema.$id }
    entries.push({ dir, exportName, schema })
    index += 1
  }

  const validatorsCode = createStandaloneValidatorsCode({ refs, validators })
  const moduleCode = [
    validatorsCode,
    "",
    "const module = {",
    '  format: "project-validation-ajv-standalone-v1",',
    `  context: ${JSON.stringify(schemaSet.context)},`,
    `  refs: ${JSON.stringify(refs)},`,
    `  form: { schema: ${JSON.stringify(formSchema)}, validate: validateForm },`,
    "  byProjectDir: {",
    ...entries.map(
      (entry) =>
        `    ${JSON.stringify(entry.dir)}: { schema: ${JSON.stringify(entry.schema)}, validate: ${
          entry.exportName
        } },`
    ),
    "  },",
    "}",
    "",
    "export default module",
    "",
  ].join("\n")

  await writeFile(params.outfile, moduleCode, "utf8")
}

function withSchemaId<T extends object>(schema: T, id: string): T & { $id: string } {
  return { ...schema, $id: id }
}

function createStandaloneValidatorsCode(params: {
  refs: Record<string, object>
  validators: Record<string, { schema: object; schemaId: string }>
}): string {
  const ajv = new Ajv2020({
    addUsedSchema: false,
    allowUnionTypes: true,
    allErrors: false,
    code: { esm: true, source: true },
    discriminator: true,
    inlineRefs: false,
    strict: false,
    verbose: true,
  })
  addFormats(ajv)
  ajv.addKeyword({
    keyword: undefinedKeyword,
    metaSchema: { type: "boolean" },
    code(cxt) {
      cxt.fail(_`${cxt.schema} && ${cxt.data} !== undefined`)
    },
  })

  for (const [id, schema] of Object.entries(params.refs)) {
    ajv.addSchema(schema, id)
  }
  for (const { schema, schemaId } of Object.values(params.validators)) {
    ajv.addSchema(schema, schemaId)
  }

  const exports = Object.fromEntries(
    Object.entries(params.validators).map(([exportName, validator]) => [exportName, validator.schemaId])
  )
  return normalizeStandaloneCodeForEsm(standaloneCode(ajv, exports)).replace('"use strict";', "").trim()
}

function normalizeStandaloneCodeForEsm(code: string): string {
  const imports: string[] = []
  let normalized = code.replace(
    /const (func\d+) = require\("ajv\/dist\/runtime\/equal"\)\.default;/g,
    (_match, name: string) => {
      if (!imports.includes('import equalModule from "ajv/dist/runtime/equal.js"')) {
        imports.push('import equalModule from "ajv/dist/runtime/equal.js"')
      }
      return `const ${name} = equalModule.default;`
    }
  )
  normalized = normalized.replace(
    /const (func\d+) = require\("ajv\/dist\/runtime\/ucs2length"\)\.default;/g,
    (_match, name: string) => {
      if (!imports.includes('import ucs2lengthModule from "ajv/dist/runtime/ucs2length.js"')) {
        imports.push('import ucs2lengthModule from "ajv/dist/runtime/ucs2length.js"')
      }
      return `const ${name} = ucs2lengthModule.default;`
    }
  )

  return imports.length === 0 ? normalized : `${imports.join("\n")}\n${normalized}`
}
