import {
  ClientApplicationForm,
  ClientApplicationFormYAML,
  exportClientApplicationFormToJSONSchema,
  exportMetadataCatalogToJSONSchema,
  importClientApplicationFormFromYAML,
  importClientApplicationFromFromNKDK,
  importFromYAML,
} from "@nakidka/core"
import { EmptyFileSystem } from "langium"
import { parseHelper } from "langium/test"
import { createNkdkServices, type Form as NkdkForm } from "nkdk-language"
import { TextDocument, Uri, workspace } from "vscode"
import { ConfigurationContext } from "~/metadata/context/types"

const nkdkServices = createNkdkServices(EmptyFileSystem)
const parseNkdk = parseHelper<NkdkForm>(nkdkServices.Nkdk)

type NkdkDocumentCache = {
  versionNkdk: number
  versionYaml: number
  formPrefix: string
  formNkdk: ClientApplicationForm
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

const cache = new Map<string, NkdkDocumentCache>()

const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789"

const randomFormPrefix = (): string => {
  let s = "p"
  for (let i = 0; i < 5; i++) {
    s += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return s + "_"
}

export const getCanonicalUri = (uri: string): string => {
  return uri.replace(/\.(yaml|nkdk)$/i, "")
}

export const getFormFromCache = async (
  document: TextDocument
): Promise<{ form: ClientApplicationForm; prefix: string }> => {
  const uri = document.uri.toString()
  const canonicalUri = getCanonicalUri(uri)

  const isYAML = isYAMLDocument(document)
  const documentYAML = isYAML ? document : undefined
  const documentNKDK = isYAML ? undefined : document

  const entry = await getOrCreateCacheByCanonicalUri({ canonicalUri, documentYAML, documentNKDK })
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
  if (decoded.endsWith(".nkdk")) return true
  if (decoded.endsWith(".yaml")) return decoded.includes("/Формы/")
  return false
}

const getOrCreateCacheByCanonicalUri = async (params: {
  canonicalUri: string
  documentNKDK?: TextDocument
  documentYAML?: TextDocument
}): Promise<NkdkDocumentCache> => {
  const { canonicalUri, documentNKDK, documentYAML } = params

  let entry = cache.get(canonicalUri)

  if (!entry) {
    entry = {
      versionNkdk: -1,
      versionYaml: -1,
      formPrefix: randomFormPrefix(),
      formNkdk: createEmptyClientApplicationForm(),
      yaml: {},
      form: createEmptyClientApplicationForm(),
      schema: "",
    }
    cache.set(canonicalUri, entry)
  }

  const docNKDK = documentNKDK ?? (await findDocumentById(getNKDKUri(canonicalUri)))
  const docYAML = documentYAML ?? (await findDocumentById(getYAMLUri(canonicalUri)))

  const docNKDKVersion = docNKDK?.version ?? -1
  const docYAMLVersion = docYAML?.version ?? -1

  const isNKDKChanged = docNKDKVersion > entry.versionNkdk
  const isYAMLChanged = docYAMLVersion > entry.versionYaml

  if (isNKDKChanged) {
    await updateNkdkCache(entry, docNKDK)
  }

  if (isYAMLChanged) {
    await updateYamlCache(entry, docYAML)
  }

  if (isNKDKChanged || isYAMLChanged) {
    await updateForm(entry)
  }

  return entry
}

const getNKDKUri = (canonicalUri: string): string => {
  return canonicalUri + ".nkdk"
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

const updateNkdkCache = async (entry: NkdkDocumentCache, document: TextDocument): Promise<void> => {
  if (document.version === entry.versionNkdk) return

  entry.versionNkdk = document.version

  const context: ConfigurationContext = getConfigurationContext()

  const nkdkString = document.getText()

  const parsedDocument = await parseNkdk(nkdkString)
  const nkdkAst = parsedDocument.parseResult?.value
  if (parsedDocument.parseResult.parserErrors.length > 0 || !nkdkAst) throw new Error("Ошибка разбора NKDK")

  const formNkdk = importClientApplicationFromFromNKDK({ context: context, value: nkdkAst })
  if (!formNkdk) throw new Error("Не удалось импортировать форму из NKDK")

  entry.formNkdk = formNkdk

  await updateJSONSchema(entry)
}

const updateJSONSchema = async (entry: NkdkDocumentCache): Promise<void> => {
  const schema = exportClientApplicationFormToJSONSchema({
    context: getConfigurationContext(),
    value: entry.formNkdk,
  })
  entry.schema = JSON.stringify(schema)
}

const updateYamlCache = async (entry: NkdkDocumentCache, document: TextDocument): Promise<void> => {
  if (document.version === entry.versionYaml) return

  entry.versionYaml = document.version

  const yamlString = document.getText()

  const yaml = await importFromYAML(yamlString)

  entry.yaml = yaml
}

const updateForm = async (entry: NkdkDocumentCache): Promise<void> => {
  const context: ConfigurationContext = getConfigurationContext()
  entry.form = importClientApplicationFormFromYAML(context, entry.yaml, entry.formNkdk)
}

const createEmptyClientApplicationForm = (): ClientApplicationForm => {
  return { itemType: "ClientApplicationForm", childItems: [], commands: [] }
}
