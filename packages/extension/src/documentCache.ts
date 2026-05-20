import {
  ClientApplicationForm,
  ClientApplicationFormYAML,
  createEmptyClientApplicationForm,
  exportClientApplicationFormToJSONSchema,
  exportMetadataCatalogToJSONSchema,
  importClientApplicationFormFromYAML,
  importFromYAML,
} from "@nakidka/core"
import { TextDocument, Uri, workspace } from "vscode"
import { ConfigurationContext } from "~/metadata/context/types"

type FormDocumentCache = {
  versionYaml: number
  formPrefix: string
  yaml: ClientApplicationFormYAML
  form: ClientApplicationForm
  schema: string
}

const getConfigurationContext = (): ConfigurationContext => {
  return {
    defaultLanguage: "ru",
    version: "2.20",
  }
}

const SchemaMap = {
  "schema://catalog.json": JSON.stringify(
    exportMetadataCatalogToJSONSchema({
      context: getConfigurationContext(),
    })
  ),
} as const

const cache = new Map<string, FormDocumentCache>()

const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789"

const randomFormPrefix = (): string => {
  let s = "p"
  for (let i = 0; i < 5; i++) {
    s += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return s + "_"
}

export const getCanonicalUri = (uri: string): string => {
  return uri.replace(/\.yaml$/i, "")
}

export const getFormFromCache = async (
  document: TextDocument
): Promise<{ form: ClientApplicationForm; prefix: string }> => {
  const uri = document.uri.toString()
  const canonicalUri = getCanonicalUri(uri)

  if (!isYAMLDocument(document)) {
    throw new Error("Форма читается только из YAML")
  }

  const entry = await getOrCreateCacheByCanonicalUri({ canonicalUri, documentYAML: document })
  return { form: entry.form, prefix: entry.formPrefix }
}

export const getJSONSchemaUri = (uri: string): string => {
  if (!isFormUri(uri)) return `schema://catalog.json`
  const canonicalUri = getCanonicalUri(uri)
  return `schema://${canonicalUri}.json`
}

export const getJSONSchema = async (schemaUri: string): Promise<string> => {
  const schema = SchemaMap[schemaUri]
  if (schema !== undefined) return schema

  const canonicalUri = schemaUri.replace(/^schema:\/\//i, "").replace(/\.json$/i, "")
  const entry = await getOrCreateCacheByCanonicalUri({ canonicalUri })

  return entry.schema
}

const isFormUri = (uri: string): boolean => {
  const decoded = decodeURI(uri)
  if (decoded.endsWith(".yaml")) return decoded.includes("/Формы/")
  return false
}

const getOrCreateCacheByCanonicalUri = async (params: {
  canonicalUri: string
  documentYAML?: TextDocument
}): Promise<FormDocumentCache> => {
  const { canonicalUri, documentYAML } = params

  let entry = cache.get(canonicalUri)

  if (!entry) {
    const form = createEmptyClientApplicationForm()
    entry = {
      versionYaml: -1,
      formPrefix: randomFormPrefix(),
      yaml: {},
      form,
      schema: createJSONSchema(form),
    }
    cache.set(canonicalUri, entry)
  }

  const docYAML = documentYAML ?? (await findDocumentById(getYAMLUri(canonicalUri)))

  const docYAMLVersion = docYAML?.version ?? -1

  const isYAMLChanged = docYAMLVersion > entry.versionYaml

  if (isYAMLChanged) {
    await updateYamlCache(entry, docYAML)
    await updateForm(entry)
    updateJSONSchema(entry)
  }

  return entry
}

const getYAMLUri = (canonicalUri: string): string => {
  return canonicalUri + ".yaml"
}

const findDocumentById = async (id: string): Promise<TextDocument | undefined> => {
  const open = workspace.textDocuments.find((d) => d.uri.toString() === id)
  if (open) return open
  try {
    return await workspace.openTextDocument(Uri.parse(id))
  } catch {
    return undefined
  }
}

function isYAMLDocument(document: TextDocument): boolean {
  return document.languageId === "yaml"
}

const createJSONSchema = (form: ClientApplicationForm): string => {
  const schema = exportClientApplicationFormToJSONSchema({
    context: getConfigurationContext(),
    value: form,
  })
  return JSON.stringify(schema)
}

const updateJSONSchema = (entry: FormDocumentCache): void => {
  entry.schema = createJSONSchema(entry.form)
}

const updateYamlCache = async (entry: FormDocumentCache, document: TextDocument): Promise<void> => {
  if (document.version === entry.versionYaml) return

  entry.versionYaml = document.version

  const yamlString = document.getText()

  const yaml = await importFromYAML<ClientApplicationFormYAML>(yamlString)

  entry.yaml = yaml
}

const updateForm = async (entry: FormDocumentCache): Promise<void> => {
  const context: ConfigurationContext = getConfigurationContext()
  entry.form = importClientApplicationFormFromYAML(context, entry.yaml, createEmptyClientApplicationForm())
}
