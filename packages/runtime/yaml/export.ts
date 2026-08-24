import { dump, type Document, type Node } from "js-yaml"
import { isExplicitYAMLString, markDoubleQuotedScalar, unwrapExplicitYAMLString } from "./explicitString"
import {
  copyYAMLScalarTags,
  isXMLAnomalyTag,
  NKDK_YAML_SCHEMA,
  restoreYAMLScalarTagsAfterDump,
  taggedScalarForDump,
  xmlAnomalyTagPayload,
  xmlAnomalyTagValue,
  yamlScalarTagAt,
} from "./scalarTags"
import {
  copyYAMLMappingKeyOrder,
  copyYAMLMappingTag,
  createYAMLOrderedMapping,
  hasYAMLMappingKeyOrder,
  yamlMappingEntries,
} from "./mappingTags"
import {
  copyYAMLMappingKeyTags,
  yamlMappingKeyTagAt,
} from "./mappingKeyTags"
import {
  copyXmlAnomalyAnnotationsForParent,
  createXmlAnomalyAnnotations,
  type XmlAnomalyAnnotation,
  type XmlAnomalyAnnotations,
} from "./xmlAnomalyAnnotations"

const EXPLICIT_STRING_MARKER_PREFIX = "__NKDK_EXPLICIT_STRING_"
const UNDEFINED_VALUE_MARKER_PREFIX = "__NKDK_UNDEFINED_VALUE_"

export interface SerializedYAMLDocument {
  readonly text: string
  readonly data: unknown
  readonly annotations: XmlAnomalyAnnotations
}

interface PreparedYAMLNode {
  readonly dumpValue: unknown
  readonly data: unknown
  readonly doubleQuoted?: true
}

const leadingSpaceCount = (line: string): number => line.length - line.trimStart().length

const isKeepChompingBlockScalarHeader = (line: string): boolean => {
  return /^\s*(?:(?:[^#\n]*?:|-)\s*)?[|>](?:\+(?:[1-9])?|[1-9]\+)\s*(?:#.*)?$/.test(line)
}

const endsInsideBlockScalar = (yaml: string): boolean => {
  const lines = yaml.split("\n")
  let finalContentIndent = Infinity

  for (let index = lines.length - 2; index >= 0; index -= 1) {
    const line = lines[index]
    if (line.trim() === "") continue

    const indent = leadingSpaceCount(line)
    if (isKeepChompingBlockScalarHeader(line)) return indent < finalContentIndent

    finalContentIndent = Math.min(finalContentIndent, indent)
  }

  return false
}

const removeDocumentFinalLineEnding = (yaml: string): string => {
  if (!yaml.endsWith("\n")) return yaml
  if (endsInsideBlockScalar(yaml)) return yaml
  return yaml.slice(0, -1)
}

function prepareForDump(
  value: unknown,
  explicitStrings: Map<string, string>,
  undefinedValues: Set<string>,
  sourceAnnotations: XmlAnomalyAnnotations,
  dumpAnnotations: ReturnType<typeof createXmlAnomalyAnnotations>,
  dataAnnotations: ReturnType<typeof createXmlAnomalyAnnotations>,
): PreparedYAMLNode {
  if (isExplicitYAMLString(value)) {
    const data = String(unwrapExplicitYAMLString(value))
    return { dumpValue: explicitStringMarker(data, explicitStrings), data, doubleQuoted: true }
  }
  if (typeof value === "string" && shouldExportAsExplicitString(value)) {
    return { dumpValue: explicitStringMarker(value, explicitStrings), data: value, doubleQuoted: true }
  }
  if (Array.isArray(value)) {
    const prepared = value.map((item, index) =>
      prepareChildForDump(value, index, item, explicitStrings, undefinedValues, sourceAnnotations, dumpAnnotations, dataAnnotations)
    )
    const dumpValue = prepared.map(({ dumpValue }) => dumpValue)
    const data = prepared.map(({ data }) => data)
    prepared.forEach((item, index) => {
      if (item.doubleQuoted === true) markDoubleQuotedScalar(data, index)
    })
    copyYAMLScalarTags(value, data)
    copyXmlAnomalyAnnotationsForParent(sourceAnnotations, value, dumpValue, dumpAnnotations)
    copyXmlAnomalyAnnotationsForParent(sourceAnnotations, value, data, dataAnnotations)
    return { dumpValue, data }
  }
  if (value !== null && typeof value === "object") {
    const entries = yamlMappingEntries(value as Record<string, unknown>)
    if (entries.length === 0) return { dumpValue: value, data: value }
    const prepared = entries.map(([key, item]) => [
      key,
      prepareChildForDump(value, key, item, explicitStrings, undefinedValues, sourceAnnotations, dumpAnnotations, dataAnnotations),
    ] as const)
    const preparedDumpEntries = prepared.map(([key, item]) => [key, item.dumpValue] as const)
    const preparedDataEntries = prepared.map(([key, item]) => [key, item.data] as const)
    const preserveOrder = hasYAMLMappingKeyOrder(value)
    const dumpValue = preserveOrder
      ? createYAMLOrderedMapping(preparedDumpEntries)
      : Object.fromEntries(preparedDumpEntries)
    const data = preserveOrder
      ? createYAMLOrderedMapping(preparedDataEntries)
      : Object.fromEntries(preparedDataEntries)
    for (const [key, item] of prepared) {
      if (item.doubleQuoted === true) markDoubleQuotedScalar(data, key)
    }
    copyYAMLScalarTags(value, dumpValue)
    copyYAMLScalarTags(value, data)
    copyYAMLMappingTag(value, dumpValue)
    copyYAMLMappingTag(value, data)
    copyYAMLMappingKeyOrder(value, dumpValue)
    copyYAMLMappingKeyOrder(value, data)
    copyYAMLMappingKeyTags(value, dumpValue)
    copyYAMLMappingKeyTags(value, data)
    copyXmlAnomalyAnnotationsForParent(sourceAnnotations, value, dumpValue, dumpAnnotations)
    copyXmlAnomalyAnnotationsForParent(sourceAnnotations, value, data, dataAnnotations)
    return { dumpValue, data }
  }
  return { dumpValue: value, data: value }
}

function prepareChildForDump(
  parent: object,
  key: string | number,
  value: unknown,
  explicitStrings: Map<string, string>,
  undefinedValues: Set<string>,
  sourceAnnotations: XmlAnomalyAnnotations,
  dumpAnnotations: ReturnType<typeof createXmlAnomalyAnnotations>,
  dataAnnotations: ReturnType<typeof createXmlAnomalyAnnotations>,
): PreparedYAMLNode {
  const anomaly = sourceAnnotations.at(parent, key)
  if (anomaly?.kind === "raw") {
    if (anomaly.xml === undefined) throw new TypeError("!xml/raw требует обязательную XML-поправку")
    const hasSemanticValue = anomaly.hasSemanticValue === true
    if (!hasSemanticValue && value !== undefined) {
      throw new TypeError("!xml/raw без $значение не может содержать смысловые данные")
    }
    const preparedSemantic = hasSemanticValue
      ? prepareForDump(value, explicitStrings, undefinedValues, sourceAnnotations, dumpAnnotations, dataAnnotations)
      : undefined
    return {
      dumpValue: {
        ...(preparedSemantic === undefined ? {} : { "$значение": preparedSemantic.dumpValue }),
        $xml: prepareXmlPatchForDump(anomaly.xml, explicitStrings),
      },
      data: preparedSemantic?.data,
    }
  }
  const tag = yamlScalarTagAt(parent, key)
  if (anomaly === undefined && isXMLAnomalyTag(tag)) {
    const taggedValue = typeof value === "string"
      ? xmlAnomalyTagValue(tag, prepareXMLAnomalyPayload(tag, value, explicitStrings))
      : value
    return {
      dumpValue: taggedScalarForDump(parent, key, taggedValue),
      data: value,
    }
  }
  if (value === undefined && !Array.isArray(parent)) {
    const marker = `${UNDEFINED_VALUE_MARKER_PREFIX}${undefinedValues.size}__`
    undefinedValues.add(marker)
    return { dumpValue: marker, data: {} }
  }
  const prepared = value === undefined
    ? { dumpValue: null, data: null }
    : prepareForDump(value, explicitStrings, undefinedValues, sourceAnnotations, dumpAnnotations, dataAnnotations)
  return {
    dumpValue: anomaly === undefined
      ? taggedScalarForDump(parent, key, prepared.dumpValue)
      : prepared.dumpValue,
    data: prepared.data,
    ...(prepared.doubleQuoted === true ? { doubleQuoted: true } : {}),
  }
}

function prepareXmlPatchForDump(value: unknown, explicitStrings: Map<string, string>): unknown {
  if (typeof value === "string") {
    return shouldExportAsExplicitString(value) ? explicitStringMarker(value, explicitStrings) : value
  }
  if (Array.isArray(value)) return value.map((item) => prepareXmlPatchForDump(item, explicitStrings))
  if (!isRecord(value)) return value
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, prepareXmlPatchForDump(item, explicitStrings)]),
  )
}

function isPropertyStateTag(tag: unknown): tag is "проверять" | "изменять" {
  return tag === "проверять" || tag === "изменять"
}

function prepareXMLAnomalyPayload(
  tag: Parameters<typeof xmlAnomalyTagPayload>[0],
  value: string,
  explicitStrings: Map<string, string>,
): string {
  const payload = xmlAnomalyTagPayload(tag, value)
  return shouldExportAsExplicitString(payload)
    ? explicitStringMarker(payload, explicitStrings)
    : payload
}

function explicitStringMarker(value: string, explicitStrings: Map<string, string>): string {
  const marker = `${EXPLICIT_STRING_MARKER_PREFIX}${explicitStrings.size}__`
  explicitStrings.set(marker, value)
  return marker
}

function shouldExportAsExplicitString(value: string): boolean {
  if (value.includes("\n")) return false
  if (value === "") return true
  if (value.trim() !== value) return true
  if (!Number.isNaN(Number(value)) && value.trim() !== "") return true
  return /^[`@]/.test(value)
}

function restoreUndefinedValues(yaml: string, undefinedValues: Set<string>): string {
  let result = yaml
  for (const marker of undefinedValues) result = result.split(`: ${marker}`).join(":")
  return result
}

function normalizeQuotedTypeLinkValues(yaml: string): string {
  return yaml.replace(/(: )"(-?\d+\(\d+\))"$/gm, "$1$2")
}

function normalizeEmptyXMLTags(yaml: string): string {
  return yaml.replace(/!xml\/(present|absent|name|type|value|reference|language|duplicate) ""(?=[ \t]*(?:#.*)?$)/gm, "!xml/$1")
}

function normalizeEmptyMappings(yaml: string): string {
  if (yaml === "{}\n") return ""
  return yaml.replace(/^(\s*(?:-|.+:)) \{\}$/gm, "$1")
}

function quoteExplicitStrings(yaml: string, explicitStrings: Map<string, string>): string {
  let result = yaml
  for (const [marker, value] of explicitStrings) {
    result = result.split(marker).join(JSON.stringify(value))
  }
  return result
}

export function serializeYAMLDocument(
  source: unknown,
  annotations: XmlAnomalyAnnotations = createXmlAnomalyAnnotations(),
): SerializedYAMLDocument {
  const explicitStrings = new Map<string, string>()
  const undefinedValues = new Set<string>()
  const serializedAnnotations = createXmlAnomalyAnnotations()
  const dumpAnnotations = createXmlAnomalyAnnotations()
  if (annotations.root() !== undefined) serializedAnnotations.setRoot(annotations.root()!)
  if (annotations.root() !== undefined) dumpAnnotations.setRoot(annotations.root()!)
  const prepared = annotations.root()?.kind === "raw" && source === undefined
    ? { dumpValue: null, data: undefined }
    : prepareForDump(source, explicitStrings, undefinedValues, annotations, dumpAnnotations, serializedAnnotations)
  const yaml = dump(prepared.dumpValue, {
    schema: NKDK_YAML_SCHEMA,
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    skipInvalid: false,
    sortKeys: false,
    forceQuotes: false,
    quoteStyle: "double",
    transform(documents) {
      applyYAMLMappingKeyTagsToAST(documents, prepared.dumpValue, dumpAnnotations)
      applyXmlAnomalyAnnotationsToAST(documents, prepared.dumpValue, prepared.data, dumpAnnotations)
    },
  })
  const text = restoreYAMLScalarTagsAfterDump(
    removeDocumentFinalLineEnding(
      normalizeEmptyMappings(
        normalizeEmptyXMLTags(
          normalizeQuotedTypeLinkValues(
            quoteExplicitStrings(restoreUndefinedValues(yaml, undefinedValues), explicitStrings)
          )
        )
      )
    )
  )
  return { text, data: prepared.data, annotations: serializedAnnotations }
}

function applyXmlAnomalyAnnotationsToAST(
  documents: Document[],
  source: unknown,
  semanticData: unknown,
  annotations: XmlAnomalyAnnotations,
): void {
  const document = documents[0]
  if (document === undefined || document.contents === null) return
  const root = annotations.root()
  if (root !== undefined) applyXmlAnomalyTag(document.contents, root, semanticData)
  applyXmlAnomalyAnnotationsToNode(document.contents, source, semanticData, annotations)
}

function applyXmlAnomalyAnnotationsToNode(
  node: Node | null,
  source: unknown,
  semanticData: unknown,
  annotations: XmlAnomalyAnnotations,
): void {
  if (node === null || node.kind === "alias") return
  if (node.kind === "sequence") {
    if (!Array.isArray(source) || !Array.isArray(semanticData)) return
    node.items.forEach((item, index) => {
      const annotation = annotations.at(source, index)
      if (annotation !== undefined) applyXmlAnomalyTag(item, annotation, semanticData[index])
      applyXmlAnomalyAnnotationsToNode(item, source[index], semanticData[index], annotations)
    })
    return
  }
  if (node.kind !== "mapping" || !isRecord(source) || !isRecord(semanticData)) return

  for (const item of node.items) {
    if (item.key.kind !== "scalar") continue
    const runtimeKey = item.key.value
    const keyAnnotation = annotations.keyAt(source, runtimeKey)
    if (keyAnnotation !== undefined) {
      item.key.value = keyAnnotation.logicalKey ?? runtimeKey
      applyXmlAnomalyTag(item.key, keyAnnotation)
    }
    const valueAnnotation = annotations.at(source, runtimeKey)
    if (valueAnnotation !== undefined) applyXmlAnomalyTag(item.value, valueAnnotation, semanticData[runtimeKey])
    if (valueAnnotation?.kind === "raw" && item.value.kind === "mapping") {
      const semanticItem = item.value.items.find(({ key }) => key.kind === "scalar" && key.value === "$значение")
      const rawSource = source[runtimeKey]
      if (semanticItem !== undefined && isRecord(rawSource)) {
        if (valueAnnotation.semantic !== undefined) {
          applyXmlAnomalyTag(semanticItem.value, {
            ...valueAnnotation.semantic,
            target: "value",
          })
        }
        applyXmlAnomalyAnnotationsToNode(
          semanticItem.value,
          rawSource["$значение"],
          semanticData[runtimeKey],
          annotations,
        )
      }
      continue
    }
    applyXmlAnomalyAnnotationsToNode(item.value, source[runtimeKey], semanticData[runtimeKey], annotations)
  }
}

function applyXmlAnomalyTag(node: Node, annotation: XmlAnomalyAnnotation, value?: unknown): void {
  const occurrence = annotation.target === "key" && annotation.occurrence > 1
    ? `/${annotation.occurrence}`
    : ""
  node.tag = `!xml/${annotation.kind}${occurrence}`
  node.style.tagged = true
  if (annotation.kind === "raw" && annotation.target !== "key" && value === undefined && node.kind === "scalar") {
    node.value = ""
  }
}

function applyYAMLMappingKeyTagsToAST(
  documents: Document[],
  source: unknown,
  annotations: XmlAnomalyAnnotations,
): void {
  const document = documents[0]
  if (document !== undefined) applyYAMLMappingKeyTagsToNode(document.contents, source, annotations)
}

function applyYAMLMappingKeyTagsToNode(
  node: Node | null,
  source: unknown,
  annotations: XmlAnomalyAnnotations,
): void {
  if (node === null || node.kind === "alias") return
  if (node.kind === "sequence") {
    if (!Array.isArray(source)) return
    node.items.forEach((item, index) => applyYAMLMappingKeyTagsToNode(item, source[index], annotations))
    return
  }
  if (node.kind !== "mapping" || !isRecord(source)) return

  for (const item of node.items) {
    if (item.key.kind !== "scalar") continue
    const key = item.key.value
    const propertyState = yamlScalarTagAt(source, key)
    if (isPropertyStateTag(propertyState) && annotations.at(source, key) !== undefined) {
      item.key.tag = propertyState === "проверять" ? "!nkdkcheck" : "!nkdkextx"
      item.key.style.tagged = true
    }
    const tag = yamlMappingKeyTagAt(source, key)
    if (tag !== undefined) {
      if (tag !== "xml/reference") {
        throw new TypeError(`Тег !${tag} недопустим для ключа YAML`)
      }
      item.key.tag = `!${tag}`
      item.key.style.tagged = true
      if (key === "") item.key.style.doubleQuoted = true
    }
    applyYAMLMappingKeyTagsToNode(item.value, source[key], annotations)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export const exportToYAML = <T>(data: T): string => serializeYAMLDocument(data).text
