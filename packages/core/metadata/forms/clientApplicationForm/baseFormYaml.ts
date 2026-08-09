import { childSegmentUid } from "../../configurationIndex/logicalAddress"
import {
  getConfigurationIndexCollectionContext,
  withConfigurationIndexCollector,
} from "../../configurationIndex/collector/context"
import {
  createConfigurationIndexCollector,
  type ConfigurationIndexCollector,
} from "../../configurationIndex/collector/writer"
import type { ExternalFileEntry } from "../../context/types"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import { createDeferredValuePathCollector, type DeferredValuePath } from "../../ruleRuntime/property/importYamlTypes"
import type { LocalIndexes, MetadataItemRule } from "../../ruleRuntime"
import { createFormDataPathIndexFromYAML } from "./formDataPathMetadata"
import { importClientApplicationFormBodyFromXML } from "./fromXMLToYAML"
import { ClientApplicationFormRules } from "./rules"
import type { ClientApplicationFormXML } from "./types"

export interface ImportedBaseFormYaml {
  readonly yaml: unknown
  readonly localIndexes: LocalIndexes
  readonly deferred: readonly DeferredValuePath[]
  readonly generatedFiles: readonly ExternalFileEntry[]
  readonly configurationIndexCollector: ConfigurationIndexCollector
}

export function importBaseFormYaml(params: {
  context: Parameters<typeof importClientApplicationFormBodyFromXML>[0]["context"]
  baseFormXML: ClientApplicationFormXML
  formName: string
  rule?: MetadataItemRule
}): ImportedBaseFormYaml {
  const configurationIndexCollector = createConfigurationIndexCollector()
  const currentCollection = getConfigurationIndexCollectionContext(params.context)
  const formLogicalAddress = currentCollection?.logicalAddress ?? params.formName
  const context = withConfigurationIndexCollector(
    params.context,
    configurationIndexCollector,
    childSegmentUid(formLogicalAddress, "ОсноваФормы"),
  )
  const localIndexesCollector = createLocalIndexesCollector()
  const deferred = createDeferredValuePathCollector()
  const imported = importClientApplicationFormBodyFromXML({
    context,
    formName: params.formName,
    formXML: params.baseFormXML,
    rule: params.rule ?? ClientApplicationFormRules,
    collector: localIndexesCollector,
    deferred,
  })
  const yaml = normalizeBaseFormYaml(imported.yaml)
  const localIndexes = localIndexesCollector.finish()
  localIndexes.metadata.formDataPathIndex = createFormDataPathIndexFromYAML(yaml)
  return {
    yaml,
    localIndexes,
    deferred: deferred.finish(),
    generatedFiles: imported.generatedFiles,
    configurationIndexCollector,
  }
}

export function normalizeBaseFormYaml(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeBaseFormYaml)
  if (!isRecord(value)) return value

  const normalized: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value)) {
    if (isXmlServiceKey(key) || child === undefined) continue
    normalized[key] = normalizeBaseFormYaml(child)
  }
  return normalized
}

export function equalBaseFormYaml(left: unknown, right: unknown): boolean {
  return equalNormalizedValues(normalizeBaseFormYaml(left), normalizeBaseFormYaml(right))
}

function equalNormalizedValues(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) => equalNormalizedValues(value, right[index]))
  }
  if (!isRecord(left) || !isRecord(right)) return false
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key) => Object.hasOwn(right, key) && equalNormalizedValues(left[key], right[key]))
}

function isXmlServiceKey(key: string): boolean {
  return key === "_id"
    || key === "_uuid"
    || key === "_version"
    || key === "_xmlns"
    || key.startsWith("_xmlns:")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
