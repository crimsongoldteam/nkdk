import {
  createConfigurationLanguages,
  parseXmlDocumentWithSaxes,
  xmlAttributeValue,
  xmlElementChildren,
  xmlTextValue,
  type XmlElementNode,
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
import type {
  FillValueObservation,
  NormalizedType,
  RawFillValue,
  RulesEvidence,
  UnresolvedXmlObservation,
} from "./model"
import { stableRulesClassification } from "./model"
import { classifyObservedValue, normalizeEffectiveType } from "./valueClassification"

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
  readonly ownerXml: XmlElementNode
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
  const metadata = parseXmlDocumentWithSaxes(params.xml).roots.find(node => node.name === "MetaDataObject")
  const ownerNode = metadata === undefined ? undefined : xmlElementChildren(metadata)[0]
  if (ownerNode === undefined) {
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

  const ownerXml = ownerNode
  const ownerXmlKind = ownerXml.name
  const ownerName = scalarText(child(child(ownerXml, "Properties"), "Name"))
  const observations: FillValueObservation[] = []
  const unresolved: UnresolvedXmlObservation[] = []

  visitElement(ownerXml)
  return { observations, unresolved }

  function visitElement(value: XmlElementNode): void {
    const element = value.name
    if (element === "xr:StandardAttribute") {
      const internalName = xmlAttributeValue(value, "name")
      if (internalName === undefined) {
        unresolved.push(unresolvedAt(element, "у стандартного реквизита отсутствует имя"))
        return
      }
      const fillValue = child(value, "xr:FillValue") ?? child(value, "FillValue")
      const raw = rawFillValue(fillValue)
      const typed = parseTypedValue(fillValue, raw)
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

    const properties = child(value, "Properties")
    const type = child(properties, "Type")
    if (ordinaryElementNames.has(element) && type !== undefined) {
      const attributeName = scalarText(child(properties, "Name"))
      if (attributeName === undefined) {
        unresolved.push(unresolvedAt(element, "у обычного реквизита отсутствует имя"))
        return
      }
      const fillValue = child(properties, "FillValue")
      const raw = rawFillValue(fillValue)
      const typeDescription = importTypeDescriptionFromXML(
        context,
        undefined,
        type,
      )
      const effectiveType = effectiveFillValueType(typeDescription)
      const typed = parseTypedValue(fillValue, raw)
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
      child(value, "FillValue") !== undefined || child(value, "xr:FillValue") !== undefined
    ) {
      unresolved.push(unresolvedAt(element, "неподдержанная XML-конструкция с FillValue"))
      return
    }

    for (const nested of xmlElementChildren(value)) visitElement(nested)
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

export function rawFillValue(value: XmlElementNode | undefined): RawFillValue {
  if (value === undefined) return { form: "absent" }
  const xsiType = xmlAttributeValue(value, "xsi:type")
  const text = xmlTextValue(value)
  if (xmlAttributeValue(value, "xsi:nil") === "true") return { form: "nil" }
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

function parseTypedValue(value: XmlElementNode | undefined, raw: RawFillValue): ParsedTypedValue {
  if (value === undefined || raw.form === "absent" || raw.form === "nil") return {}
  try {
    const typedValue = importMetadataValueFromXML({ context, rule: undefined, value })
    return typedValue === undefined ? {} : { value: typedValue }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

function child(value: XmlElementNode | undefined, name: string): XmlElementNode | undefined {
  return value === undefined ? undefined : xmlElementChildren(value, name)[0]
}

function scalarText(value: XmlElementNode | undefined): string | undefined {
  return value === undefined ? undefined : xmlTextValue(value) || undefined
}
