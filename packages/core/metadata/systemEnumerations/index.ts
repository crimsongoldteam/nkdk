import {
  getRegisteredSystemEnumerationNames,
  registerSystemEnumeration,
} from "../orchestration/property/systemEnumerationRegistry"
import * as systemEnumerationExports from "./types"

type EnumerationTables = Record<string, Readonly<Record<string, string>> | undefined>

const systemEnumerationTables = systemEnumerationExports as unknown as EnumerationTables

for (const [exportName, fromYAML] of Object.entries(systemEnumerationTables)) {
  if (!exportName.endsWith("FromYAML") || fromYAML === undefined) continue
  const name = exportName.slice(0, -"FromYAML".length)
  const toYAML = systemEnumerationTables[`${name}ToYAML`]
  if (toYAML === undefined) {
    throw new Error(`System enumeration ${name} has no ToYAML table`)
  }
  registerSystemEnumeration(name, { fromYAML, toYAML })
}

export { getRegisteredSystemEnumerationNames }

import "./fromXML"
import "./fromYAML"
import "./toEnterprise"
import "./toJSONSchema"
import "./toXML"
import "./toYAML"
