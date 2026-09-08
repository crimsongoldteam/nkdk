import { Type } from "typebox"
import { objectRecordOrUndefined } from "@nkdk/runtime"
import { getUUID } from "../../helpers/uuid"
import { ExportToXMLFunctionNew, ImportFromYAMLFunctionNew, defineMetadataItemRule, defineMetadataRules, definePropertyTypeRule, type ImportFromXMLToYAMLFunction, type PropertyRule } from "../../ruleRuntime"
import type { ConfigurationContext, ConfigurationContextFromXML } from "@nkdk/runtime"
import {
  getConfigurationIndexCollectionContext,
  getConfigurationIndexPropertyLogicalAddress,
  type ConfigurationIndexCollectionContext,
  isXmlElementNode,
  isEmptyXmlElement,
  xmlAttributeValue,
  xmlElementChildren,
  xmlTextValue,
  type XmlElementNode,
} from "@nkdk/runtime"
import { indexedUid } from "@nkdk/runtime"
import {
  SectionsPanelRepresentationFromYAML,
  SectionsPanelRepresentationToYAML,
  type SectionsPanelRepresentation,
  type SectionsPanelRepresentationYAML,
} from "../../systemEnumerations/types"
import {
  collectExplicitEmptyPanelDefinitionUUIDs,
  markExplicitEmptyPanelDefinition,
} from "./explicitPanelDefinition"
import { ClientApplicationInterfaceRules } from "./rules"
import {
  ClientApplicationInterfaceGroup,
  ClientApplicationInterfaceGroupXML,
  ClientApplicationInterfaceItem,
  ClientApplicationInterfaceItems,
  ClientApplicationInterfaceItemsYAML,
  ClientApplicationInterfacePanel,
  ClientApplicationInterfacePanelYAML,
  ClientApplicationInterfacePanelDef,
  ClientApplicationInterfacePanelDefs,
  ClientApplicationInterfacePanelDefXML,
  ClientApplicationInterfacePanelXML,
  ClientApplicationInterfaceItemsHintYAMLSchema,
  ClientApplicationInterfaceItemsValidationYAMLSchema,
} from "./types"

const standardPanelsByUuid = {
  "b553047f-c9aa-4157-978d-448ecad24248": "ПанельРазделов",
  "13322b22-3960-4d68-93a6-fe2dd7f28ca3": "ПанельИстории",
  "c933ac92-92cd-459d-81cc-e0c8a83ced99": "ПанельФункцийТекущегоРаздела",
  "cbab57f2-a0f3-4f0a-89ea-4cb19570ab75": "ПанельОткрытых",
  "b2735bd3-d822-4430-ba59-c9e869693b24": "ПанельИзбранного",
  "00000000-0000-0000-0000-000000000000": "СтандартнаяПанель",
} as const

const sectionsPanelUuid = "b553047f-c9aa-4157-978d-448ecad24248"

const standardPanelUuidByName = Object.fromEntries(
  Object.entries(standardPanelsByUuid).map(([uuid, name]) => [name, uuid])
) as Record<string, string>

const requiredStandardPanelUuids = [
  "b553047f-c9aa-4157-978d-448ecad24248",
  "13322b22-3960-4d68-93a6-fe2dd7f28ca3",
  "c933ac92-92cd-459d-81cc-e0c8a83ced99",
  "cbab57f2-a0f3-4f0a-89ea-4cb19570ab75",
  "b2735bd3-d822-4430-ba59-c9e869693b24",
] as const

const standardPanelUuids = new Set<string>(Object.keys(standardPanelsByUuid))
const requiredStandardPanelUuidSet = new Set<string>(requiredStandardPanelUuids)
const clientApplicationInterfaceRootAttributes = ClientApplicationInterfaceRules.properties.xmlRoot.rootAttributes
const clientApplicationInterfaceRootAttributeKeys = new Set(Object.keys(clientApplicationInterfaceRootAttributes))

const XML_METADATA = Symbol.for("metadata")
const XML_ORDERED_CHILDREN = Symbol.for("xmlOrderedChildren")
const XML_SECTION_LENGTHS = Symbol("clientApplicationInterfaceSectionLengths")
const SECTION_KEYS = ["top", "left", "right", "bottom"] as const

const toArray = <T>(value: T | T[] | undefined): T[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  objectRecordOrUndefined(value) !== undefined

const getXMLId = (xml: { _id?: string; id?: string } | XmlElementNode | undefined): string | undefined =>
  isXmlElementNode(xml) ? xmlAttributeValue(xml, "id") ?? interfaceChildText(xml, "id") : xml?._id ?? xml?.id

const interfaceChildText = (xml: XmlElementNode, name: string): string | undefined => {
  const child = xmlElementChildren(xml, name)[0]
  return child === undefined ? undefined : xmlTextValue(child) || undefined
}

const getRawXMLId = (xml: unknown): string | undefined => {
  if (!isRecord(xml)) return undefined
  return typeof xml._id === "string" ? xml._id : typeof xml.id === "string" ? xml.id : undefined
}

const getXMLChildOrder = (xml: unknown): Array<{ key: string; index: number }> | undefined => {
  if (!isRecord(xml)) return undefined
  const metadata = (xml as Record<PropertyKey, unknown>)[XML_METADATA]
  if (!isRecord(metadata)) return undefined
  const childOrder = metadata.childOrder
  if (!Array.isArray(childOrder)) return undefined
  return childOrder.filter(
    (entry): entry is { key: string; index: number } =>
      isRecord(entry) && typeof entry.key === "string" && typeof entry.index === "number"
  )
}

const propertyAddress = (
  collection: ConfigurationIndexCollectionContext,
  propertyKey: (typeof SECTION_KEYS)[number] | "panelDefs"
): string => {
  const rule = ClientApplicationInterfaceRules.properties[propertyKey]
  const yamlKey = "yaml" in rule ? rule.yaml : undefined
  return getConfigurationIndexPropertyLogicalAddress(collection, yamlKey ?? propertyKey, undefined)
}

const itemAddress = (base: string, index: number): string => indexedUid(base, "Элемент", index)

function* indexedInterfaceItems(base: string, items: ClientApplicationInterfaceItems) {
  const occurrences = new Map<string, number>()
  for (const [index, item] of items.entries()) {
    if (item.kind === "panel" && item.uuid === undefined && item.name === undefined) {
      yield { item, address: itemAddress(base, index) }
      continue
    }
    const uuid = item.kind === "panel" ? item.uuid ?? "" : ""
    const key = item.kind === "panel" ? `Панель:${uuid.length}:${uuid}:${item.name ?? ""}` : "Группа"
    const occurrence = occurrences.get(key) ?? 0
    occurrences.set(key, occurrence + 1)
    yield { item, address: indexedUid(base, key, occurrence) }
  }
}

const collectItemConfigurationIndex = (
  context: ConfigurationContextFromXML,
  item: ClientApplicationInterfaceItem,
  address: string
): void => {
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined) return
  if (item.id !== undefined) collection.collector.setIdentity(address, "xmlId", item.id)
  if (item.kind !== "group") return
  for (const child of indexedInterfaceItems(address, item.items ?? [])) {
    collectItemConfigurationIndex(context, child.item, child.address)
  }
}

const collectClientApplicationInterfaceConfigurationIndex = (
  context: ConfigurationContextFromXML,
  sections: Partial<Record<(typeof SECTION_KEYS)[number], ClientApplicationInterfaceItems>>,
  panelDefs: ClientApplicationInterfacePanelDefs | undefined
): void => {
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined) return

  for (const key of SECTION_KEYS) {
    const items = sections[key]
    if (items === undefined) continue
    const address = propertyAddress(collection, key)
    for (const entry of indexedInterfaceItems(address, items)) {
      collectItemConfigurationIndex(context, entry.item, entry.address)
    }
  }

  const panelDefsAddress = propertyAddress(collection, "panelDefs")
  for (const [index, panelDef] of (panelDefs ?? []).entries()) {
    const address = itemAddress(panelDefsAddress, index)
    collection.collector.setIdentity(address, "xmlId", panelDef.id)
  }
}

const getOrderedXMLChildren = <
  T extends {
    panel?: ClientApplicationInterfacePanelXML | ClientApplicationInterfacePanelXML[]
    group?: ClientApplicationInterfaceGroupXML | ClientApplicationInterfaceGroupXML[]
  },
>(
  xml: T | XmlElementNode
): Array<
  | { key: "panel"; value: ClientApplicationInterfacePanelXML | XmlElementNode }
  | { key: "group"; value: ClientApplicationInterfaceGroupXML | XmlElementNode }
> => {
  if (isXmlElementNode(xml)) {
    return xml.content.flatMap(child => child.type === "element" && (child.name === "panel" || child.name === "group") && !isEmptyXmlElement(child)
      ? [{ key: child.name, value: child }]
      : [])
  }
  const panels = toArray(xml.panel)
  const groups = toArray(xml.group)
  const childOrder = getXMLChildOrder(xml)?.filter((entry) => entry.key === "panel" || entry.key === "group")

  if (childOrder === undefined || childOrder.length === 0) {
    return [
      ...panels.map((value) => ({ key: "panel" as const, value })),
      ...groups.map((value) => ({ key: "group" as const, value })),
    ]
  }

  return childOrder
    .map((entry) => {
      if (entry.key === "panel") {
        const value = panels[entry.index]
        return value === undefined ? undefined : { key: "panel" as const, value }
      }
      const value = groups[entry.index]
      return value === undefined ? undefined : { key: "group" as const, value }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== undefined)
}

const defineSectionLengths = (items: ClientApplicationInterfaceItems, sectionLengths: number[]): void => {
  if ((items as unknown as Record<PropertyKey, unknown>)[XML_SECTION_LENGTHS] !== undefined) return
  Object.defineProperty(items, XML_SECTION_LENGTHS, {
    value: sectionLengths,
    enumerable: false,
    configurable: true,
  })
}

const getSectionLengths = (items: ClientApplicationInterfaceItems | undefined): number[] | undefined => {
  if (items === undefined) return undefined
  const value = (items as unknown as Record<PropertyKey, unknown>)[XML_SECTION_LENGTHS]
  return Array.isArray(value) && value.every((item) => typeof item === "number") ? value : undefined
}

const getPanelUUIDFromYAML = (yaml: string | ClientApplicationInterfacePanelYAML | undefined): string | undefined => {
  if (yaml === undefined) return undefined
  if (typeof yaml === "string") return standardPanelUuidByName[yaml] ?? yaml
  return yaml.UUID ?? (yaml.Имя !== undefined ? standardPanelUuidByName[yaml.Имя] : undefined)
}

const getPanelNameFromYAML = (yaml: string | ClientApplicationInterfacePanelYAML | undefined): string | undefined => {
  if (yaml === undefined || typeof yaml === "string") return undefined
  return yaml.Имя !== undefined && standardPanelUuidByName[yaml.Имя] === undefined ? yaml.Имя : undefined
}

const getItemSignature = (item: ClientApplicationInterfaceItem): string[] => {
  if (item.kind === "panel") {
    return [
      ...(item.uuid !== undefined ? [`panel:uuid:${item.uuid}`] : []),
      ...(item.name !== undefined ? [`panel:name:${item.name}`] : []),
    ]
  }
  return item.id !== undefined ? [`group:id:${item.id}`] : []
}

const getYAMLItemSignature = (item: ClientApplicationInterfaceItemsYAML[number]): string[] => {
  if ("Панель" in item) {
    const uuid = getPanelUUIDFromYAML(item.Панель)
    const name = getPanelNameFromYAML(item.Панель)
    return [
      ...(uuid !== undefined ? [`panel:uuid:${uuid}`] : []),
      ...(name !== undefined ? [`panel:name:${name}`] : []),
    ]
  }
  return []
}

const hasStableYAMLSignature = (item: ClientApplicationInterfaceItemsYAML[number]): boolean =>
  getYAMLItemSignature(item).some(
    (signature) => signature.startsWith("panel:uuid:") || signature.startsWith("panel:name:")
  )

const isWeakYAMLGroup = (item: ClientApplicationInterfaceItemsYAML[number]): boolean =>
  !("Панель" in item) && getYAMLItemSignature(item).length === 0

const countRemainingWeakYAMLGroups = (items: ClientApplicationInterfaceItemsYAML, startIndex: number): number =>
  items.slice(startIndex).filter(isWeakYAMLGroup).length

const countAvailableReferenceGroups = (
  referenceItems: ClientApplicationInterfaceItems | undefined,
  usedReferenceIndexes: Set<number>
): number =>
  referenceItems?.filter((item, index) => item.kind === "group" && !usedReferenceIndexes.has(index)).length ?? 0

const isSameYAMLKind = (
  item: ClientApplicationInterfaceItemsYAML[number],
  referenceItem: ClientApplicationInterfaceItem
): boolean => ("Панель" in item ? referenceItem.kind === "panel" : referenceItem.kind === "group")

const findReferenceItemIndex = (params: {
  signatures: string[]
  fallbackIndex: number
  referenceItems: ClientApplicationInterfaceItems | undefined
  usedReferenceIndexes: Set<number>
  canUseIndexFallback: boolean
  isCompatibleByIndex: (referenceItem: ClientApplicationInterfaceItem) => boolean
}): number | undefined => {
  if (params.referenceItems === undefined) return undefined
  for (const signature of params.signatures) {
    const index = params.referenceItems.findIndex(
      (referenceItem, referenceIndex) =>
        !params.usedReferenceIndexes.has(referenceIndex) && getItemSignature(referenceItem).includes(signature)
    )
    if (index !== -1) return index
  }

  const referenceItem = params.referenceItems[params.fallbackIndex]
  if (
    params.canUseIndexFallback &&
    referenceItem !== undefined &&
    !params.usedReferenceIndexes.has(params.fallbackIndex) &&
    params.isCompatibleByIndex(referenceItem)
  ) {
    return params.fallbackIndex
  }

  if (params.canUseIndexFallback) {
    const index = params.referenceItems.findIndex(
      (item, referenceIndex) => !params.usedReferenceIndexes.has(referenceIndex) && params.isCompatibleByIndex(item)
    )
    if (index !== -1) return index
  }

  return undefined
}

const importPanelFromXML = (
  _context: ConfigurationContextFromXML,
  xml: ClientApplicationInterfacePanelXML | XmlElementNode
): ClientApplicationInterfacePanel => {
  const panel: ClientApplicationInterfacePanel = {
    kind: "panel",
  }
  const id = getXMLId(xml)
  if (id !== undefined) panel.id = id
  const uuid = isXmlElementNode(xml) ? interfaceChildText(xml, "uuid") : xml.uuid
  const name = isXmlElementNode(xml) ? interfaceChildText(xml, "name") : xml.name
  const height = isXmlElementNode(xml) ? interfaceChildText(xml, "height") : xml.height
  if (uuid !== undefined) panel.uuid = uuid
  if (name !== undefined) panel.name = name
  if (height !== undefined) panel.height = Number(height)
  return panel
}

const importGroupFromXML = (
  context: ConfigurationContextFromXML,
  xml: ClientApplicationInterfaceGroupXML | XmlElementNode
): ClientApplicationInterfaceGroup => {
  const group: ClientApplicationInterfaceGroup = { kind: "group" }
  const id = getXMLId(xml)
  if (id !== undefined) group.id = id
  const items = importItemsFromSectionXML(context, xml)
  if (items.length > 0) group.items = items
  return group
}

const importItemsFromSectionXML = (
  context: ConfigurationContextFromXML,
  xml: XmlElementNode | {
    panel?: ClientApplicationInterfacePanelXML | ClientApplicationInterfacePanelXML[]
    group?: ClientApplicationInterfaceGroupXML | ClientApplicationInterfaceGroupXML[]
  }
): ClientApplicationInterfaceItems =>
  getOrderedXMLChildren(xml).map((child) =>
    child.key === "panel" ? importPanelFromXML(context, child.value) : importGroupFromXML(context, child.value)
  )

const importItemsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: unknown
): ClientApplicationInterfaceItems | undefined => {
  const items: ClientApplicationInterfaceItems = []
  const sectionLengths: number[] = []
  for (const section of toArray(xml).filter(isRecord)) {
    const sectionItems = importItemsFromSectionXML(context, section)
    sectionLengths.push(sectionItems.length)
    items.push(...sectionItems)
  }
  if (items.length > 0) defineSectionLengths(items, sectionLengths)
  return items.length > 0 ? items : undefined
}

const importPanelDefsFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: ClientApplicationInterfacePanelDefXML | XmlElementNode | (ClientApplicationInterfacePanelDefXML | XmlElementNode)[] | undefined
): ClientApplicationInterfacePanelDefs | undefined => {
  const panelDefs = toArray(xml)
    .map((panelDef) => {
      const id = getXMLId(panelDef)
      if (id === undefined) return undefined
      const result: ClientApplicationInterfacePanelDef = { id }
      const name = isXmlElementNode(panelDef) ? interfaceChildText(panelDef, "name") : panelDef.name
      const spr = isXmlElementNode(panelDef) ? interfaceChildText(panelDef, "spr") as SectionsPanelRepresentation | undefined : panelDef.spr
      if (name !== undefined) result.name = name
      if (spr !== undefined) result.spr = spr
      return result
    })
    .filter((panelDef): panelDef is ClientApplicationInterfacePanelDef => panelDef !== undefined)

  return panelDefs.length > 0 ? panelDefs : undefined
}

const panelPresentationToYAML = (
  presentation: SectionsPanelRepresentation | undefined
): SectionsPanelRepresentationYAML | undefined =>
  presentation !== undefined && presentation in SectionsPanelRepresentationToYAML
    ? SectionsPanelRepresentationToYAML[presentation as keyof typeof SectionsPanelRepresentationToYAML]
    : undefined

const panelPresentationFromYAML = (presentation: string | undefined): SectionsPanelRepresentation | undefined =>
  presentation !== undefined && presentation in SectionsPanelRepresentationFromYAML
    ? SectionsPanelRepresentationFromYAML[presentation as keyof typeof SectionsPanelRepresentationFromYAML]
    : undefined

const exportPanelToYAML = (
  panel: ClientApplicationInterfacePanel,
  panelDefsById: Map<string, ClientApplicationInterfacePanelDef>
): ClientApplicationInterfaceItemsYAML[number] => {
  const standardName =
    panel.uuid !== undefined && panel.uuid in standardPanelsByUuid
      ? standardPanelsByUuid[panel.uuid as keyof typeof standardPanelsByUuid]
      : undefined
  const displayName = panel.name ?? standardName
  const needsExpanded = panel.height !== undefined || panel.name !== undefined || standardName === undefined

  if (!needsExpanded && standardName !== undefined) return { Панель: standardName }

  const yamlPanel: ClientApplicationInterfacePanelYAML = {
    ...(displayName !== undefined ? { Имя: displayName } : {}),
    ...(panel.uuid !== undefined && standardName === undefined ? { UUID: panel.uuid } : {}),
    ...(panel.height !== undefined ? { Высота: panel.height } : {}),
  }
  const panelDef = panel.uuid === undefined ? undefined : panelDefsById.get(panel.uuid)
  if (
    panel.uuid !== undefined &&
    standardName === undefined &&
    panelDef !== undefined &&
    panelDef.name === undefined &&
    panelDef.spr === undefined &&
    yamlPanel.Имя === undefined
  ) {
    markExplicitEmptyPanelDefinition(yamlPanel)
  }
  return { Панель: yamlPanel }
}

const exportGroupToYAML = (
  group: ClientApplicationInterfaceGroup,
  panelDefsById: Map<string, ClientApplicationInterfacePanelDef>
): ClientApplicationInterfaceItemsYAML[number] => ({
  Группа: {
    Элементы: exportItemsToYAML(undefined, undefined, group.items ?? [], panelDefsById) ?? [],
  },
})

const exportItemsToYAML = (
  _context: ConfigurationContext | undefined,
  _rule: PropertyRule | undefined,
  value: ClientApplicationInterfaceItems | undefined,
  panelDefsById = new Map<string, ClientApplicationInterfacePanelDef>()
): ClientApplicationInterfaceItemsYAML | undefined => {
  if (value === undefined) return undefined
  return value.map((item) =>
    item.kind === "panel" ? exportPanelToYAML(item, panelDefsById) : exportGroupToYAML(item, panelDefsById)
  )
}

const exportItemsPropertyToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: ClientApplicationInterfaceItems | undefined
): ClientApplicationInterfaceItemsYAML | undefined => exportItemsToYAML(undefined, undefined, value)

const importClientApplicationInterfaceFromXMLToYAML: ImportFromXMLToYAMLFunction = ({ context, xml }) => {
  const root = isRecord(xml) ? xml : undefined
  const source = isXmlElementNode(xml)
    ? xmlElementChildren(xml, "ClientApplicationInterface")[0] ?? xml
    : isRecord(root?.["ClientApplicationInterface"]) ? root["ClientApplicationInterface"] : root
  if (!isRecord(source)) return undefined
  if (isXmlElementNode(source) && source.attributes.length === 0 && source.content.every(child => child.type === "text")) return undefined

  const panelDefs = importPanelDefsFromXML(
    context,
    ClientApplicationInterfaceRules.properties.panelDefs,
    isXmlElementNode(source) ? xmlElementChildren(source, "panelDef")
      : source["panelDef"] as ClientApplicationInterfacePanelDefXML | ClientApplicationInterfacePanelDefXML[] | undefined
  )
  const panelDefsById = new Map((panelDefs ?? []).map((panelDef) => [panelDef.id, panelDef]))
  const result: Record<string, unknown> = {}
  const sectionsPanelRepresentation = panelPresentationToYAML(panelDefsById.get(sectionsPanelUuid)?.spr)
  if (sectionsPanelRepresentation !== undefined) {
    result[ClientApplicationInterfaceRules.properties.sectionsPanelRepresentation.yaml] = sectionsPanelRepresentation
  }
  const sections: Partial<Record<(typeof SECTION_KEYS)[number], ClientApplicationInterfaceItems>> = {}
  for (const key of SECTION_KEYS) {
    const rule = ClientApplicationInterfaceRules.properties[key]
    const items = importItemsFromXML(context, rule, isXmlElementNode(source) ? xmlElementChildren(source, rule.xml ?? key) : source[rule.xml ?? key])
    if (items !== undefined) sections[key] = items
    const yaml = exportItemsToYAML(undefined, undefined, items, panelDefsById)
    if (yaml !== undefined) result[rule.yaml] = yaml
  }
  collectClientApplicationInterfaceConfigurationIndex(context, sections, panelDefs)
  if (isXmlElementNode(source)) return result
  const sourcePanelDefs = toArray(source["panelDef"])
  const emptyStandardRoot =
    Object.keys(result).length === 0 &&
    Object.entries(source).every(
      ([key, value]) =>
        key === "panelDef" ||
        clientApplicationInterfaceRootAttributeKeys.has(key) ||
        (key === "#text" && typeof value === "string" && value.trim() === "")
    ) &&
    Object.entries(clientApplicationInterfaceRootAttributes).every(([key, value]) => source[key] === value) &&
    panelDefs?.length === requiredStandardPanelUuidSet.size &&
    sourcePanelDefs.length === requiredStandardPanelUuidSet.size &&
    new Set(panelDefs.map(({ id }) => id)).size === requiredStandardPanelUuidSet.size &&
    new Set(sourcePanelDefs.map(getRawXMLId)).size === requiredStandardPanelUuidSet.size &&
    sourcePanelDefs.every((panelDef) => {
      const id = getRawXMLId(panelDef)
      return (
        isRecord(panelDef) &&
        id !== undefined &&
        requiredStandardPanelUuidSet.has(id) &&
        Object.entries(panelDef).every(
          ([key, value]) =>
            key === "_id" || key === "id" || (key === "#text" && typeof value === "string" && value.trim() === "")
        )
      )
    }) &&
    panelDefs.every(
      (panelDef) =>
        requiredStandardPanelUuidSet.has(panelDef.id) &&
        panelDef.name === undefined &&
        panelDef.spr === undefined &&
        Object.keys(panelDef).every((key) => key === "id")
    )
  return emptyStandardRoot ? {} : result
}

const importPanelFromYAML = (
  yaml: string | ClientApplicationInterfacePanelYAML | undefined,
  source: ClientApplicationInterfaceItem | undefined
): ClientApplicationInterfacePanel | undefined => {
  if (yaml === undefined) return undefined
  const sourcePanel = source?.kind === "panel" ? source : undefined
  const result: ClientApplicationInterfacePanel = { kind: "panel" }
  if (sourcePanel?.id !== undefined) result.id = sourcePanel.id

  if (typeof yaml === "string") {
    result.uuid = standardPanelUuidByName[yaml] ?? yaml
    return result
  }

  const uuid =
    yaml.UUID ?? (yaml.Имя !== undefined ? standardPanelUuidByName[yaml.Имя] : undefined) ?? sourcePanel?.uuid
  if (uuid?.startsWith("!xml/") === true) {
    throw new Error("UUID панели не допускает тег XML-аномалии")
  }
  if (uuid !== undefined) result.uuid = uuid
  if (yaml.Имя !== undefined && standardPanelUuidByName[yaml.Имя] === undefined) result.name = yaml.Имя
  if (yaml.Высота !== undefined) result.height = yaml.Высота
  return result
}

const importGroupFromYAML = (
  yaml: { Элементы?: ClientApplicationInterfaceItemsYAML } | undefined,
  source: ClientApplicationInterfaceItem | undefined
): ClientApplicationInterfaceGroup | undefined => {
  if (yaml === undefined) return undefined
  const sourceGroup = source?.kind === "group" ? source : undefined
  const result: ClientApplicationInterfaceGroup = { kind: "group" }
  if (sourceGroup?.id !== undefined) result.id = sourceGroup.id
  result.items = importItemsYAMLValue(yaml.Элементы ?? [], sourceGroup?.items)
  return result
}

const importItemsYAMLValue = (
  yaml: ClientApplicationInterfaceItemsYAML | undefined,
  source: ClientApplicationInterfaceItems | undefined
): ClientApplicationInterfaceItems | undefined => {
  if (yaml === undefined) return undefined
  const usedReferenceIndexes = new Set<number>()
  const items = yaml
    .map((item, index) => {
      const canUseIndexFallback =
        !hasStableYAMLSignature(item) &&
        (!isWeakYAMLGroup(item) ||
          countRemainingWeakYAMLGroups(yaml, index) <= countAvailableReferenceGroups(source, usedReferenceIndexes))
      const referenceIndex = findReferenceItemIndex({
        signatures: getYAMLItemSignature(item),
        fallbackIndex: index,
        referenceItems: source,
        usedReferenceIndexes,
        canUseIndexFallback,
        isCompatibleByIndex: (referenceItem) => isSameYAMLKind(item, referenceItem),
      })
      if (referenceIndex !== undefined) usedReferenceIndexes.add(referenceIndex)
      const sourceItem = referenceIndex !== undefined ? source?.[referenceIndex] : undefined
      return "Панель" in item
        ? importPanelFromYAML(item.Панель, sourceItem)
        : importGroupFromYAML(item.Группа, sourceItem)
    })
    .filter((item): item is ClientApplicationInterfaceItem => item !== undefined)
  const sectionLengths = getSectionLengths(source)
  if (sectionLengths !== undefined) defineSectionLengths(items, sectionLengths)
  return items.length > 0 ? items : []
}

const restoreItemConfigurationIndex = (
  context: ConfigurationContext,
  item: ClientApplicationInterfaceItem,
  address: string
): void => {
  const runtime = context.exportToXML?.configurationIndex
  if (runtime === undefined) return
  const id = runtime.identity("xmlId", address)
  if (id !== undefined) {
    item.id = id
    runtime.collector.setIdentity(address, "xmlId", id)
  }
  if (item.kind !== "group") return
  for (const child of indexedInterfaceItems(address, item.items ?? [])) {
    restoreItemConfigurationIndex(context, child.item, child.address)
  }
}

const restoreItemsConfigurationIndex = (
  context: ConfigurationContext,
  rule: PropertyRule,
  items: ClientApplicationInterfaceItems | undefined
): ClientApplicationInterfaceItems | undefined => {
  const runtime = context.exportToXML?.configurationIndex
  if (runtime === undefined || items === undefined) return items
  const propertyRuntime = runtime.withPropertyContext(rule.yaml ?? rule.xml ?? "items", undefined, {
    configurationIndexAddressing: rule.configurationIndexAddressing,
  })
  const address = propertyRuntime.xmlNodeLogicalAddress ?? propertyRuntime.logicalAddress
  for (const entry of indexedInterfaceItems(address, items)) {
    restoreItemConfigurationIndex(context, entry.item, entry.address)
  }
  return items
}

const importItemsFromYAML: ImportFromYAMLFunctionNew = ({ context, rule, value, source }) =>
  restoreItemsConfigurationIndex(
    context,
    rule,
    importItemsYAMLValue(
    value as ClientApplicationInterfaceItemsYAML | undefined,
    source as ClientApplicationInterfaceItems | undefined
    )
  )

const exportPanelXML = (
  panel: ClientApplicationInterfacePanel,
  context: ConfigurationContext
): Record<string, unknown> => {
  const xml: Record<string, unknown> = { _id: panel.id ?? getUUID(context) }
  if (panel.uuid !== undefined) xml.uuid = panel.uuid
  if (panel.name !== undefined) xml.name = panel.name
  if (panel.height !== undefined) xml.height = panel.height
  return xml
}

const exportGroupXML = (
  group: ClientApplicationInterfaceGroup,
  context: ConfigurationContext
): Record<string, unknown> => {
  const xml: Record<string, unknown> = {}
  const id = group.id
  if (id !== undefined) xml._id = id
  const childItems = exportItemsToSectionXML({
    context,
    items: group.items ?? [],
  })
  Object.assign(xml, childItems)
  return xml
}

const exportItemsToSectionXML = (params: {
  context: ConfigurationContext
  items: ClientApplicationInterfaceItems
}): Record<string, unknown> => {
  const panels: Record<string, unknown>[] = []
  const groups: Record<string, unknown>[] = []
  const orderedChildren: Array<{ key: string; value: unknown }> = []
  params.items.forEach((item) => {
    if (item.kind === "panel") {
      const panel = exportPanelXML(item, params.context)
      panels.push(panel)
      orderedChildren.push({ key: "panel", value: panel })
    } else {
      const group = exportGroupXML(item, params.context)
      groups.push(group)
      orderedChildren.push({ key: "group", value: group })
    }
  })

  const section = {
    ...(panels.length > 0 ? { panel: panels } : {}),
    ...(groups.length > 0 ? { group: groups } : {}),
  }
  if (orderedChildren.length > 0) {
    Object.defineProperty(section, XML_ORDERED_CHILDREN, {
      value: orderedChildren,
      enumerable: false,
    })
  }
  return section
}

const splitItemsBySections = (
  items: ClientApplicationInterfaceItems
): ClientApplicationInterfaceItems[] => {
  const sectionLengths = getSectionLengths(items)
  if (sectionLengths === undefined) return items.map((item) => [item])

  const sections: ClientApplicationInterfaceItems[] = []
  let start = 0
  for (const length of sectionLengths) {
    sections.push(items.slice(start, start + length))
    start += length
  }
  for (const item of items.slice(start)) {
    sections.push([item])
  }
  return sections.filter((section) => section.length > 0)
}

const exportItemsToXML: ExportToXMLFunctionNew = ({ context, value }) => {
  if (value === undefined) return undefined
  const items = value as ClientApplicationInterfaceItems
  return splitItemsBySections(items).map((sectionItems) => {
    return exportItemsToSectionXML({
      context,
      items: sectionItems,
    })
  })
}

const collectPanels = (items: ClientApplicationInterfaceItems | undefined): ClientApplicationInterfacePanel[] =>
  items?.flatMap((item) => (item.kind === "panel" ? [item] : collectPanels(item.items))) ?? []

const collectAllPanels = (metadataItem: Record<string, unknown> | undefined): ClientApplicationInterfacePanel[] =>
  ["top", "left", "right", "bottom"].flatMap((key) =>
    collectPanels(metadataItem?.[key] as ClientApplicationInterfaceItems | undefined)
  )

const collectAllPanelsFromYAMLSource = (
  source: import("../../ruleRuntime/property/fromYAMLToXMLTypes").YAMLPropertySource
): ClientApplicationInterfacePanel[] =>
  ["top", "left", "right", "bottom"].flatMap((propertyKey) => collectPanelsFromYAML(source.raw(propertyKey)))

const collectPanelsFromYAML = (value: unknown): ClientApplicationInterfacePanel[] => {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!isRecord(entry)) return []
    if ("Панель" in entry) {
      const panel = importPanelFromYAML(
        entry.Панель as string | ClientApplicationInterfacePanelYAML | undefined,
        undefined
      )
      return panel === undefined ? [] : [panel]
    }
    if (isRecord(entry.Группа)) return collectPanelsFromYAML(entry.Группа.Элементы)
    return []
  })
}

const exportPanelDefXML = (params: {
  id: string
  name?: string
  spr?: SectionsPanelRepresentation
}): Record<string, unknown> => {
  const xml: Record<string, unknown> = { _id: params.id }
  const name = params.name
  if (name !== undefined) xml.name = name
  if (params.spr !== undefined) xml.spr = params.spr
  return xml
}

const exportPanelDefsToXML: ExportToXMLFunctionNew = ({
  value,
  source,
  metadataItem,
}) => {
  const panels =
    source === undefined
      ? collectAllPanels(metadataItem as Record<string, unknown> | undefined)
      : collectAllPanelsFromYAMLSource(source)
  const panelDefs = (value as ClientApplicationInterfacePanelDefs | undefined) ?? []
  const byId = new Map(panelDefs.map((panelDef) => [panelDef.id, panelDef]))
  const explicitPanelDefIds =
    source === undefined
      ? new Set<string>()
      : new Set(
          ["top", "left", "right", "bottom"].flatMap((propertyKey) =>
            [...collectExplicitEmptyPanelDefinitionUUIDs(source.raw(propertyKey), standardPanelUuids)]
          )
        )
  const metadataSectionsPanelRepresentation = (metadataItem as Record<string, unknown> | undefined)
    ?.sectionsPanelRepresentation as SectionsPanelRepresentation | undefined
  const sectionsPanelRepresentation =
    source === undefined
      ? metadataSectionsPanelRepresentation
      : panelPresentationFromYAML(
          source.raw("sectionsPanelRepresentation") as SectionsPanelRepresentationYAML | undefined
        ) ?? metadataSectionsPanelRepresentation
  const emittedIds = new Set<string>()
  const result: Record<string, unknown>[] = []

  for (const id of requiredStandardPanelUuids) {
    emittedIds.add(id)
    result.push(
      exportPanelDefXML({
        id,
        spr: id === sectionsPanelUuid ? sectionsPanelRepresentation : undefined,
        name: byId.get(id)?.name,
      })
    )
  }

  for (const panel of panels) {
    if (panel.uuid === undefined || emittedIds.has(panel.uuid)) continue
    const panelDef = byId.get(panel.uuid)
    const shouldCreatePanelDef =
      panel.name !== undefined ||
      panelDef?.name !== undefined ||
      panelDef?.spr !== undefined ||
      explicitPanelDefIds.has(panel.uuid)
    if (!shouldCreatePanelDef) continue
    emittedIds.add(panel.uuid)
    result.push(
      exportPanelDefXML({
        id: panel.uuid,
        name: panel.name ?? panelDef?.name,
        spr: panelDef?.spr,
      })
    )
  }

  return result.length > 0 ? result : undefined
}

export const metadataRuleLayer000 = defineMetadataRules({
  ...defineMetadataItemRule({
    propertyType: "ClientApplicationInterface",
    itemRule: ClientApplicationInterfaceRules,
  }),
})
export const metadataPropertyRule001 = definePropertyTypeRule("ClientApplicationInterface", "importFromXMLToYAML", importClientApplicationInterfaceFromXMLToYAML)
export const metadataPropertyRule010 = definePropertyTypeRule(
  "ClientApplicationInterface",
  "xmlImportPropertyBehavior",
  { presenceAffectsExport: true },
)

export const metadataPropertyRule002 = definePropertyTypeRule("ClientApplicationInterfaceItems", "importFromXML", importItemsFromXML)
export const metadataPropertyRule003 = definePropertyTypeRule("ClientApplicationInterfaceItems", "exportToXML", exportItemsToXML)
export const metadataPropertyRule004 = definePropertyTypeRule("ClientApplicationInterfaceItems", "importFromYAML", importItemsFromYAML)
export const metadataPropertyRule005 = definePropertyTypeRule("ClientApplicationInterfaceItems", "exportToYAML", exportItemsPropertyToYAML)
export const metadataPropertyRule006 = definePropertyTypeRule(
  "ClientApplicationInterfaceItems",
  "exportToJSONSchema",
  ({ context }) =>
    context.exportToJSONSchema?.validationPropertyRefs === true
      ? ClientApplicationInterfaceItemsValidationYAMLSchema
      : ClientApplicationInterfaceItemsHintYAMLSchema
)

export const metadataPropertyRule007 = definePropertyTypeRule("ClientApplicationInterfacePanelDefs", "importFromXML", importPanelDefsFromXML)
export const metadataPropertyRule008 = definePropertyTypeRule("ClientApplicationInterfacePanelDefs", "exportToXML", exportPanelDefsToXML)
export const metadataPropertyRule009 = definePropertyTypeRule("ClientApplicationInterfacePanelDefs", "exportToJSONSchema", () => Type.Array(Type.Object({})))

export const metadataPropertyRule011 = definePropertyTypeRule("ClientApplicationInterfaceItems", "xmlImportPropertyBehavior", {
  repeatedXMLNodes: true,
})
export const metadataPropertyRule012 = definePropertyTypeRule("ClientApplicationInterfacePanelDefs", "xmlImportPropertyBehavior", {
  repeatedXMLNodes: true,
})
