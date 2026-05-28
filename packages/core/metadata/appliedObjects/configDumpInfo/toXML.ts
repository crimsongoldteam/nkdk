import { ConfigurationContext } from "~/metadata/context/types"
import { ConfigDumpInfo, ConfigDumpInfoMetadataInnerXML, ConfigDumpInfoMetadataXML, ConfigDumpInfoXML } from "./types"

export const exportConfigDumpInfoToXML = (params: {
  context: ConfigurationContext
  idMap: ConfigDumpInfo
}): ConfigDumpInfoXML => {
  const { context, idMap } = params

  if (!context.version) {
    throw new Error("Version is required")
  }

  const rootMetadata: ConfigDumpInfoMetadataXML[] = []
  for (const [name, { id, children, configVersion }] of idMap.entries()) {
    const innerMetadata: ConfigDumpInfoMetadataInnerXML[] = []
    for (const [name, id] of children.entries()) {
      innerMetadata.push({ _name: name, _id: id })
    }
    rootMetadata.push({
      _name: name,
      _id: id,
      ...(configVersion ? { _configVersion: configVersion } : {}),
      ...(innerMetadata.length > 0 ? { Metadata: innerMetadata } : {}),
    })
  }

  return {
    ...getRootAttributes(context),
    ConfigVersions: rootMetadata.length > 0 ? { Metadata: rootMetadata } : {},
  }
}

const getRootAttributes = (context: ConfigurationContext): Omit<ConfigDumpInfoXML, "ConfigVersions"> => {
  return {
    _xmlns: "http://v8.1c.ru/8.3/xcf/dumpinfo",
    "_xmlns:xen": "http://v8.1c.ru/8.3/xcf/enums",
    "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
    "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    _format: "Hierarchical",
    _version: context.version,
  }
}
