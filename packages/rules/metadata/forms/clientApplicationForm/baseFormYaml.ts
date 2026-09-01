import {
  childSegmentUid,
  copyYAMLRuntimeMetadata,
  copyYAMLRuntimeMetadataDeep,
  createXmlAnomalyAnnotations,
  type XmlAnomalyAnnotationTable,
} from "@nkdk/runtime"
import {
  getConfigurationIndexCollectionContext,
  withConfigurationIndexCollector,
} from "@nkdk/runtime"
import {
  createConfigurationIndexCollector,
  type ConfigurationIndexCollector,
} from "@nkdk/runtime"
import type { ExternalFileEntry } from "@nkdk/runtime"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import { createDeferredValuePathCollector, type DeferredValuePath } from "@nkdk/runtime/rule-kit"
import type { LocalIndexes, MetadataItemRule } from "../../ruleRuntime"
import {
  asExplicitYAMLStringIfMarked,
  isExplicitYAMLString,
  markDoubleQuotedScalar,
  unwrapExplicitYAMLString,
} from "@nkdk/runtime"
import { createFormDataPathIndexFromYAML } from "./formDataPathMetadata"
import { importClientApplicationFormBodyFromXML } from "./fromXMLToYAML"
import { ClientApplicationFormRules } from "./rules"
import type { ClientApplicationFormXML } from "./types"

export interface ImportedBaseFormYaml {
  readonly yaml: unknown
  readonly annotations: XmlAnomalyAnnotationTable
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
  const importedAnnotations = createXmlAnomalyAnnotations()
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
    annotations: importedAnnotations,
  })
  const yaml = normalizeBaseFormYaml(imported.yaml)
  const annotations = createXmlAnomalyAnnotations()
  copyYAMLRuntimeMetadataDeep({
    source: imported.yaml,
    target: yaml,
    sourceAnnotations: importedAnnotations,
    targetAnnotations: annotations,
  })
  const localIndexes = localIndexesCollector.finish()
  localIndexes.metadata.formDataPathIndex = createFormDataPathIndexFromYAML(yaml)
  return {
    yaml,
    annotations,
    localIndexes,
    deferred: deferred.finish(),
    generatedFiles: imported.generatedFiles,
    configurationIndexCollector,
  }
}

export function normalizeBaseFormYaml(value: unknown): unknown {
  if (isExplicitYAMLString(value)) return value
  if (Array.isArray(value)) {
    const normalized = value.map((child) => normalizeBaseFormYaml(child))
    copyYAMLRuntimeMetadata(value, normalized)
    value.forEach((child, index) => {
      if (isExplicitYAMLString(asExplicitYAMLStringIfMarked(value, index, child))) {
        markDoubleQuotedScalar(normalized, index)
      }
    })
    return normalized
  }
  if (!isRecord(value)) return value

  const normalized: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value)) {
    if (isXmlServiceKey(key)) continue
    normalized[key] = normalizeBaseFormYaml(child)
    if (isExplicitYAMLString(asExplicitYAMLStringIfMarked(value, key, child))) {
      markDoubleQuotedScalar(normalized, key)
    }
  }
  copyYAMLRuntimeMetadata(value, normalized)
  return normalized
}

export function equalBaseFormYaml(left: unknown, right: unknown): boolean {
  return equalNormalizedValues(normalizeBaseFormYaml(left), normalizeBaseFormYaml(right))
}

function equalNormalizedValues(left: unknown, right: unknown): boolean {
  left = unwrapExplicitYAMLString(left)
  right = unwrapExplicitYAMLString(right)
  if (Object.is(left, right)) return true
  if (
    (left === undefined && isEmptyRecord(right))
    || (right === undefined && isEmptyRecord(left))
  ) return true
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

function isEmptyRecord(value: unknown): boolean {
  return isRecord(value) && Object.keys(value).length === 0
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
