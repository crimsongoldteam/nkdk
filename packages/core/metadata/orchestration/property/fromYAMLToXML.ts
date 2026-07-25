import { asExplicitYAMLStringIfMarked } from "../../../yaml/explicitString"
import {
  getConfigurationIndexPropertyReferenceXMLValue,
  getConfigurationIndexPropertyOrder,
  getConfigurationIndexSourceXmlKey,
  getConfigurationIndexXmlNodeLogicalAddress,
  isConfigurationIndexPropertyPresent,
  withConfigurationIndexExportPropertyContext,
} from "../../configurationIndex/referenceView"
import type { MetadataTargetOwner } from "../../commonObjects/metadataTargets"
import type { ConfigurationContext, ConfigurationContextWithExportToXML } from "../../context/types"
import { metadataTargetOwnerFromRule, importStringMetadataTargetFromYAML } from "./metadataTargetString"
import { convertMetadataItemFromYAMLToXML } from "../metadataItem/fromYAMLToXML"
import { convertMetadataCollectionFromYAMLToXML } from "../metadataCollection/fromYAMLToXML"
import { toYAMLImportError, withYAMLImportDiagnostics } from "../yamlImportError"
import type {
  ExportToXMLFunction,
  ExportToXMLFunctionNew,
  ExportToYAMLFunction,
  ExportToYAMLFunctionNew,
  importFromYAMLFunction,
  ImportFromYAMLFunctionNew,
} from "./fn"
import {
  applyAutoRequiredXMLParents,
  collectAutoRequiredXMLParentRoot,
  getOrderedKeysToXML,
  getValueOrDefault,
} from "./helpers"
import { getYAMLToXMLPlan, type YAMLToXMLPlannedProperty } from "./fromYAMLToXMLPlan"
import type {
  YAMLPropertySource,
  YAMLToXMLExternalWriteFactory,
  YAMLToXMLOutputRequest,
  YAMLToXMLResult,
  YAMLToXMLProfile,
} from "./fromYAMLToXMLTypes"
import { getTypeRule } from "./typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "./types"
import { readExternalFile } from "../../forms/commonObjects/dynamicList/externalFile"
import type { DeferredValuePath } from "./deferredObjectValues"
import type { DeferredRulePathSegment } from "./importYamlTypes"

export interface ConvertPropertiesFromYAMLToXMLParams {
  readonly context: ConfigurationContextWithExportToXML
  readonly yaml: unknown
  readonly rule: MetadataItemRule
  readonly name?: string
  readonly namePropertyKey?: string
  readonly sourceItemName?: string
  readonly outputs: readonly YAMLToXMLOutputRequest[]
  readonly propertyValues?: ReadonlyMap<string, unknown>
  readonly sparseYAML?: true
  readonly omitDefaultsForSparseYAML?: true
  readonly externalWriteFactory?: YAMLToXMLExternalWriteFactory
  readonly profile?: YAMLToXMLProfile
  readonly rulePath?: readonly (string | number)[]
  readonly deferredRulePath?: readonly DeferredRulePathSegment[]
}

export interface AtomicFromYAMLParams {
  readonly handler?: importFromYAMLFunction | ImportFromYAMLFunctionNew
  readonly context: ConfigurationContext
  readonly rule: PropertyRule
  readonly value: unknown
  readonly referenceValue?: unknown
  readonly yaml?: unknown
  readonly name?: string
  readonly owner?: MetadataTargetOwner
}

export interface AtomicToXMLParams {
  readonly handler?: ExportToXMLFunction | ExportToXMLFunctionNew
  readonly context: ConfigurationContextWithExportToXML
  readonly rule: PropertyRule
  readonly value: unknown
  readonly referenceValue?: unknown
  readonly source?: YAMLPropertySource
  readonly propertyKey?: string
}

interface MutableOutput {
  readonly request: YAMLToXMLOutputRequest
  readonly xml: Record<string, unknown>
  readonly deferred: DeferredValuePath[]
}

interface ReferenceProperty {
  readonly exists: boolean
  readonly key?: string
  readonly value?: unknown
}

export function createYAMLPropertySource(params: {
  yaml: unknown
  rule: MetadataItemRule
  itemName?: string
  propertyValues?: ReadonlyMap<string, unknown>
  context?: ConfigurationContext
}): YAMLPropertySource {
  const yaml = asRecord(params.yaml)
  const externalValues = new Map<string, unknown>()
  const externalValue = (propertyKey: string): unknown => {
    if (externalValues.has(propertyKey)) return externalValues.get(propertyKey)
    const propertyRule = params.rule.properties[propertyKey]
    const formDir = params.context?.importFromYAML?.formDir
    const parentName = params.itemName ?? params.context?.importFromYAML?.parent?.name
    const value =
      propertyRule?.externalFile !== undefined && formDir !== undefined && parentName !== undefined
        ? readExternalFile(propertyRule.externalFile, parentName, formDir)
        : undefined
    externalValues.set(propertyKey, value)
    return value
  }
  return {
    itemName: params.itemName,
    has(propertyKey) {
      if (params.propertyValues?.has(propertyKey)) return true
      const yamlKey = params.rule.properties[propertyKey]?.yaml
      return (
        (typeof yamlKey === "string" && yaml !== undefined && Object.prototype.hasOwnProperty.call(yaml, yamlKey)) ||
        externalValue(propertyKey) !== undefined
      )
    },
    raw(propertyKey) {
      if (params.propertyValues?.has(propertyKey)) return params.propertyValues.get(propertyKey)
      const yamlKey = params.rule.properties[propertyKey]?.yaml
      if (typeof yamlKey === "string" && yaml !== undefined && Object.prototype.hasOwnProperty.call(yaml, yamlKey)) {
        return yaml[yamlKey]
      }
      return externalValue(propertyKey)
    },
    yamlKey(propertyKey) {
      return params.rule.properties[propertyKey]?.yaml
    },
  }
}

export function convertPropertiesFromYAMLToXML(params: ConvertPropertiesFromYAMLToXMLParams): YAMLToXMLResult {
  const yaml = asRecord(params.yaml)
  const source = createYAMLPropertySource({
    yaml,
    rule: params.rule,
    itemName: params.sourceItemName ?? params.name,
    propertyValues: params.propertyValues,
    context: params.context,
  })
  const outputs: MutableOutput[] = params.outputs.map((request) => ({ request, xml: {}, deferred: [] }))
  const autoRequiredXMLParentRoots = new Set<string>()
  const externalWrites = [] as import("./fromYAMLToXMLTypes").YAMLToXMLExternalWrite[]
  const owner = metadataTargetOwnerFromRule({
    itemRule: params.rule,
    name: params.name ?? params.sourceItemName,
    context: params.context,
  })
  const orderedKeys = getOrderedKeysToXML({
    context: params.context,
    rule: params.rule,
    referenceMetadata: undefined,
  })
  const planByKey = new Map(getYAMLToXMLPlan(params.rule).properties.map((planned) => [planned.propertyKey, planned]))
  if (params.externalWriteFactory !== undefined) {
    for (const propertyKey of planByKey.keys()) {
      if (!orderedKeys.includes(propertyKey)) orderedKeys.push(propertyKey)
    }
  }
  const indexOrder = new Map(
    getYAMLToXMLPlan(params.rule).properties.flatMap((planned) => {
      const output = params.outputs.find((request) => matchesOutputTag(planned.propertyRule, request))
      const context = output?.context ?? params.context
      const index = getConfigurationIndexPropertyOrder(context).indexOf(planned.propertyKey)
      return index < 0 ? [] : [[planned.propertyKey, index] as const]
    })
  )
  const referenceOrder = getReferencePropertyOrder({ outputs: params.outputs, planByKey })
  orderedKeys.sort((left, right) => {
    const byReference =
      (referenceOrder.get(left) ?? Number.MAX_SAFE_INTEGER) - (referenceOrder.get(right) ?? Number.MAX_SAFE_INTEGER)
    if (byReference !== 0) return byReference
    return (indexOrder.get(left) ?? Number.MAX_SAFE_INTEGER) - (indexOrder.get(right) ?? Number.MAX_SAFE_INTEGER)
  })
  const namePropertyKey = params.namePropertyKey ?? "name"

  for (const propertyKey of orderedKeys) {
    const planned = planByKey.get(propertyKey)
    if (planned === undefined) continue
    if (params.profile !== undefined) {
      params.profile.propertyCount++
      params.profile.propertyPaths.push(formatRulePath([...(params.rulePath ?? [params.rule.itemType]), propertyKey]))
    }
    const matchingOutputs = outputs.filter(({ request }) => matchesOutputTag(planned.propertyRule, request))
    const propertyContext = matchingOutputs[0]?.request.context ?? params.context
    const hasIndexedImplicitYAMLValue =
      !source.has(propertyKey) &&
      isConfigurationIndexPropertyPresent(propertyContext, propertyKey) &&
      Object.prototype.hasOwnProperty.call(planned.propertyRule, "implicitValueYAML") &&
      typeof planned.propertyRule.implicitValueYAML !== "function"
    const exportHandler = getTypeRule(planned.propertyRule.type, "exportToXML")
    const references = matchingOutputs.map(({ request }) =>
      readReferenceProperty({
        context: request.context ?? propertyContext,
        referenceXML: request.referenceXML,
        planned,
      })
    )
    if (params.externalWriteFactory !== undefined) {
      externalWrites.push(
        ...params.externalWriteFactory({
          context: propertyContext,
          yaml,
          source,
          name: params.name,
          propertyKey,
          propertyRule: planned.propertyRule,
          referenceValue: references[0]?.value,
        })
      )
    }
    if (
      params.sparseYAML === true &&
      propertyKey !== namePropertyKey &&
      !source.has(propertyKey) &&
      !references.some((reference) => reference.exists) &&
      planned.propertyRule.preserveFromReferenceXML !== true &&
      (!hasExplicitXMLDefault(planned.propertyRule) || params.omitDefaultsForSparseYAML === true)
    ) {
      continue
    }
    if (matchingOutputs.length === 0) continue

    if (isYAMLPropertyExportEnabled({ source, planned, context: propertyContext })) {
      collectAutoRequiredXMLParentRoot(planned.propertyRule, autoRequiredXMLParentRoots)
    }

    if (
      !source.has(propertyKey) &&
      !(planned.propertyKey === namePropertyKey && params.name !== undefined) &&
      matchingOutputs.every((output) => output.request.referenceXML !== undefined) &&
      references.every((reference) => !reference.exists) &&
      !requiresYAMLToXMLEvaluation(planned.propertyRule) &&
      !hasExplicitXMLDefault(planned.propertyRule)
    ) {
      continue
    }

    if (
      !source.has(propertyKey) &&
      !(planned.propertyKey === namePropertyKey && params.name !== undefined) &&
      planned.propertyRule.omitNonImplicitReferenceXMLWhenYAMLMissing === true &&
      Object.prototype.hasOwnProperty.call(planned.propertyRule, "implicitValueYAML") &&
      typeof planned.propertyRule.implicitValueYAML !== "function" &&
      references.every((reference) => reference.exists)
    ) {
      matchingOutputs.forEach((output, index) => {
        const reference = references[index]!
        const referenceValue = callAtomicFromXML({
          context: propertyContext,
          rule: planned.propertyRule,
          value: reference.value,
          name: params.name,
        })
        if (referenceValue === planned.propertyRule.implicitValueYAML) {
          writeXMLValue({ context: propertyContext, output, planned, value: reference.value, reference })
        }
      })
      continue
    }

    if (
      !source.has(propertyKey) &&
      !(planned.propertyKey === namePropertyKey && params.name !== undefined) &&
      planned.propertyRule.runtimeOnly !== true &&
      planned.propertyRule.syncExternalOnly !== true &&
      planned.propertyRule.filePath === undefined &&
      planned.propertyRule.preserveEmptyXML !== true &&
      planned.propertyRule.excludeIfEqualNameYAML !== true &&
      !hasIndexedImplicitYAMLValue &&
      getTypeRule(planned.propertyRule.type, "yamlToXMLNestedRule") === undefined &&
      !requiresYAMLToXMLEvaluation(planned.propertyRule) &&
      references.every((reference) => reference.exists) &&
      (!hasExplicitXMLDefault(planned.propertyRule) ||
        Object.prototype.hasOwnProperty.call(planned.propertyRule, "defaultValueXMLRaw") ||
        references.every((reference) => reference.value !== undefined))
    ) {
      matchingOutputs.forEach((output, index) => {
        const reference = references[index]!
        const value =
          reference.value === undefined &&
          Object.prototype.hasOwnProperty.call(planned.propertyRule, "defaultValueXMLRaw")
            ? planned.propertyRule.defaultValueXMLRaw
            : reference.value
        writeXMLValue({ context: propertyContext, output, planned, value, reference })
      })
      continue
    }

    if (!shouldConvertYAMLProperty({ source, planned, outputs: matchingOutputs, context: propertyContext })) continue

    if (
      planned.propertyRule.preserveFromReferenceXML === true &&
      planned.propertyRule.exportNilValue === true &&
      !source.has(propertyKey)
    ) {
      matchingOutputs.forEach((output, index) => {
        const reference = references[index]!
        if (!reference.exists) return
        if (reference.value === undefined) {
          writeXMLValue({
            context: propertyContext,
            output,
            planned,
            value: { "_xsi:nil": true },
            reference,
          })
          return
        }
        const importedReference = callAtomicFromXML({
          context: propertyContext,
          rule: planned.propertyRule,
          value: reference.value,
          name: params.name,
        })
        if (
          (reference.value !== undefined && importedReference === reference.value) ||
          isNilXMLValue(reference.value)
        ) {
          writeXMLValue({ context: propertyContext, output, planned, value: reference.value, reference })
        }
      })
      continue
    }

    if (
      planned.propertyRule.preserveFromReferenceXML === true &&
      !source.has(propertyKey) &&
      !requiresYAMLToXMLEvaluation(planned.propertyRule)
    ) {
      matchingOutputs.forEach((output, index) => {
        const reference = references[index]!
        if (reference.exists)
          writeXMLValue({ context: propertyContext, output, planned, value: reference.value, reference })
      })
      continue
    }

    const nestedRule = getTypeRule(planned.propertyRule.type, "yamlToXMLNestedRule")
    if (nestedRule !== undefined && nestedRule.kind !== "externalFile") {
      const effectiveNestedRule =
        nestedRule.kind === "collection"
          ? {
              ...nestedRule,
              itemRule:
                params.rule.childCollections?.find((collection) => collection.propertyKey === propertyKey)?.itemRule ??
                nestedRule.itemRule,
            }
          : nestedRule
      const nestedPropertyContext = withConfigurationIndexExportPropertyContext(
        propertyContext,
        planned.yamlKey ?? planned.propertyKey,
        planned.propertyRule.configurationIndexUidSegment ?? planned.propertyRule.operationTarget?.migrationSegment,
        { configurationIndexAddressing: planned.propertyRule.configurationIndexAddressing }
      )
      const nestedContext =
        effectiveNestedRule.kind === "item" && effectiveNestedRule.resolveContext !== undefined
          ? effectiveNestedRule.resolveContext({
              context: nestedPropertyContext,
              name: params.name,
              propertyRule: planned.propertyRule,
            })
          : nestedPropertyContext
      const nestedItemContext =
        effectiveNestedRule.kind === "item" && effectiveNestedRule.resolveItemContext !== undefined
          ? effectiveNestedRule.resolveItemContext({
              context: nestedContext,
              name: params.name,
              propertyRule: planned.propertyRule,
            })
          : nestedContext
      const sourceNestedYAML =
        planned.propertyKey === namePropertyKey && params.name !== undefined && !source.has(propertyKey)
          ? params.name
          : source.raw(propertyKey)
      const nestedYAML =
        sourceNestedYAML === undefined &&
        effectiveNestedRule.kind === "item" &&
        (references.some((reference) => reference.exists && reference.value === undefined) ||
          nestedContext.exportToXML.configurationIndex?.identity("xmlId") !== undefined ||
          nestedContext.exportToXML.configurationIndex?.identity("xmlName") !== undefined)
          ? {}
          : sourceNestedYAML
      const hasNestedDefault =
        Object.prototype.hasOwnProperty.call(planned.propertyRule, "defaultValueXML") ||
        Object.prototype.hasOwnProperty.call(planned.propertyRule, "defaultValueXMLRaw") ||
        Object.prototype.hasOwnProperty.call(planned.propertyRule, "defaultValueXMLEmpty")
      if (nestedYAML === undefined && !references.some((reference) => reference.exists)) {
        continue
      }
      if (nestedYAML === undefined) {
        matchingOutputs.forEach((output, index) => {
          const reference = references[index]!
          if (reference.exists)
            writeXMLValue({ context: propertyContext, output, planned, value: reference.value, reference })
        })
        continue
      }
      if (
        nestedYAML === undefined &&
        effectiveNestedRule.kind === "collection" &&
        !hasNestedDefault &&
        planned.propertyRule.preserveFromReferenceXML !== true &&
        references.every((reference) => isEmptyCollectionReference(reference.value, effectiveNestedRule.xmlElement))
      ) {
        continue
      }
      const nestedOutputs = matchingOutputs.map((output, index) => ({
        key: output.request.key,
        referenceXML: references[index]?.value,
      }))
      const normalizedNestedYAML =
        effectiveNestedRule.kind === "item" && effectiveNestedRule.normalizeYAML !== undefined
          ? effectiveNestedRule.normalizeYAML({
              yaml: nestedYAML,
              name: params.name,
              propertyRule: planned.propertyRule,
            })
          : nestedYAML
      if (
        effectiveNestedRule.kind === "collection" &&
        Array.isArray(nestedYAML) &&
        nestedYAML.length === 0 &&
        Object.prototype.hasOwnProperty.call(planned.propertyRule, "defaultValueXMLRaw")
      ) {
        matchingOutputs.forEach((output, index) =>
          writeXMLValue({ context: propertyContext, output, planned, value: [], reference: references[index]! })
        )
        continue
      }
      if (
        effectiveNestedRule.kind === "collection" &&
        Array.isArray(nestedYAML) &&
        nestedYAML.length === 0 &&
        !hasNestedDefault
      ) {
        continue
      }
      const nested =
        effectiveNestedRule.kind === "collection"
          ? convertMetadataCollectionFromYAMLToXML({
              context: nestedContext,
              yaml: nestedYAML,
              descriptor: effectiveNestedRule,
              propertyRule: planned.propertyRule,
              source,
              outputs: nestedOutputs,
              externalWriteFactory: params.externalWriteFactory,
              profile: params.profile,
              rulePath: [...(params.rulePath ?? [params.rule.itemType]), propertyKey],
              deferredRulePath: [...(params.deferredRulePath ?? []), { propertyKey }],
            })
          : convertMetadataItemFromYAMLToXML({
              context: nestedItemContext,
              yaml: normalizedNestedYAML,
              rule:
                effectiveNestedRule.kind === "item"
                  ? effectiveNestedRule.itemRule
                  : effectiveNestedRule.resolveItemRule({ yaml: asRecord(nestedYAML) ?? {}, name: params.name ?? "" }),
              name:
                effectiveNestedRule.kind === "item" && effectiveNestedRule.injectOwnerName === true
                  ? params.name
                  : undefined,
              sourceItemName: params.name,
              outputs: nestedOutputs,
              sparseYAML: effectiveNestedRule.kind === "item" ? effectiveNestedRule.sparseYAML : undefined,
              externalWriteFactory: params.externalWriteFactory,
              ownerYAML: { itemType: params.rule.itemType },
              profile: params.profile,
              rulePath: [...(params.rulePath ?? [params.rule.itemType]), propertyKey],
              deferredRulePath: [...(params.deferredRulePath ?? []), { propertyKey }],
            })
      if (effectiveNestedRule.kind !== "collection" && params.profile !== undefined) params.profile.nestedItemCount++
      externalWrites.push(...nested.externalWrites)
      matchingOutputs.forEach((output, index) => {
        if (effectiveNestedRule.kind === "collection" && !nested.outputs.has(output.request.key)) return
        const reference = references[index]!
        let value: unknown = nested.outputs.get(output.request.key)
        if (
          effectiveNestedRule.kind === "item" &&
          effectiveNestedRule.transformOutput !== undefined &&
          isRecord(value)
        ) {
          value = effectiveNestedRule.transformOutput({
            context: nestedContext,
            xml: value,
            yaml: nestedYAML,
            referenceXML: isRecord(references[index]?.value) ? references[index]?.value : undefined,
            propertyRule: planned.propertyRule,
            source,
          })
        }
        if (
          effectiveNestedRule.kind === "collection" &&
          effectiveNestedRule.xmlElement !== undefined &&
          planned.propertyRule.xml === effectiveNestedRule.xmlElement &&
          isRecord(value)
        ) {
          value = value[effectiveNestedRule.xmlElement]
        }
        const valuePath = writeXMLValue({ context: propertyContext, output, planned, value, reference })
        if (valuePath !== undefined) {
          for (const deferred of nested.deferredByOutput.get(output.request.key) ?? []) {
            output.deferred.push({ ...deferred, valuePath: [...valuePath, ...deferred.valuePath] })
          }
        }
      })
      continue
    }

    const yamlKey = planned.yamlKey
    const hasYAMLValue =
      yamlKey !== undefined && yaml !== undefined && Object.prototype.hasOwnProperty.call(yaml, yamlKey)
    const sourceValue =
      planned.propertyKey === namePropertyKey && params.name !== undefined && !source.has(propertyKey)
        ? params.name
        : params.propertyValues?.has(propertyKey)
          ? source.raw(propertyKey)
          : hasIndexedImplicitYAMLValue
            ? planned.propertyRule.implicitValueYAML
            : hasYAMLValue
              ? restoreExplicitYAMLString({ yaml, yamlKey, rule: planned.propertyRule })
              : source.raw(propertyKey)
    const diagnosticContext = withYAMLImportDiagnostics(propertyContext, {
      propertyPath: [yamlKey ?? propertyKey],
      ...(yamlKey === undefined ? {} : { yamlPath: [yamlKey] }),
    }) as ConfigurationContextWithExportToXML
    let imported: unknown
    try {
      const atomicReferences = references.map((reference) =>
        reference.exists
          ? callAtomicFromXML({
              context: diagnosticContext,
              rule: planned.propertyRule,
              value: reference.value,
              name: params.name,
            })
          : undefined
      )
      const importParams: AtomicFromYAMLParams = {
        handler: getTypeRule(planned.propertyRule.type, "importFromYAML"),
        context: diagnosticContext,
        rule: planned.propertyRule,
        value: sourceValue,
        referenceValue: atomicReferences[0],
        yaml,
        name:
          !source.has(propertyKey) &&
          planned.propertyRule.excludeIfEqualNameYAML === true &&
          propertyContext.exportToXML.configurationIndex?.xmlNode() !== undefined &&
          !isConfigurationIndexPropertyPresent(propertyContext, propertyKey)
            ? undefined
            : params.name,
        owner,
      }
      imported = hasIndexedImplicitYAMLValue
        ? importIndexedImplicitYAMLValue(importParams)
        : callAtomicFromYAML(importParams)
      if (params.profile !== undefined) params.profile.atomicFromYAMLCount++
      if (
        source.has(propertyKey) &&
        propertyContext.exportToXML.configurationIndex?.xmlNode() !== undefined &&
        !isConfigurationIndexPropertyPresent(propertyContext, propertyKey) &&
        Object.prototype.hasOwnProperty.call(planned.propertyRule, "defaultValue") &&
        Object.is(
          imported,
          getValueOrDefault({
            context: diagnosticContext,
            rule: planned.propertyRule,
            value: undefined,
            yaml,
            name: params.name,
            operation: "importFromXML",
          })
        )
      ) {
        continue
      }

      matchingOutputs.forEach((output, index) => {
        const reference = references[index]!
        const outputContext = withConfigurationIndexExportPropertyContext(
          output.request.context ?? propertyContext,
          planned.yamlKey ?? planned.propertyKey,
          planned.propertyRule.configurationIndexUidSegment ?? planned.propertyRule.operationTarget?.migrationSegment,
          { configurationIndexAddressing: planned.propertyRule.configurationIndexAddressing }
        )
        const exported = callAtomicToXML({
          handler: exportHandler,
          context: outputContext,
          rule: planned.propertyRule,
          value: imported,
          referenceValue: atomicReferences[index],
          source,
          propertyKey,
        })
        if (params.profile !== undefined) params.profile.atomicToXMLCount++
        const valuePath = writeXMLValue({ context: outputContext, output, planned, value: exported, reference })
        if (valuePath !== undefined && getTypeRule(planned.propertyRule.type, "finalizeExportedXML") !== undefined) {
          output.deferred.push({
            valuePath,
            rulePath: [...(params.deferredRulePath ?? []), { propertyKey }],
          })
        }
      })
    } catch (error) {
      throw toYAMLImportError(error, diagnosticContext)
    }
  }

  for (const output of outputs) applyAutoRequiredXMLParents(output.xml, autoRequiredXMLParentRoots)
  return {
    outputs: new Map(outputs.map(({ request, xml }) => [request.key, xml])),
    deferredByOutput: new Map(outputs.map(({ request, deferred }) => [request.key, deferred])),
    externalWrites,
  }
}

function formatRulePath(path: readonly (string | number)[]): string {
  return path.map(String).join("/")
}

function isEmptyCollectionReference(value: unknown, xmlElement: string | undefined): boolean {
  if (value === undefined) return true
  if (Array.isArray(value)) return value.length === 0
  if (!isRecord(value)) return false
  if (Object.keys(value).length === 0) return true
  if (xmlElement === undefined || !Object.prototype.hasOwnProperty.call(value, xmlElement)) return false
  const items = value[xmlElement]
  return items === undefined || (Array.isArray(items) && items.length === 0)
}

function isNilXMLValue(value: unknown): boolean {
  return isRecord(value) && (value["_xsi:nil"] === true || value["_xsi:nil"] === "true")
}

function callAtomicFromXML(params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: unknown
  name?: string
}): unknown {
  const handler = getTypeRule(params.rule.type, "importFromXML")
  if (handler === undefined) return params.value
  return handler({ ...params.context, fromXML: { forReference: true } }, params.rule, params.value, params.name)
}

export function callAtomicFromYAML(params: AtomicFromYAMLParams): unknown {
  const { context, rule, value, referenceValue, yaml, name, owner } = params
  const handler = params.handler ?? getTypeRule(rule.type, "importFromYAML")
  if (handler === undefined) {
    const imported =
      rule.type === "string"
        ? importStringMetadataTargetFromYAML({ rule, value: value ?? referenceValue, owner })
        : (value ?? referenceValue)
    return imported === undefined ? defaultValue({ context, rule, yaml, name, operation: "importFromYAML" }) : imported
  }

  const imported =
    handler.length === 1
      ? (handler as ImportFromYAMLFunctionNew)({
          context,
          rule,
          value,
          source: referenceValue,
          yaml,
          name,
          owner,
        })
      : (handler as importFromYAMLFunction)(context, rule, value, referenceValue)
  if (rule.type === "MetadataDcsMetadataValue" && imported === null) return null
  const resolved = shouldUseOnlyImportedValue({ rule, value })
    ? imported
    : (imported ?? normalizeReferenceFallback(rule, referenceValue))
  return resolved === undefined ? defaultValue({ context, rule, yaml, name, operation: "importFromYAML" }) : resolved
}

function importIndexedImplicitYAMLValue(params: AtomicFromYAMLParams): unknown {
  const imported = callAtomicFromYAML(params)
  const handler = getTypeRule(params.rule.type, "exportToYAML")
  if (handler === undefined) return imported
  const exported =
    handler.length === 1
      ? (handler as ExportToYAMLFunctionNew)({
          context: params.context,
          rule: params.rule,
          value: imported,
          name: params.name,
          owner: params.owner,
        })
      : (handler as ExportToYAMLFunction)(params.context, params.rule, imported)
  return Object.is(exported, params.value) ? imported : params.value
}

function shouldUseOnlyImportedValue(params: { rule: PropertyRule; value: unknown }): boolean {
  return (
    (params.rule.preserveEmptyXML === true && params.value === undefined) ||
    (params.rule.type === "MetadataDcsMetadataValue" &&
      (params.rule as { valueType?: unknown }).valueType === "DesignTimeValue" &&
      params.value === undefined)
  )
}

function normalizeReferenceFallback(rule: PropertyRule, value: unknown): unknown {
  if (rule.type !== "SystemEnumeration" || !isRecord(value)) return value
  return typeof value["#text"] === "string" ? value["#text"] : value
}

export function callAtomicToXML(params: AtomicToXMLParams): unknown {
  const { context, rule, value, referenceValue, source, propertyKey } = params
  const handler = params.handler ?? getTypeRule(rule.type, "exportToXML")
  const hasRaw = Object.prototype.hasOwnProperty.call(rule, "defaultValueXMLRaw")
  if (handler === undefined) {
    if (isDefaultValue(value, rule.defaultValue)) {
      if (shouldCreateRawParent(value, rule)) return value
      return hasRaw ? rule.defaultValueXMLRaw : rule.defaultValueXML
    }
    return wrapWithNamespace(rule, value)
  }

  const exportValue = (nextValue: unknown): unknown =>
    handler.length === 1
      ? (handler as ExportToXMLFunctionNew)({
          context,
          rule,
          value: nextValue,
          source,
          propertyKey,
          referenceMetadata: referenceValue,
        })
      : (handler as ExportToXMLFunction)(context, rule, nextValue, referenceValue)
  const exported = exportValue(value)
  if (
    isDefaultValue(exported, rule.defaultValue) ||
    (exported === undefined && isDefaultValue(value, rule.defaultValue))
  ) {
    if (shouldCreateRawParent(value, rule)) return value
    if (hasRaw) return rule.defaultValueXMLRaw
    return wrapWithNamespace(rule, exportValue(rule.defaultValueXML))
  }
  return wrapWithNamespace(rule, exported)
}

function shouldConvertYAMLProperty(params: {
  source: YAMLPropertySource
  planned: YAMLToXMLPlannedProperty
  outputs: readonly MutableOutput[]
  context: ConfigurationContextWithExportToXML
}): boolean {
  const { source, planned, outputs, context } = params
  if (!isYAMLPropertyExportEnabled({ source, planned, context })) return false
  const rule = planned.propertyRule
  if (rule.preserveFromReferenceXML !== true || source.has(planned.propertyKey)) return true
  if (rule.exportWithoutReferenceXML === true) return true
  if (isConfigurationIndexPropertyPresent(context, planned.propertyKey)) return true
  return outputs.some(
    ({ request }) => readReferenceProperty({ context, referenceXML: request.referenceXML, planned }).exists
  )
}

function isYAMLPropertyExportEnabled(params: {
  source: YAMLPropertySource
  planned: YAMLToXMLPlannedProperty
  context: ConfigurationContextWithExportToXML
}): boolean {
  const { source, planned, context } = params
  const rule = planned.propertyRule
  if (rule.runtimeOnly || rule.syncExternalOnly || rule.filePath !== undefined || rule.toXML === false) return false
  return typeof rule.toXML !== "function" || rule.toXML(source, context)
}

function requiresYAMLToXMLEvaluation(rule: PropertyRule): boolean {
  return rule.exportWithoutReferenceXML === true || rule.exportNilValue === true
}

function matchesOutputTag(rule: PropertyRule, output: YAMLToXMLOutputRequest): boolean {
  return output.tags === undefined || (rule.tag !== undefined && output.tags.includes(rule.tag))
}

function readReferenceProperty(params: {
  context: ConfigurationContextWithExportToXML
  referenceXML: unknown
  planned: YAMLToXMLPlannedProperty
}): ReferenceProperty {
  let current: unknown = params.referenceXML
  for (const parent of params.planned.propertyRule.xmlParents ?? []) {
    if (!isRecord(current)) return referenceFromConfigurationIndex(params.context, params.planned)
    current = current[parent]
  }
  if (isRecord(current)) {
    const canonical = params.planned.propertyRule.xml ?? params.planned.xmlPath.at(-1)!
    const indexedAlias = getConfigurationIndexSourceXmlKey(params.context, params.planned.propertyKey)
    const candidates = [indexedAlias, canonical, ...(params.planned.propertyRule.xmlAliases ?? [])].filter(
      (candidate): candidate is string => candidate !== undefined
    )
    for (const key of candidates) {
      if (Object.prototype.hasOwnProperty.call(current, key)) return { exists: true, key, value: current[key] }
    }
  }
  return referenceFromConfigurationIndex(params.context, params.planned)
}

function referenceFromConfigurationIndex(
  context: ConfigurationContextWithExportToXML,
  planned: YAMLToXMLPlannedProperty
): ReferenceProperty {
  const identity = identityReferenceFromConfigurationIndex(context, planned)
  if (identity !== undefined) return identity
  const value = getConfigurationIndexPropertyReferenceXMLValue(context, planned.propertyKey)
  return value === undefined
    ? { exists: isConfigurationIndexPropertyPresent(context, planned.propertyKey) }
    : { exists: true, key: getConfigurationIndexSourceXmlKey(context, planned.propertyKey), value }
}

function identityReferenceFromConfigurationIndex(
  context: ConfigurationContextWithExportToXML,
  planned: YAMLToXMLPlannedProperty
): ReferenceProperty | undefined {
  if ((planned.propertyRule.xmlParents?.length ?? 0) > 0) return undefined
  const xmlKey = planned.propertyRule.xml ?? planned.xmlPath.at(-1)
  const runtime = context.exportToXML.configurationIndex
  if (runtime === undefined || (xmlKey !== "_uuid" && xmlKey !== "_id" && xmlKey !== "_name")) return undefined
  const kind =
    xmlKey === "_uuid"
      ? "uuid"
      : xmlKey === "_name"
        ? "xmlName"
        : getTypeRule(planned.propertyRule.type, "configurationIndexValueFromXML")?.identityKind === "uuid"
          ? "uuid"
          : "xmlId"
  const value = runtime.identity(kind)
  if (value === undefined) return undefined
  if (kind === "uuid") runtime.collector.setUuid(runtime.logicalAddress, value)
  else if (kind === "xmlId") runtime.collector.setXmlId(runtime.logicalAddress, value)
  else runtime.collector.setXmlName(runtime.logicalAddress, value)
  return { exists: true, key: xmlKey, value }
}

function writeXMLValue(params: {
  context: ConfigurationContextWithExportToXML
  output: MutableOutput
  planned: YAMLToXMLPlannedProperty
  value: unknown
  reference: ReferenceProperty
}): readonly string[] | undefined {
  const { context, output, planned, reference } = params
  const value =
    params.value === undefined && reference.exists && planned.propertyRule.preserveEmptyXML !== true ? {} : params.value
  if (value === undefined) return undefined
  const rule = planned.propertyRule
  if (Array.isArray(value) && value.length === 0) {
    if (rule.xmlParents !== undefined && Object.prototype.hasOwnProperty.call(rule, "defaultValueXMLRaw")) {
      setAtPath(output.xml, rule.xmlParents, rule.defaultValueXMLRaw)
    } else if (reference.exists && Object.prototype.hasOwnProperty.call(rule, "defaultValueXMLEmpty")) {
      const canonical = rule.xml ?? planned.xmlPath.at(-1)!
      setAtPath(output.xml, [...(rule.xmlParents ?? []), reference.key ?? canonical], {})
    }
    return undefined
  }

  const canonical = rule.xml ?? planned.xmlPath.at(-1)!
  const xmlKey =
    reference.key !== undefined && [canonical, ...(rule.xmlAliases ?? [])].includes(reference.key)
      ? reference.key
      : canonical
  const configurationIndex = context.exportToXML.configurationIndex
  if (configurationIndex !== undefined) {
    const logicalAddress = getConfigurationIndexXmlNodeLogicalAddress(context) ?? configurationIndex.logicalAddress
    configurationIndex.collector.setPresent(logicalAddress, planned.propertyKey)
    if (reference.key !== undefined)
      configurationIndex.collector.setAlias(logicalAddress, planned.propertyKey, reference.key)
  }
  const valuePath = [...(rule.xmlParents ?? []), xmlKey]
  setAtPath(output.xml, valuePath, value)
  return valuePath
}

function setAtPath(target: Record<string, unknown>, path: readonly string[], value: unknown): void {
  if (path.length === 0) return
  let current = target
  for (const segment of path.slice(0, -1)) {
    const nested = current[segment]
    if (!isRecord(nested)) current[segment] = {}
    current = current[segment] as Record<string, unknown>
  }
  current[path.at(-1)!] = value
}

function restoreExplicitYAMLString(params: {
  yaml: Record<string, unknown> | undefined
  yamlKey: string | undefined
  rule: PropertyRule
}): unknown {
  const { yaml, yamlKey, rule } = params
  if (yaml === undefined || yamlKey === undefined) return undefined
  const value = yaml[yamlKey]
  const restoresExplicitString =
    rule.type === "MetadataValue" ||
    rule.type === "FilterItemPresentationValue" ||
    (rule.type === "SettingsParameterValue" &&
      ["DesignTimeValue", "Primitive", "Field"].includes(rule.valueType as string))
  return restoresExplicitString ? asExplicitYAMLStringIfMarked(yaml, yamlKey, value) : value
}

function defaultValue(params: {
  context: ConfigurationContext
  rule: PropertyRule
  yaml?: unknown
  name?: string
  operation: "importFromYAML"
}): unknown {
  return typeof params.rule.defaultValue === "function" ? params.rule.defaultValue(params) : params.rule.defaultValue
}

function isDefaultValue(value: unknown, expected: unknown): boolean {
  return (
    value === expected ||
    (Array.isArray(value) && Array.isArray(expected) && value.length === 0 && expected.length === 0)
  )
}

function shouldCreateRawParent(value: unknown, rule: PropertyRule): boolean {
  return (
    Array.isArray(value) && value.length === 0 && rule.xmlParents !== undefined && isRecord(rule.defaultValueXMLRaw)
  )
}

function hasExplicitXMLDefault(rule: PropertyRule): boolean {
  return (
    Object.prototype.hasOwnProperty.call(rule, "defaultValueXML") ||
    Object.prototype.hasOwnProperty.call(rule, "defaultValueXMLRaw") ||
    Object.prototype.hasOwnProperty.call(rule, "defaultValueXMLEmpty")
  )
}

function wrapWithNamespace(rule: PropertyRule, value: unknown): unknown {
  if (value === undefined || value === null || rule.xmlNamespace === undefined || typeof value === "object")
    return value
  return { "#text": value, _xmlns: rule.xmlNamespace }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined
}

function getReferencePropertyOrder(params: {
  outputs: readonly YAMLToXMLOutputRequest[]
  planByKey: ReadonlyMap<string, YAMLToXMLPlannedProperty>
}): ReadonlyMap<string, number> {
  const pathsByOutput = new Map<YAMLToXMLOutputRequest, string[]>()
  for (const output of params.outputs) {
    if (!isRecord(output.referenceXML)) continue
    const paths: string[] = []
    collectReferenceXMLPaths(output.referenceXML, [], paths)
    pathsByOutput.set(output, paths)
  }
  const result = new Map<string, number>()
  for (const [propertyKey, planned] of params.planByKey) {
    const parent = planned.propertyRule.xmlParents ?? []
    const keys = [
      planned.propertyRule.xml ?? capitalizePropertyKey(propertyKey),
      ...(planned.propertyRule.xmlAliases ?? []),
    ]
    const indices = params.outputs
      .filter((output) => matchesOutputTag(planned.propertyRule, output))
      .flatMap((output) => {
        const paths = pathsByOutput.get(output) ?? []
        return keys.map((key) => paths.indexOf([...parent, key].join("\u0000"))).filter((index) => index >= 0)
      })
    if (indices.length > 0) result.set(propertyKey, Math.min(...indices))
  }
  return result
}

function collectReferenceXMLPaths(value: Record<string, unknown>, parent: readonly string[], result: string[]): void {
  for (const [key, child] of Object.entries(value)) {
    const path = [...parent, key]
    result.push(path.join("\u0000"))
    if (isRecord(child)) collectReferenceXMLPaths(child, path, result)
  }
}

function capitalizePropertyKey(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
