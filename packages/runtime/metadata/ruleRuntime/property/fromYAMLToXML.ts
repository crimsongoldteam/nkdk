import { asExplicitYAMLStringIfMarked } from "../../../yaml/explicitString"
import { capitalize } from "../../../helpers/capitalize"
import {
  configurationIndexPropertyXmlStateLogicalAddress,
  type ConfigurationIndexPropertyXmlStateAddress,
  getConfigurationIndexPropertyReferenceXMLValue,
  getConfigurationIndexPropertyXmlValue,
  getConfigurationIndexXmlNodeLogicalAddress,
  withConfigurationIndexExportPropertyContext,
} from "../../configurationIndex/referenceView"
import type { MetadataTargetOwner } from "../metadataTarget"
import type { ConfigurationContext, ConfigurationContextWithExportToXML, XMLDefaultVariant } from "../../context/types"
import { metadataTargetOwnerFromRule, importStringMetadataTargetFromYAML } from "./metadataTargetString"
import { convertMetadataItemFromYAMLToXML } from "../metadataItem/fromYAMLToXML"
import { convertMetadataCollectionFromYAMLToXML } from "../metadataCollection/fromYAMLToXML"
import { toYAMLImportError, withYAMLImportDiagnostics } from "../yamlImportError"
import type {
  ExportToXMLFunction,
  ExportToXMLFunctionNew,
  importFromYAMLFunction,
  ImportFromYAMLFunctionNew,
  PropertyRuleExecution,
} from "./fn"
import { applyAutoRequiredXMLParents, collectAutoRequiredXMLParentRoot, getOrderedKeysToXML } from "./helpers"
import { getYAMLToXMLPlan, type YAMLToXMLPlannedProperty } from "./fromYAMLToXMLPlan"
import type {
  YAMLPropertySource,
  YAMLToXMLExternalWriteFactory,
  YAMLToXMLOutputRequest,
  YAMLToXMLResult,
  YAMLToXMLProfile,
} from "./fromYAMLToXMLTypes"
import { assertRequiredConfigurationIdentity } from "./requiredIdentity"
import { getTypeRule } from "./typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "./types"
import { readExternalFile } from "./externalFile"
import type { DeferredValuePath } from "./deferredObjectValues"
import type { DeferredRulePathSegment } from "./importYamlTypes"
import { collectExplicitXMLPropertyActions } from "./explicitXMLPropertyRegistry"
import { currentPropertyRuleRegistrySet } from "./propertyRuleExecutionContext"
import { yamlScalarTagAt } from "../../../yaml/scalarTags"

export interface ConvertPropertiesFromYAMLToXMLParams {
  readonly execution?: PropertyRuleExecution
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
  readonly execution?: PropertyRuleExecution
  readonly context: ConfigurationContext
  readonly rule: PropertyRule
  readonly value: unknown
  readonly referenceValue?: unknown
  readonly yaml?: unknown
  readonly name?: string
  readonly owner?: MetadataTargetOwner
  readonly restoreExcludedEqualName?: boolean
}

export interface AtomicToXMLParams {
  readonly handler?: ExportToXMLFunction | ExportToXMLFunctionNew
  readonly execution?: PropertyRuleExecution
  readonly context: ConfigurationContextWithExportToXML
  readonly rule: PropertyRule
  readonly value: unknown
  readonly referenceValue?: unknown
  readonly source?: YAMLPropertySource
  readonly propertyKey?: string
  readonly preserveIndexedImplicitValue?: true
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
  readonly indexedExplicitEmpty?: true
  readonly synthesizedDefault?: true
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
  const typeRule = <Operation extends import("./fn").TypeRulesOperations>(
    type: PropertyRule["type"],
    operation: Operation,
  ) => params.execution === undefined
    ? getTypeRule(type, operation)
    : params.execution.getTypeRule(type, operation)
  const convertNestedProperties = (
    nestedParams: Omit<ConvertPropertiesFromYAMLToXMLParams, "execution">,
  ) => convertPropertiesFromYAMLToXML({
    ...nestedParams,
    execution: params.execution,
  })
  const yaml = asRecord(params.yaml)
  const explicitXMLParams = {
    yaml,
    itemType: params.rule.itemType,
    properties: params.rule.properties,
  }
  const explicitXMLActions = params.execution === undefined
    ? collectExplicitXMLPropertyActions(explicitXMLParams)
    : params.execution.collectExplicitXMLPropertyActions(explicitXMLParams)
  const propertyValues = new Map(params.propertyValues)
  for (const [propertyKey, action] of explicitXMLActions) {
    if (action.kind === "useYamlValue") propertyValues.set(propertyKey, action.yamlValue)
  }
  const source = createYAMLPropertySource({
    yaml,
    rule: params.rule,
    itemName: params.sourceItemName ?? params.name,
    propertyValues,
    context: params.context,
  })
  const outputs: MutableOutput[] = params.outputs.map((request) => ({ request, xml: {}, deferred: [] }))
  const autoRequiredXMLParentRoots = new Set<string>()
  const externalWrites = [] as import("./fromYAMLToXMLTypes").YAMLToXMLExternalWrite[]
  const owner = metadataTargetOwnerFromRule({
    itemRule: params.rule,
    name: params.name ?? params.sourceItemName,
    context: params.context,
    execution: params.execution,
  })
  const orderedKeys = getOrderedKeysToXML({
    rule: params.rule,
  })
  const planByKey = new Map(getYAMLToXMLPlan(params.rule).properties.map((planned) => [planned.propertyKey, planned]))
  if (params.externalWriteFactory !== undefined) {
    for (const propertyKey of planByKey.keys()) {
      if (!orderedKeys.includes(propertyKey)) orderedKeys.push(propertyKey)
    }
  }
  const namePropertyKey = params.namePropertyKey ?? "name"

  for (const propertyKey of orderedKeys) {
    const planned = planByKey.get(propertyKey)
    if (planned === undefined) continue
    if (params.profile !== undefined) {
      params.profile.propertyCount++
      params.profile.propertyPaths.push(formatRulePath([...(params.rulePath ?? [params.rule.itemType]), propertyKey]))
    }
    const explicitXMLAction = explicitXMLActions.get(propertyKey)
    if (explicitXMLAction?.kind === "omit") continue
    const matchingOutputs = outputs.filter(({ request }) => matchesOutputTag(planned.propertyRule, request))
    const propertyContext = matchingOutputs[0]?.request.context ?? params.context
    if (explicitXMLAction?.kind === "invalid") {
      const diagnosticContext = withYAMLImportDiagnostics(propertyContext, {
        propertyPath: [planned.yamlKey ?? propertyKey],
        ...(planned.yamlKey === undefined ? {} : { yamlPath: [planned.yamlKey] }),
      })
      throw toYAMLImportError(new Error(explicitXMLAction.message), diagnosticContext)
    }
    if (!source.has(propertyKey)) {
      copyConfigurationIndexPropertyValue(propertyContext, planned)
    }
    const hasXMLDefault = hasExplicitXMLDefault(propertyContext, planned.propertyRule, planned.propertyKey)
    const exportHandler = typeRule(planned.propertyRule.type, "exportToXML")
    const references = matchingOutputs.map(({ request }) =>
      readReferenceProperty({
        context: request.context ?? propertyContext,
        referenceXML: request.referenceXML,
        planned,
        execution: params.execution,
      })
    )
    if (explicitXMLAction?.kind === "emit") {
      collectAutoRequiredXMLParentRoot(planned.propertyRule, autoRequiredXMLParentRoots)
      matchingOutputs.forEach((output, index) => {
        writeXMLValue({
          context: propertyContext,
          output,
          planned,
          value: explicitXMLAction.xmlValue,
          reference: references[index]!,
        })
      })
      continue
    }
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
      ((!references.some((reference) => reference.exists) && !requiresYAMLToXMLEvaluation(planned.propertyRule)) ||
        (planned.propertyRule.exportNilValue === true &&
          planned.propertyRule.preserveUnknownReferenceXML === false &&
          references.every((reference) => reference.value === undefined))) &&
      (!hasXMLDefault || params.omitDefaultsForSparseYAML === true)
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
      !hasXMLDefault
    ) {
      continue
    }

    if (
      !source.has(propertyKey) &&
      planned.propertyRule.forReferenceOnly === true &&
      planned.propertyRule.evaluateWhenYAMLMissing === true &&
      configurationIndexContainsCurrentItem(propertyContext) &&
      references.every((reference) => !reference.exists)
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
          execution: params.execution,
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
      planned.propertyRule.preserveUnknownReferenceXML !== false &&
      planned.propertyRule.excludeIfEqualNameYAML !== true &&
      typeRule(planned.propertyRule.type, "yamlToXMLNestedRule") === undefined &&
      !requiresYAMLToXMLEvaluation(planned.propertyRule) &&
      references.every((reference) => reference.exists) &&
      references.every(
        (reference) =>
          reference.synthesizedDefault !== true &&
          (reference.value !== undefined ||
            exportHandler === undefined ||
            Object.prototype.hasOwnProperty.call(planned.propertyRule, "defaultValueXMLRaw"))
      ) &&
      (!hasXMLDefault ||
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

    if (
      !source.has(propertyKey) &&
      !(planned.propertyKey === namePropertyKey && params.name !== undefined) &&
      planned.propertyRule.preserveUnknownReferenceXML === false &&
      !requiresYAMLToXMLEvaluation(planned.propertyRule) &&
      !hasXMLDefault
    ) {
      continue
    }

    const preservesIndexedProperty =
      !source.has(propertyKey) && references.some((reference) => reference.synthesizedDefault === true)
    if (
      !preservesIndexedProperty &&
      !shouldConvertYAMLProperty({ source, planned, context: propertyContext })
    ) continue

    if (
      getXMLDefaultVariant(propertyContext) === "indexed" &&
      planned.propertyRule.yaml !== undefined &&
      planned.propertyRule.toYAML !== false &&
      !source.has(propertyKey) &&
      !(planned.propertyKey === namePropertyKey && params.name !== undefined) &&
      !requiresYAMLToXMLEvaluation(planned.propertyRule) &&
      references.every((reference) => !reference.exists)
    ) {
      continue
    }

    if (
      !usesOrdinaryXMLDefaults(propertyContext) &&
      !hasXMLDefault &&
      !requiresYAMLToXMLEvaluation(planned.propertyRule) &&
      !source.has(propertyKey) &&
      !(planned.propertyKey === namePropertyKey && params.name !== undefined) &&
      references.every((reference) => !reference.exists) &&
      (Object.prototype.hasOwnProperty.call(planned.propertyRule, "defaultValueXML") ||
        Object.prototype.hasOwnProperty.call(planned.propertyRule, "defaultValueXMLRaw") ||
        Object.prototype.hasOwnProperty.call(planned.propertyRule, "defaultValueXMLEmpty"))
    ) {
      continue
    }

    const nestedRule = typeRule(planned.propertyRule.type, "yamlToXMLNestedRule")
    if (nestedRule !== undefined && nestedRule.kind !== "externalFile") {
      const childCollection = params.rule.childCollections?.find((collection) => collection.propertyKey === propertyKey)
      const effectiveNestedRule =
        nestedRule.kind === "collection"
          ? {
              ...nestedRule,
              itemRule: childCollection?.itemRule ?? nestedRule.itemRule,
            }
          : nestedRule.kind === "item"
            ? {
                ...nestedRule,
                itemRule: nestedRule.itemRuleFromProperty?.(planned.propertyRule) ?? nestedRule.itemRule,
              }
            : nestedRule
      const nestedPropertyContext = withConfigurationIndexExportPropertyContext(
        propertyContext,
        planned.yamlKey ?? planned.propertyKey,
        childCollection?.configurationIndexUidSegment ??
          planned.propertyRule.configurationIndexUidSegment ??
          planned.propertyRule.operationTarget?.migrationSegment,
        {
          configurationIndexAddressing:
            planned.propertyRule.configurationIndexAddressing ??
            ("configurationIndexAddressing" in effectiveNestedRule
              ? effectiveNestedRule.configurationIndexAddressing
              : undefined),
        }
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
      const materializeCollection = explicitXMLAction?.kind === "materializeCollection"
      const sourceNestedYAML =
        materializeCollection
          ? {}
          : planned.propertyKey === namePropertyKey && params.name !== undefined && !source.has(propertyKey)
          ? params.name
          : source.raw(propertyKey)
      const hasNestedDefault = hasExplicitXMLDefault(propertyContext, planned.propertyRule, planned.propertyKey)
      const nestedYAML =
        sourceNestedYAML === undefined
          ? effectiveNestedRule.kind === "collection" &&
            hasNestedDefault &&
            matchingOutputs.every((output) => output.request.referenceXML === undefined)
            ? []
            : effectiveNestedRule.kind === "item" &&
            (planned.propertyRule.evaluateWhenYAMLMissing === true ||
              references.some((reference) => reference.exists && reference.value === undefined) ||
              nestedContext.exportToXML.configurationIndex?.identity(
                "xmlId",
                getConfigurationIndexXmlNodeLogicalAddress(nestedContext)
              ) !== undefined ||
              nestedContext.exportToXML.configurationIndex?.identity(
                "xmlName",
                getConfigurationIndexXmlNodeLogicalAddress(nestedContext)
              ) !== undefined)
            ? {}
            : undefined
          : sourceNestedYAML
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
      if (effectiveNestedRule.kind === "item") {
        assertRequiredConfigurationIdentity({
          context: nestedItemContext,
          kind: effectiveNestedRule.requiredIdentity,
        })
      }
      const nested =
        effectiveNestedRule.kind === "collection"
          ? convertMetadataCollectionFromYAMLToXML({
              convertItem: convertMetadataItemFromYAMLToXML,
              convertProperties: convertNestedProperties,
              context: nestedContext,
              yaml: nestedYAML,
              descriptor: effectiveNestedRule,
              propertyRule: planned.propertyRule,
              source,
              outputs: nestedOutputs,
              materializeCanonicalItems: materializeCollection ? true : undefined,
              externalWriteFactory: params.externalWriteFactory,
              profile: params.profile,
              rulePath: [...(params.rulePath ?? [params.rule.itemType]), propertyKey],
              deferredRulePath: [...(params.deferredRulePath ?? []), { propertyKey }],
            })
          : convertMetadataItemFromYAMLToXML({
              convertProperties: convertNestedProperties,
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
        if (
          effectiveNestedRule.kind === "collection" &&
          effectiveNestedRule.xmlElement !== undefined &&
          isEmptyCollectionOutput(value, effectiveNestedRule.xmlElement) &&
          reference.exists &&
          Object.prototype.hasOwnProperty.call(planned.propertyRule, "defaultValueXMLEmpty")
        ) {
          value = {}
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
    const rawSourceValue =
      planned.propertyKey === namePropertyKey && params.name !== undefined && !source.has(propertyKey)
        ? params.name
        : propertyValues.has(propertyKey)
          ? source.raw(propertyKey)
          : hasYAMLValue
            ? restoreExplicitYAMLString({ yaml, yamlKey, rule: planned.propertyRule })
            : source.raw(propertyKey)
    const sourceValue =
      !source.has(propertyKey) && Object.prototype.hasOwnProperty.call(planned.propertyRule, "implicitValueXML")
        ? resolveImplicitValueYAML({
            context: propertyContext,
            rule: planned.propertyRule,
            yaml,
            name: params.name,
          })
        : rawSourceValue
    const transportPreparation = params.execution?.prepareBrokenXMLReferenceExport({
      rule: planned.propertyRule,
      yamlValue: sourceValue,
      isTagged: (path) => isRelativeYAMLScalarTagged(yaml, yamlKey, path),
    })
    const importSourceValue = transportPreparation?.yamlValue ?? sourceValue
    const diagnosticContext = withYAMLImportDiagnostics(propertyContext, {
      propertyPath: [yamlKey ?? propertyKey],
      ...(yamlKey === undefined ? {} : { yamlPath: [yamlKey] }),
    }) as ConfigurationContextWithExportToXML
    let imported: unknown
    try {
      const atomicReferences = references.map((reference) =>
        !source.has(propertyKey) && planned.propertyRule.exportNilValue === true
          ? undefined
          : reference.exists
            ? callAtomicFromXML({
                context: diagnosticContext,
                rule: planned.propertyRule,
                value: reference.value,
                name: params.name,
                execution: params.execution,
              })
            : undefined
      )
      const importParams: AtomicFromYAMLParams = {
        handler: typeRule(planned.propertyRule.type, "importFromYAML"),
        execution: params.execution,
        context: diagnosticContext,
        rule: planned.propertyRule,
        value: importSourceValue,
        referenceValue: atomicReferences[0],
        yaml,
        name: params.name,
        owner,
        restoreExcludedEqualName:
          !source.has(propertyKey) &&
          planned.propertyRule.excludeIfEqualNameYAML === true &&
          params.name !== undefined &&
          (getXMLDefaultVariant(propertyContext) === undefined || references.some((reference) => reference.exists)),
      }
      imported = callAtomicFromYAML(importParams)
      if (params.profile !== undefined) params.profile.atomicFromYAMLCount++

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
          execution: params.execution,
          context: outputContext,
          rule: planned.propertyRule,
          value: imported,
          referenceValue: atomicReferences[index],
          source,
          propertyKey,
          ...(reference.synthesizedDefault === true
            ? { preserveIndexedImplicitValue: true as const }
            : {}),
        })
        if (params.profile !== undefined) params.profile.atomicToXMLCount++
        const transportedXML =
          transportPreparation === undefined || params.execution === undefined
            ? exported
            : params.execution.patchExportedBrokenXMLReferences({
                rule: planned.propertyRule,
                yamlValue: sourceValue,
                xmlValue: exported,
                preparation: transportPreparation,
              })
        const valuePath = writeXMLValue({ context: outputContext, output, planned, value: transportedXML, reference })
        if (valuePath !== undefined && typeRule(planned.propertyRule.type, "finalizeExportedXML") !== undefined) {
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
  const outputMap = new Map(outputs.map(({ request, xml }) => [request.key, xml]))
  if (yaml !== undefined) {
    const augmenterRegistry = params.execution ?? currentPropertyRuleRegistrySet<{
      augmentMetadataItemYamlToXml(value: {
        readonly context: ConfigurationContextWithExportToXML
        readonly rule: MetadataItemRule
        readonly yaml: Readonly<Record<string, unknown>>
        readonly outputs: ReadonlyMap<string, Record<string, unknown>>
      }): void
    }>()
    augmenterRegistry?.augmentMetadataItemYamlToXml({
      context: params.context,
      rule: params.rule,
      yaml,
      outputs: outputMap,
    })
  }
  return {
    outputs: outputMap,
    deferredByOutput: new Map(outputs.map(({ request, deferred }) => [request.key, deferred])),
    externalWrites,
  }
}

function isRelativeYAMLScalarTagged(
  yaml: Readonly<Record<string, unknown>> | undefined,
  propertyKey: string | undefined,
  path: readonly (string | number)[],
): boolean {
  if (yaml === undefined || propertyKey === undefined) return false
  if (path.length === 0) return yamlScalarTagAt(yaml, propertyKey) === "xml"
  let parent: unknown = yaml[propertyKey]
  for (const segment of path.slice(0, -1)) {
    if (typeof parent !== "object" || parent === null) return false
    parent = (parent as Readonly<Record<string | number, unknown>>)[segment]
  }
  const key = path[path.length - 1]
  return key !== undefined && yamlScalarTagAt(parent, key) === "xml"
}

function configurationIndexContainsCurrentItem(context: ConfigurationContextWithExportToXML): boolean {
  const runtime = context.exportToXML.configurationIndex
  return runtime !== undefined && runtime.source.entity(runtime.logicalAddress) !== undefined
}

function copyConfigurationIndexPropertyValue(
  context: ConfigurationContextWithExportToXML,
  planned: YAMLToXMLPlannedProperty
): void {
  const runtime = context.exportToXML.configurationIndex
  const property = configurationIndexPropertyXmlStateAddress(planned)
  const value = getConfigurationIndexPropertyXmlValue(context, property)
  if (runtime === undefined || value === undefined) return
  const address = configurationIndexPropertyXmlStateLogicalAddress(runtime, property)
  if (value.extended === true) runtime.collector.setXmlFlag(address, "extended")
  if (!usesConfigurationIndexOrdinaryXMLState(context)) return
  if (getXMLDefaultVariant(context) === undefined) return
  if (value.present === true) runtime.collector.setXmlFlag(address, "present")
  if (value.xsiNil === true) runtime.collector.setXmlFlag(address, "xsiNil")
  if (value.explicitEmpty === true) runtime.collector.setXmlFlag(address, "explicitEmpty")
  if (value.xsiType !== undefined) runtime.collector.setXmlValue(address, "xsiType", value.xsiType)
  if (value.xmlText !== undefined) runtime.collector.setXmlValue(address, "xmlText", value.xmlText)
  if (value.xmlPrefix !== undefined) runtime.collector.setXmlValue(address, "xmlPrefix", value.xmlPrefix)
}

function formatRulePath(path: readonly (string | number)[]): string {
  return path.map(String).join("/")
}

function callAtomicFromXML(params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: unknown
  name?: string
  execution?: PropertyRuleExecution
}): unknown {
  const handler = params.execution === undefined
    ? getTypeRule(params.rule.type, "importFromXML")
    : params.execution.getTypeRule(params.rule.type, "importFromXML")
  if (handler === undefined) return params.value
  return handler({ ...params.context, fromXML: { forReference: true } }, params.rule, params.value, params.name)
}

export function callAtomicFromYAML(params: AtomicFromYAMLParams): unknown {
  const { context, rule, value, referenceValue, yaml, name, owner } = params
  const handler = params.handler ?? (params.execution === undefined
    ? getTypeRule(rule.type, "importFromYAML")
    : params.execution.getTypeRule(rule.type, "importFromYAML"))
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
          restoreExcludedEqualName: params.restoreExcludedEqualName,
        })
      : (handler as importFromYAMLFunction)(context, rule, value, referenceValue)
  if (rule.type === "MetadataDcsMetadataValue" && imported === null) return null
  const resolved = shouldUseOnlyImportedValue({ rule, value })
    ? imported
    : (imported ?? normalizeReferenceFallback(rule, referenceValue))
  return resolved === undefined ? defaultValue({ context, rule, yaml, name, operation: "importFromYAML" }) : resolved
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
  if (Object.prototype.hasOwnProperty.call(rule, "implicitValueXML") && value === rule.implicitValueXML) {
    return undefined
  }
  const handler = params.handler ?? (params.execution === undefined
    ? getTypeRule(rule.type, "exportToXML")
    : params.execution.getTypeRule(rule.type, "exportToXML"))
  const hasRaw = Object.prototype.hasOwnProperty.call(rule, "defaultValueXMLRaw")
  const xmlDefault =
    params.preserveIndexedImplicitValue === true && Object.prototype.hasOwnProperty.call(rule, "defaultValueXML")
      ? { exists: true, value: rule.defaultValueXML }
      : resolveXMLDefault(context, rule, propertyKey)
  if (handler === undefined) {
    if (isDefaultValue(value, rule.defaultValue)) {
      if (shouldCreateRawParent(value, rule)) return value
      return hasRaw ? rule.defaultValueXMLRaw : xmlDefault.exists ? xmlDefault.value : undefined
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
    return xmlDefault.exists ? wrapWithNamespace(rule, exportValue(xmlDefault.value)) : undefined
  }
  return wrapWithNamespace(rule, exported)
}

function shouldConvertYAMLProperty(params: {
  source: YAMLPropertySource
  planned: YAMLToXMLPlannedProperty
  context: ConfigurationContextWithExportToXML
}): boolean {
  return isYAMLPropertyExportEnabled(params)
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
  return (
    rule.evaluateWhenYAMLMissing === true ||
    rule.exportNilValue === true ||
    Object.prototype.hasOwnProperty.call(rule, "implicitValueXML")
  )
}

function matchesOutputTag(rule: PropertyRule, output: YAMLToXMLOutputRequest): boolean {
  return output.tags === undefined || (rule.tag !== undefined && output.tags.includes(rule.tag))
}

function readReferenceProperty(params: {
  context: ConfigurationContextWithExportToXML
  referenceXML: unknown
  planned: YAMLToXMLPlannedProperty
  execution?: PropertyRuleExecution
}): ReferenceProperty {
  let current: unknown = params.referenceXML
  for (const parent of params.planned.propertyRule.xmlParents ?? []) {
    if (!isRecord(current)) {
      return referenceFromConfigurationIndex(
        params.context,
        params.planned,
        params.execution,
      )
    }
    current = current[parent]
  }
  if (isRecord(current)) {
    const canonical = params.planned.propertyRule.xml ?? capitalize(params.planned.propertyKey)
    const candidates = [canonical, ...(params.planned.propertyRule.xmlAliases ?? [])]
    for (const key of candidates) {
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        return {
          exists: true,
          key,
          value: current[key],
        }
      }
    }
  }
  return referenceFromConfigurationIndex(
    params.context,
    params.planned,
    params.execution,
  )
}

function referenceFromConfigurationIndex(
  context: ConfigurationContextWithExportToXML,
  planned: YAMLToXMLPlannedProperty,
  execution?: PropertyRuleExecution,
): ReferenceProperty {
  const identity = identityReferenceFromConfigurationIndex(
    context,
    planned,
    execution,
  )
  if (identity !== undefined) return identity
  if (!usesConfigurationIndexOrdinaryXMLState(context)) return { exists: false }
  if (getXMLDefaultVariant(context) === undefined) return { exists: false }
  const property = configurationIndexPropertyXmlStateAddress(planned)
  const indexedValue = getConfigurationIndexPropertyXmlValue(context, property)
  if (
    indexedValue?.present === true &&
    Object.keys(indexedValue).every((key) => key === "present")
  ) {
    return {
      exists: true,
      key: planned.propertyRule.xml ?? capitalize(planned.propertyKey),
      synthesizedDefault: true,
    }
  }
  const indexedDescriptor = execution === undefined
    ? getTypeRule(planned.propertyRule.type, "configurationIndexValueFromXML")
    : execution.getTypeRule(planned.propertyRule.type, "configurationIndexValueFromXML")
  const value =
    (indexedValue === undefined ? undefined : indexedDescriptor?.referenceXMLFromValue?.(indexedValue)) ??
    getConfigurationIndexPropertyReferenceXMLValue(context, property)
  if (value !== undefined) {
    return {
      exists: true,
      key: planned.propertyRule.xml ?? capitalize(planned.propertyKey),
      value,
      ...(indexedValue?.explicitEmpty === true ? { indexedExplicitEmpty: true } : {}),
    }
  }
  if (indexedValue?.present === true) {
    return {
      exists: true,
      key: planned.propertyRule.xml ?? capitalize(planned.propertyKey),
      synthesizedDefault: true,
    }
  }
  return { exists: false }
}

function usesConfigurationIndexOrdinaryXMLState(
  context: ConfigurationContextWithExportToXML,
): boolean {
  return context.exportToXML.componentKind !== "configuration"
}

function configurationIndexPropertyXmlStateAddress(
  planned: YAMLToXMLPlannedProperty
): ConfigurationIndexPropertyXmlStateAddress {
  return {
    propertyKey: planned.propertyKey,
    ...(planned.yamlKey === undefined ? {} : { yamlKey: planned.yamlKey }),
    ...(planned.propertyRule.configurationIndexAddressing === undefined
      ? {}
      : { configurationIndexAddressing: planned.propertyRule.configurationIndexAddressing }),
  }
}

function identityReferenceFromConfigurationIndex(
  context: ConfigurationContextWithExportToXML,
  planned: YAMLToXMLPlannedProperty,
  execution?: PropertyRuleExecution,
): ReferenceProperty | undefined {
  if ((planned.propertyRule.xmlParents?.length ?? 0) > 0) return undefined
  const xmlKey = planned.propertyRule.xml ?? planned.xmlPath.at(-1)
  const runtime = context.exportToXML.configurationIndex
  if (runtime === undefined || (xmlKey !== "_uuid" && xmlKey !== "_id")) return undefined
  const kind =
    xmlKey === "_uuid"
      ? "uuid"
      : (execution === undefined
            ? getTypeRule(
                planned.propertyRule.type,
                "configurationIndexValueFromXML",
              )
            : execution.getTypeRule(
                planned.propertyRule.type,
                "configurationIndexValueFromXML",
              ))?.identityKind === "uuid"
          ? "uuid"
          : "xmlId"
  const value = runtime.identity(kind)
  if (value === undefined) return undefined
  runtime.collector.setIdentity(runtime.logicalAddress, kind, value)
  return { exists: true, key: xmlKey, value }
}

function writeXMLValue(params: {
  context: ConfigurationContextWithExportToXML
  output: MutableOutput
  planned: YAMLToXMLPlannedProperty
  value: unknown
  reference: ReferenceProperty
}): readonly string[] | undefined {
  const { output, planned, reference } = params
  const rule = planned.propertyRule
  const usesEmptyReferenceFallback =
    params.value === undefined &&
    reference.exists &&
    planned.propertyRule.preserveEmptyXML !== true &&
    !Object.prototype.hasOwnProperty.call(rule, "implicitValueXML")
  const rawValue =
    params.value === undefined &&
    reference.exists &&
    planned.propertyRule.preserveEmptyXML === true &&
    reference.indexedExplicitEmpty === true &&
    isExplicitEmptyXMLReference(reference.value)
      ? reference.value
      : usesEmptyReferenceFallback
        ? {}
        : params.value
  const value = wrapWithNamespace(rule, rawValue)
  if (value === undefined) return undefined
  if (Array.isArray(value) && value.length === 0) {
    if (rule.xmlParents !== undefined && Object.prototype.hasOwnProperty.call(rule, "defaultValueXMLRaw")) {
      const canonical = rule.xml ?? capitalize(planned.propertyKey)
      const rawPath = isRecord(rule.defaultValueXMLRaw) ? rule.xmlParents : [...rule.xmlParents, canonical]
      setAtPath(output.xml, rawPath, rule.defaultValueXMLRaw)
    } else if (reference.exists && Object.prototype.hasOwnProperty.call(rule, "defaultValueXMLEmpty")) {
      const canonical = rule.xml ?? capitalize(planned.propertyKey)
      setAtPath(output.xml, [...(rule.xmlParents ?? []), canonical], {})
    }
    return undefined
  }

  const xmlKey = rule.xml ?? capitalize(planned.propertyKey)
  const valuePath = [...(rule.xmlParents ?? []), xmlKey]
  if (usesEmptyReferenceFallback && valueAtPath(output.xml, valuePath) !== undefined) {
    return undefined
  }
  setAtPath(output.xml, valuePath, value)
  return valuePath
}

function isEmptyCollectionOutput(value: unknown, xmlElement: string): boolean {
  if (!isRecord(value) || Object.keys(value).length !== 1) return false
  const items = value[xmlElement]
  return Array.isArray(items) && items.length === 0
}

function isExplicitEmptyXMLReference(value: unknown): boolean {
  if (value === "" || value === undefined) return true
  return isRecord(value) && Object.keys(value).every((key) => key.startsWith("_"))
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

function valueAtPath(target: Record<string, unknown>, path: readonly string[]): unknown {
  let current: unknown = target
  for (const segment of path) {
    if (!isRecord(current)) return undefined
    current = current[segment]
  }
  return current
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

function resolveImplicitValueYAML(params: {
  context: ConfigurationContext
  rule: PropertyRule
  yaml?: unknown
  name?: string
}): unknown {
  const value = params.rule.implicitValueYAML
  return typeof value === "function" ? value({ ...params, operation: "importFromYAML" }) : value
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

function hasExplicitXMLDefault(
  context: ConfigurationContextWithExportToXML,
  rule: PropertyRule,
  propertyKey?: string
): boolean {
  return (
    resolveXMLDefault(context, rule, propertyKey).exists ||
    (usesOrdinaryXMLDefaults(context, propertyKey, rule) &&
      (Object.prototype.hasOwnProperty.call(rule, "defaultValueXMLRaw") ||
        Object.prototype.hasOwnProperty.call(rule, "defaultValueXMLEmpty")))
  )
}

function usesOrdinaryXMLDefaults(
  context: ConfigurationContextWithExportToXML,
  _propertyKey?: string,
  _rule?: PropertyRule
): boolean {
  return getXMLDefaultVariant(context) !== "adopted"
}

function resolveXMLDefault(
  context: ConfigurationContextWithExportToXML,
  rule: PropertyRule,
  _propertyKey?: string
): { readonly exists: boolean; readonly value: unknown } {
  const variant = getXMLDefaultVariant(context)
  if (variant === "adopted") {
    return Object.prototype.hasOwnProperty.call(rule, "defaultValueAdoptedXML")
      ? { exists: true, value: rule.defaultValueAdoptedXML }
      : { exists: false, value: undefined }
  }
  return Object.prototype.hasOwnProperty.call(rule, "defaultValueXML")
    ? { exists: true, value: rule.defaultValueXML }
    : { exists: false, value: undefined }
}

function getXMLDefaultVariant(context: ConfigurationContextWithExportToXML): XMLDefaultVariant | undefined {
  const variants = context.exportToXML?.xmlDefaultVariantByLogicalAddress
  let logicalAddress = context.exportToXML?.configurationIndex?.logicalAddress
  while (logicalAddress !== undefined) {
    const variant = variants?.[logicalAddress]
    if (variant !== undefined) return variant
    const separator = logicalAddress.lastIndexOf(".")
    if (separator < 0) return undefined
    logicalAddress = logicalAddress.slice(0, separator)
  }
  return undefined
}

function wrapWithNamespace(rule: PropertyRule, value: unknown): unknown {
  if (value === undefined || value === null || rule.xmlNamespace === undefined) return value
  if (isRecord(value)) {
    return "#text" in value && !("_xmlns" in value) ? { ...value, _xmlns: rule.xmlNamespace } : value
  }
  if (typeof value === "object") return value
  return { "#text": value, _xmlns: rule.xmlNamespace }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
