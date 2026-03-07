import { ConfigurationContext } from "~/metadata/context/types"
import { ConfigDumpInfoConfigVersionMap, ConfigDumpInfoIdMap, ConfigDumpInfoXML } from "./types"

export const importConfigDumpInfoFromXML = (params: {
  context: ConfigurationContext
  xml: ConfigDumpInfoXML
}): { idMap: ConfigDumpInfoIdMap; configVersionMap: ConfigDumpInfoConfigVersionMap } => {
  const { xml } = params
  const idMap: ConfigDumpInfoIdMap = new Map()
  const configVersionMap: ConfigDumpInfoConfigVersionMap = new Map()

  const rootList = toList(xml.ConfigVersions?.Metadata)
  for (const root of rootList) {
    const rootInner = ensureMap(idMap, "") as Map<string, string>
    rootInner.set(root._name, root._id)
    if (root._configVersion !== undefined) {
      configVersionMap.set(root._name, root._configVersion)
    }
    const children = toList(root.Metadata)
    for (const child of children) {
      const childInner = ensureMap(idMap, root._name) as Map<string, string>
      childInner.set(child._name, child._id)
    }
  }
  return { idMap, configVersionMap }
}

function toList<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) return []
  return Array.isArray(v) ? v : [v]
}

function ensureMap<K, V>(map: Map<K, V>, key: K): V {
  let inner = map.get(key)
  if (inner === undefined) {
    inner = new Map() as V
    map.set(key, inner)
  }
  return inner
}
