import { ConfigurationContext } from "~/metadata/context/types"
import { ConfigDumpInfo, ConfigDumpInfoXML } from "./types"

export const importConfigDumpInfoFromXML = (params: {
  context: ConfigurationContext
  xml: ConfigDumpInfoXML
}): ConfigDumpInfo => {
  const { xml } = params
  const idMap: ConfigDumpInfo = new Map()

  const rootList = toList(xml.ConfigVersions?.Metadata)
  for (const root of rootList) {
    const rootInner = { children: new Map<string, string>(), id: root._id, configVersion: root._configVersion }

    idMap.set(root._name, rootInner)

    const children = toList(root.Metadata)
    for (const child of children) {
      rootInner.children.set(child._name, child._id)
    }
  }
  return idMap
}

function toList<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) return []
  return Array.isArray(v) ? v : [v]
}
