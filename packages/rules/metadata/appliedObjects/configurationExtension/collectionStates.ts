import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"

import {
  exportPredefinedExtensionState,
  importPredefinedExtensionState,
} from "../../commonObjects/predefinedItem/extensionState"

export function importConfigurationExtensionCollectionState(params: {
  readonly rule: MetadataItemRule
  readonly source: Record<string, unknown>
  readonly yaml: Record<string, unknown>
}): void {
  if (params.rule.properties.extensionState === undefined) return
  importPredefinedExtensionState(params.source, params.yaml)
}

export function exportConfigurationExtensionCollectionState(params: {
  readonly rule: MetadataItemRule
  readonly yaml: Readonly<Record<string, unknown>>
  readonly outputs: ReadonlyMap<string, Record<string, unknown>>
  readonly borrowed: boolean
}): void {
  const propertyRule = params.rule.properties.extensionState
  if (propertyRule === undefined) return
  const state = exportPredefinedExtensionState({ yaml: params.yaml, borrowed: params.borrowed })
  if (state === undefined) return
  const xmlName = propertyRule.xml ?? "ExtensionState"
  for (const output of params.outputs.values()) output[xmlName] = state
}
