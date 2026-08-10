import type { ExternalMetadataItemRule } from "../ruleRuntime/externalMetadata/types"
import type { MetadataItemType } from "../ruleRuntime/metadataItem/registry"
import type { ConfigurationContextWithExportToXML } from "./types"

export function getChildContextToXML(params: {
  context: ConfigurationContextWithExportToXML
  itemType: MetadataItemType
  path: string
  name: string
  externalMetadata?: ExternalMetadataItemRule
}): ConfigurationContextWithExportToXML {
  const { context, itemType, path, name, externalMetadata } = params
  return {
    ...context,
    exportToXML: {
      ...context.exportToXML,
      itemsTree: [
        ...context.exportToXML.itemsTree,
        {
          name,
          itemType,
          path,
          ...(externalMetadata ? { externalMetadata } : {}),
        },
      ],
    },
  }
}
