// import { TextDocument } from "vscode"

import { ClientApplicationForm } from "@nakidka/core"
import { TextDocument } from "vscode"

type NkdkDocumentCache = {
  versionNkdk: number
  versionYaml: number
  formNkdk?: ClientApplicationForm
  formYaml?: ClientApplicationForm
}

const cache = new Map<string, NkdkDocumentCache>()

export const ensureCache = (document: TextDocument) => {
  const cacheKey = document.uri.toString()

  const pairedDocumentUri = getPairedDocumentUri(document)

  //   if (isYAMLDocument(document)) {
  //     cache.versionYaml = document.version
  //   } else {
  //     cache.versionNkdk = document.version
  //   }
}

const getCache = (document: TextDocument) => {
  if (isYAMLDocument(document)) {
    return yamlCache
  }
  return nkdkCache
}

const isYAMLDocument = (document: TextDocument) => {
  return document.languageId === "yaml"
}

const getOrCreateCacheByDocument = (document: TextDocument): NkdkDocumentCache => {
  const cacheKey = document.uri.toString()
  if (!cache.has(cacheKey)) {
    const newCache = {
      versionNkdk: -1,
      versionYaml: -1,
      formNkdk: undefined,
      formYaml: undefined,
    } satisfies NkdkDocumentCache
    cache.set(cacheKey, newCache)
  }
  const cacheEntry = cache.get(cacheKey)

  //   const newCache = {
  //     versionNkdk: -1,
  //     versionYaml: -1,
  //     formNkdk: undefined,
  //     formYaml: undefined,
  //   }
  //   cache.set(cacheKey, newCache)
  return cacheEntry
}

const getPairedDocumentUri = (document: TextDocument): string =>
  document.uri.toString().replace(/\.(yaml|nkdk)$/i, (_, ext) => (ext.toLowerCase() === "yaml" ? ".nkdk" : ".yaml"))
