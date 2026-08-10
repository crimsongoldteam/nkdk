import { MetadataHTTPService, MetadataHTTPServiceYAML } from "../types"

export const minimal: MetadataHTTPService = {
  itemType: "MetadataHTTPService",
  name: "HTTPСервисПоУмолчанию",
  synonym: { items: { ru: "HTTPСервис по умолчанию" } },
  rootURL: "default",
}

export const minimalYAML: MetadataHTTPServiceYAML = {
  КорневойURL: "default",
}
