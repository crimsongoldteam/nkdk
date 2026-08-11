import { defineMetadataRules } from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import * as systemEnumerationExports from "./types"

type EnumerationTables = Record<string, Readonly<Record<string, string>> | undefined>

const tables = systemEnumerationExports as unknown as EnumerationTables
const systemEnumerations: Record<string, {
  readonly fromYAML: Readonly<Record<string, string>>
  readonly toYAML: Readonly<Record<string, string>>
}> = {}

for (const [exportName, fromYAML] of Object.entries(tables)) {
  if (!exportName.endsWith("FromYAML") || fromYAML === undefined) continue
  const name = exportName.slice(0, -"FromYAML".length)
  const toYAML = tables[`${name}ToYAML`]
  if (toYAML === undefined) throw new Error(`System enumeration ${name} has no ToYAML table`)
  systemEnumerations[name] = { fromYAML, toYAML }
}

export const systemEnumerationRules = defineMetadataRules({
  ...emptyMetadataRules,
  systemEnumerations,
})
