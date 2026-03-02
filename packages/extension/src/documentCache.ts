import {
  ClientApplicationForm,
  ClientApplicationFormYAML,
  importClientApplicationFormFromYAML,
  importClientApplicationFromFromNKDK,
  importFromYAML,
} from "@nakidka/core"
import { EmptyFileSystem } from "langium"
import { parseHelper } from "langium/test"
import { createNkdkServices, type Form as NkdkForm } from "nkdk-language"
import { TextDocument, workspace } from "vscode"
import { ConfigurationContext } from "~/metadata/context/types"

const nkdkServices = createNkdkServices(EmptyFileSystem)
const parseNkdk = parseHelper<NkdkForm>(nkdkServices.Nkdk)

type NkdkDocumentCache = {
  versionNkdk: number
  versionYaml: number
  formNkdk: ClientApplicationForm
  yaml: ClientApplicationFormYAML
  form: ClientApplicationForm
  schema: string
}

const cache = new Map<string, NkdkDocumentCache>()

export function getOrCreateCache(document: TextDocument): NkdkDocumentCache {
  const uri = document.uri.toString()
  const canonicalUri = getCanonicalUri(uri)

  const isYAML = isYAMLDocument(document)
  const documentYAML = isYAML ? document : undefined
  const documentNKDK = isYAML ? undefined : document

  return getOrCreateCacheByCanonicalUri({ canonicalUri, documentYAML, documentNKDK })
}

export const getCanonicalUri = (uri: string): string => {
  return uri.replace(/\.(yaml|nkdk)$/i, ".json")
}

export const getJSONSchema = (canonicalUri: string): string => {
  const entry = getOrCreateCacheByCanonicalUri({ canonicalUri })

  return entry.schema
}

export const getOrCreateCacheByCanonicalUri = (params: {
  canonicalUri: string
  documentNKDK?: TextDocument
  documentYAML?: TextDocument
}): NkdkDocumentCache => {
  const { canonicalUri, documentNKDK, documentYAML } = params

  let entry = cache.get(canonicalUri)

  if (!entry) {
    entry = {
      versionNkdk: -1,
      versionYaml: -1,
      formNkdk: createEmptyClientApplicationForm(),
      yaml: {},
      form: createEmptyClientApplicationForm(),
      schema: "",
    }
    cache.set(canonicalUri, entry)
  }

  const docNKDK = documentNKDK ?? findDocumentById(getNKDKUri(canonicalUri))
  const docYAML = documentYAML ?? findDocumentById(getYAMLUri(canonicalUri))

  const docNKDKVersion = docNKDK?.version ?? -1
  const docYAMLVersion = docYAML?.version ?? -1

  if (docNKDKVersion > entry.versionNkdk) {
    updateNkdkCache(entry, docNKDK)
  }

  if (docYAMLVersion > entry.versionYaml) {
    updateYamlCache(entry, docYAML)
  }

  if (docNKDKVersion > entry.versionNkdk || docYAMLVersion > entry.versionYaml) {
    updateForm(entry)
  }

  return entry
}

const getNKDKUri = (canonicalUri: string): string => {
  return canonicalUri.replace(/\.json$/i, ".yaml")
}

const getYAMLUri = (canonicalUri: string): string => {
  return canonicalUri.replace(/\.json$/i, ".nkdk")
}

const findDocumentById = (id: string): TextDocument | undefined => {
  return workspace.textDocuments.find((d) => d.uri.toString() === id)
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

  const form = importClientApplicationFromFromNKDK({ context: context, value: nkdkAst })
  if (!form) throw new Error("Не удалось импортировать форму из NKDK")

  entry.formNkdk = form
}

function updateYamlCache(entry: NkdkDocumentCache, document: TextDocument): void {
  if (document.version === entry.versionYaml) return

  entry.versionYaml = document.version

  const yamlString = document.getText()

  const yaml = importFromYAML(yamlString)

  entry.yaml = yaml
}

const updateForm = (entry: NkdkDocumentCache): void => {
  const context: ConfigurationContext = getConfigurationContext()
  entry.form = importClientApplicationFormFromYAML(context, entry.yaml, entry.formNkdk)
}

const createEmptyClientApplicationForm = (): ClientApplicationForm => {
  return { itemType: "ClientApplicationForm", childItems: [], commands: [] }
}

const getConfigurationContext = (): ConfigurationContext => {
  return {
    defaultLanguage: "ru",
  }
}
