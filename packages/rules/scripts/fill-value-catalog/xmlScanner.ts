import {
  createConfigurationLanguages,
  parseXmlWithSaxes,
  type ConfigurationContextFromXML,
} from "@nkdk/runtime"
import {
  classifyFillValue,
  effectiveFillValueType,
  type FillValueClassification,
  type FillValueEffectiveType,
} from "@nkdk/runtime/rule-kit"
import { importMetadataValueFromXML } from "../../metadata/commonObjects/metadataValue/fromXML"
import type { MetadataTypedValue } from "../../metadata/commonObjects/metadataValue/types"
import { importTypeDescriptionFromXML } from "../../metadata/commonObjects/typeDescription/fromXML"
import type { TypeDescriptionXML } from "../../metadata/commonObjects/typeDescription/types"
import type {
  FillValueObservation,
  NormalizedType,
  RawFillValue,
  RulesEvidence,
  UnresolvedXmlObservation,
} from "./model"
import { stableRulesClassification } from "./model"
import { classifyObservedValue, normalizeEffectiveType } from "./valueClassification"

type XmlRecord = Record<string, unknown>

const ordinaryElementNames = new Set([
  "CommonAttribute",
  "Attribute",
  "Dimension",
  "Resource",
  "AddressingAttribute",
  "Field",
  "AccountingFlag",
  "ExtDimensionAccountingFlag",
])

const context: ConfigurationContextFromXML = {
  version: "2.20",
  languages: createConfigurationLanguages({ default: "ru", registered: ["ru"] }),
  fromXML: { forReference: false },
}

export interface StandardAttributeEnrichment {
  readonly ownerKind: string
  readonly effectiveType: FillValueEffectiveType
  readonly type: NormalizedType
  readonly rulesClassification: FillValueClassification
  readonly rulesEvidence?: RulesEvidence
}

export type StandardAttributeEnricher = (params: {
  readonly ownerXmlKind: string
  readonly ownerName?: string
  readonly ownerXml: XmlRecord
  readonly internalName: string
  readonly raw: RawFillValue
  readonly typedValue?: MetadataTypedValue
}) => StandardAttributeEnrichment

export interface ScanFillValuesResult {
  readonly observations: readonly FillValueObservation[]
  readonly unresolved: readonly UnresolvedXmlObservation[]
}

export function scanFillValuesInXml(params: {
  readonly configuration: string
  readonly file: string
  readonly xml: string
  readonly enrichStandard: StandardAttributeEnricher
}): ScanFillValuesResult {
  const parsed = parseXmlWithSaxes<XmlRecord>(params.xml, {
    preserveXsiNil: true,
    preserveEmptyElements: true,
  })
  const metadata = asRecord(parsed.MetaDataObject)
  const ownerEntry = metadata === undefined ? undefined : ownerXmlEntry(metadata)
  if (ownerEntry === undefined) {
    return {
      observations: [],
      unresolved: [{
        configuration: params.configuration,
        file: params.file,
        element: "MetaDataObject",
        reason: "не удалось определить корневой metadata-объект",
      }],
    }
  }

  const [ownerXmlKind, ownerXml] = ownerEntry
  const ownerName = scalarText(asRecord(ownerXml.Properties)?.Name)
  const observations: FillValueObservation[] = []
  const unresolved: UnresolvedXmlObservation[] = []

  visitElement(ownerXmlKind, ownerXml)
  return { observations, unresolved }

  function visitElement(element: string, value: unknown): void {
    if (Array.isArray(value)) {
      for (const item of value) visitElement(element, item)
      return
    }
    const record = asRecord(value)
    if (record === undefined) return

    if (element === "xr:StandardAttribute") {
      const internalName = scalarText(record._name)
      if (internalName === undefined) {
        unresolved.push(unresolvedAt(element, "у стандартного реквизита отсутствует имя"))
        return
      }
      const fillKey = Object.prototype.hasOwnProperty.call(record, "xr:FillValue")
        ? "xr:FillValue"
        : "FillValue"
      const raw = rawFillValue(record[fillKey], Object.prototype.hasOwnProperty.call(record, fillKey))
      const typed = parseTypedValue(record[fillKey], raw)
      const enrichment = params.enrichStandard({
        ownerXmlKind,
        ...(ownerName === undefined ? {} : { ownerName }),
        ownerXml,
        internalName,
        raw,
        ...(typed.value === undefined ? {} : { typedValue: typed.value }),
      })
      observations.push(observation({
        ownerKind: enrichment.ownerKind,
        attributeKind: "standard",
        attributeName: internalName,
        itemKind: "StandardAttribute",
        type: enrichment.type,
        raw,
        typed,
        effectiveType: enrichment.effectiveType,
        rulesClassification: enrichment.rulesClassification,
        rulesEvidence: enrichment.rulesEvidence,
      }))
      return
    }

    const properties = asRecord(record.Properties)
    if (ordinaryElementNames.has(element) && properties?.Type !== undefined) {
      const attributeName = scalarText(properties.Name)
      if (attributeName === undefined) {
        unresolved.push(unresolvedAt(element, "у обычного реквизита отсутствует имя"))
        return
      }
      const raw = rawFillValue(
        properties.FillValue,
        Object.prototype.hasOwnProperty.call(properties, "FillValue"),
      )
      const typeDescription = importTypeDescriptionFromXML(
        context,
        undefined,
        properties.Type as TypeDescriptionXML,
      )
      const effectiveType = effectiveFillValueType(typeDescription)
      const typed = parseTypedValue(properties.FillValue, raw)
      const rulesClassification = typed.value === undefined
        ? ({ kind: typed.error === undefined ? "notSpecified" : "unresolved", ...(typed.error === undefined ? {} : { reason: typed.error }) } as FillValueClassification)
        : classifyFillValue({ effectiveType, value: typed.value })
      observations.push(observation({
        ownerKind: ownerXmlKind,
        attributeKind: "ordinary",
        attributeName,
        itemKind: element,
        type: normalizeEffectiveType(effectiveType, "xml", typeDescription),
        raw,
        typed,
        effectiveType,
        rulesClassification,
      }))
      return
    }

    if (
      Object.prototype.hasOwnProperty.call(record, "FillValue") ||
      Object.prototype.hasOwnProperty.call(record, "xr:FillValue")
    ) {
      unresolved.push(unresolvedAt(element, "неподдержанная XML-конструкция с FillValue"))
      return
    }

    for (const [childElement, child] of Object.entries(record)) {
      if (!childElement.startsWith("_") && childElement !== "#text") visitElement(childElement, child)
    }
  }

  function observation(candidate: {
    readonly ownerKind: string
    readonly attributeKind: "ordinary" | "standard"
    readonly attributeName: string
    readonly itemKind: string
    readonly type: NormalizedType
    readonly raw: RawFillValue
    readonly typed: ParsedTypedValue
    readonly effectiveType: FillValueEffectiveType
    readonly rulesClassification: FillValueClassification
    readonly rulesEvidence?: RulesEvidence
  }): FillValueObservation {
    const stable = stableRulesClassification(candidate.rulesClassification)
    return {
      configuration: params.configuration,
      file: params.file,
      ownerKind: candidate.ownerKind,
      ...(ownerName === undefined ? {} : { ownerName }),
      attributeKind: candidate.attributeKind,
      attributeName: candidate.attributeName,
      itemKind: candidate.itemKind,
      type: candidate.type,
      raw: candidate.raw,
      ...(candidate.typed.value === undefined ? {} : { typedValue: candidate.typed.value }),
      valueCategory: classifyObservedValue({
        raw: candidate.raw,
        ...(candidate.typed.value === undefined ? {} : { typedValue: candidate.typed.value }),
        effectiveType: candidate.effectiveType,
        rulesClassification: candidate.rulesClassification,
      }),
      rulesClassification: stable.kind,
      ...(stable.reason === undefined ? {} : { rulesReason: stable.reason }),
      ...(candidate.rulesEvidence === undefined ? {} : { rulesEvidence: candidate.rulesEvidence }),
    }
  }

  function unresolvedAt(element: string, reason: string): UnresolvedXmlObservation {
    return { configuration: params.configuration, file: params.file, element, reason }
  }
}

export function rawFillValue(value: unknown, present: boolean): RawFillValue {
  if (!present) return { form: "absent" }
  const record = asRecord(value)
  if (record === undefined) {
    const text = scalarText(value) ?? ""
    return text === "" ? { form: "untypedEmpty" } : { form: "untypedText", text }
  }

  const xsiType = scalarText(record["_xsi:type"])
  const text = scalarText(record["#text"])
  if (record["_xsi:nil"] === true || record["_xsi:nil"] === "true") return { form: "nil" }
  if (xsiType !== undefined) {
    return text === undefined || text === ""
      ? { form: "typedEmpty", xsiType }
      : { form: "typedText", xsiType, text }
  }
  return text === undefined || text === ""
    ? { form: "untypedEmpty" }
    : { form: "untypedText", text }
}

interface ParsedTypedValue {
  readonly value?: MetadataTypedValue
  readonly error?: string
}

function parseTypedValue(value: unknown, raw: RawFillValue): ParsedTypedValue {
  if (raw.form === "absent" || raw.form === "nil") return {}
  try {
    const xmlValue = asRecord(value) ?? { "#text": scalarText(value) ?? "" }
    const typedValue = importMetadataValueFromXML({ context, rule: undefined, value: xmlValue })
    return typedValue === undefined ? {} : { value: typedValue }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

function ownerXmlEntry(metadata: XmlRecord): readonly [string, XmlRecord] | undefined {
  for (const [key, value] of Object.entries(metadata)) {
    if (key.startsWith("_") || key.startsWith("?")) continue
    const record = asRecord(value)
    if (record !== undefined) return [key, record]
  }
  return undefined
}

function asRecord(value: unknown): XmlRecord | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as XmlRecord
    : undefined
}

function scalarText(value: unknown): string | undefined {
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return undefined
}
