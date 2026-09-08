import {
  childSegmentUid,
  copyYAMLRuntimeMetadata,
  createXmlAnomalyAnnotations,
  type XmlAnomalyAnnotationTable,
  type XmlElementNode,
  type XmlImportAuditSession,
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
  baseFormXML: ClientApplicationFormXML | XmlElementNode
  formName: string
  rule?: MetadataItemRule
  annotations?: XmlAnomalyAnnotationTable
  audit?: XmlImportAuditSession
  dependencies?: Parameters<typeof importClientApplicationFormBodyFromXML>[0]["dependencies"]
  roundTrip?: Parameters<typeof importClientApplicationFormBodyFromXML>[0]["roundTrip"]
  beforeFinish?: (yaml: Record<string, unknown>) => void
}): ImportedBaseFormYaml {
  const importedAnnotations = params.annotations ?? createXmlAnomalyAnnotations()
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
    audit: params.audit,
    dependencies: params.dependencies,
    roundTrip: params.roundTrip,
    beforeFinish: (yaml) => {
      if (params.roundTrip === undefined) normalizeBaseFormYamlInPlace(yaml)
      params.beforeFinish?.(yaml)
    },
  })
  const yaml = imported.yaml
  const annotations = importedAnnotations
  const localIndexes = localIndexesCollector.finish()
  if (params.roundTrip === undefined) localIndexes.metadata.formDataPathIndex = createFormDataPathIndexFromYAML(yaml)
  return {
    yaml,
    annotations,
    localIndexes,
    deferred: deferred.finish(),
    generatedFiles: imported.generatedFiles,
    configurationIndexCollector,
  }
}

function normalizeBaseFormYamlInPlace(value: unknown): void {
  if (isExplicitYAMLString(value)) return
  if (Array.isArray(value)) {
    for (const child of value) normalizeBaseFormYamlInPlace(child)
    return
  }
  if (!isRecord(value)) return
  for (const [key, child] of Object.entries(value)) {
    if (isXmlServiceKey(key)) {
      delete value[key]
      continue
    }
    normalizeBaseFormYamlInPlace(child)
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
  return equalBaseFormValues(left, right)
}

function equalBaseFormValues(left: unknown, right: unknown): boolean {
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
      && left.every((value, index) => equalBaseFormValues(value, right[index]))
  }
  if (!isRecord(left) || !isRecord(right)) return false
  const leftKeys = Object.keys(left).filter(key => !isXmlServiceKey(key))
  const rightKeys = Object.keys(right).filter(key => !isXmlServiceKey(key))
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key) => Object.hasOwn(right, key) && equalBaseFormValues(left[key], right[key]))
}

function isEmptyRecord(value: unknown): boolean {
  return isRecord(value) && Object.keys(value).every(isXmlServiceKey)
}

export function isXmlServiceKey(key: string): boolean {
  return key === "_id"
    || key === "_uuid"
    || key === "_version"
    || key === "_xmlns"
    || key.startsWith("_xmlns:")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
