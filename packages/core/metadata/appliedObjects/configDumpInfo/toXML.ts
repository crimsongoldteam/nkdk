import { ConfigurationContext } from "~/metadata/context/types"
import {
  ConfigDumpInfoConfigVersionMap,
  ConfigDumpInfoIdMap,
  ConfigDumpInfoMetadataInnerXML,
  ConfigDumpInfoMetadataXML,
  ConfigDumpInfoXML,
} from "./types"

export const exportConfigDumpInfoToXML = (params: {
  context: ConfigurationContext
  idMap: ConfigDumpInfoIdMap
  configVersionMap: ConfigDumpInfoConfigVersionMap
}): ConfigDumpInfoXML => {
  const { context, idMap, configVersionMap } = params

  if (!context.version) {
    throw new Error("Version is required")
  }

  const rootMetadata = buildMetadataNodes("", idMap, configVersionMap)
  return {
    ...getRootAttributes(context),
    ConfigVersions: {
      Metadata: rootMetadata.length === 1 ? rootMetadata[0] : rootMetadata,
    },
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

function buildInnerMetadataNodes(parentKey: string, idMap: ConfigDumpInfoIdMap): ConfigDumpInfoMetadataInnerXML[] {
  const children = idMap.get(parentKey)
  if (children === undefined || children.size === 0) return []
  return [...children].map(([name, id]) => ({ _name: name, _id: id }))
}

function buildMetadataNodes(
  parentKey: string,
  idMap: ConfigDumpInfoIdMap,
  configVersionMap: ConfigDumpInfoConfigVersionMap
): ConfigDumpInfoMetadataXML[] {
  const children = idMap.get(parentKey)
  if (children === undefined || children.size === 0) return []

  return [...children].map(([name, id]) => {
    const configVersion = configVersionMap.get(name)
    if (configVersion === undefined) throw new Error("Config version is required")
    const nested = buildInnerMetadataNodes(name, idMap)
    const node: ConfigDumpInfoMetadataXML = { _name: name, _id: id, _configVersion: configVersion }
    if (nested.length > 0) node.Metadata = nested
    return node
  })
}
