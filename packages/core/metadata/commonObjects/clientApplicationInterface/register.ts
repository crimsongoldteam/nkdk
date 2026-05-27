import { Type } from "@sinclair/typebox"
import { getUUID } from "~/metadata/helpers/uuid"
import {
  ExportToXMLFunctionNew,
  ImportFromYAMLFunctionNew,
  registerMetadataItemRule,
  registerTypeRule,
  type PropertyRule,
} from "~/metadata/orchestration"
import type { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import {
  SectionsPanelRepresentationFromYAML,
  SectionsPanelRepresentationToYAML,
  type SectionsPanelRepresentation,
  type SectionsPanelRepresentationYAML,
} from "~/metadata/systemEnumerations/types"
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
  ClientApplicationInterfaceItemsYAMLSchema,
} from "./types"

const standardPanelsByUuid = {
  "b553047f-c9aa-4157-978d-448ecad24248": "ПанельИстории",
  "13322b22-3960-4d68-93a6-fe2dd7f28ca3": "ПанельРазделов",
  "c933ac92-92cd-459d-81cc-e0c8a83ced99": "ПанельФункцийТекущегоРаздела",
  "cbab57f2-a0f3-4f0a-89ea-4cb19570ab75": "ПанельОткрытых",
  "b2735bd3-d822-4430-ba59-c9e869693b24": "ПанельИзбранного",
  "00000000-0000-0000-0000-000000000000": "СтандартнаяПанель",
} as const

const standardPanelUuidByName = Object.fromEntries(
  Object.entries(standardPanelsByUuid).map(([uuid, name]) => [name, uuid])
) as Record<string, string>

const XML_REFERENCE_RAW = "__xmlReferenceRaw"

interface ClientApplicationInterfaceContext extends ConfigurationContext {
  clientApplicationInterfacePanelDefsById?: Map<string, ClientApplicationInterfacePanelDef>
  clientApplicationInterfacePanelsByUuid?: Map<string, ClientApplicationInterfacePanel[]>
}

const toArray = <T>(value: T | T[] | undefined): T[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const cloneXMLValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(cloneXMLValue)
  if (!isRecord(value)) return value
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneXMLValue(entry)]))
}

const copyUnknownXMLKeys = (source: unknown, knownKeys: string[]): Record<string, unknown> => {
  if (!isRecord(source)) return {}
  const known = new Set(knownKeys)
  return Object.fromEntries(
    Object.entries(source)
      .filter(([key]) => key !== "#text" && !known.has(key))
      .map(([key, value]) => [key, cloneXMLValue(value)])
  )
}

const defineReferenceRawXML = (params: {
  context?: ConfigurationContextFromXML
  target: object
  xml: unknown
}): void => {
  if (params.context !== undefined && !params.context.fromXML.forReference) return
  if (params.xml === undefined) return
  Object.defineProperty(params.target, XML_REFERENCE_RAW, {
    value: params.xml,
    enumerable: false,
  })
}

const getReferenceRawXML = (referenceMetadata: unknown): Record<string, unknown> | undefined => {
  if (!isRecord(referenceMetadata)) return undefined
  const raw = referenceMetadata[XML_REFERENCE_RAW]
  return isRecord(raw) ? raw : undefined
}

const getXMLId = (xml: { _id?: string; id?: string } | undefined): string | undefined => xml?._id ?? xml?.id

const importPanelFromXML = (
  context: ConfigurationContextFromXML,
  xml: ClientApplicationInterfacePanelXML
): ClientApplicationInterfacePanel => {
  const panel: ClientApplicationInterfacePanel = {
    kind: "panel",
  }
  const id = getXMLId(xml)
  if (id !== undefined) panel.id = id
  if (xml.uuid !== undefined) panel.uuid = xml.uuid
  if (xml.name !== undefined) panel.name = xml.name
  if (xml.height !== undefined) panel.height = Number(xml.height)
  if (xml.uuid !== undefined) {
    const clientInterfaceContext = context as ClientApplicationInterfaceContext
    const spr = clientInterfaceContext.clientApplicationInterfacePanelDefsById?.get(xml.uuid)?.spr
    if (spr !== undefined) panel.spr = spr
    const panels = clientInterfaceContext.clientApplicationInterfacePanelsByUuid?.get(xml.uuid) ?? []
    panels.push(panel)
    if (clientInterfaceContext.clientApplicationInterfacePanelsByUuid === undefined) {
      clientInterfaceContext.clientApplicationInterfacePanelsByUuid = new Map()
    }
    clientInterfaceContext.clientApplicationInterfacePanelsByUuid.set(xml.uuid, panels)
  }
  defineReferenceRawXML({ context, target: panel, xml })
  return panel
}

const importGroupFromXML = (
  context: ConfigurationContextFromXML,
  xml: ClientApplicationInterfaceGroupXML
): ClientApplicationInterfaceGroup => {
  const group: ClientApplicationInterfaceGroup = { kind: "group" }
  const id = getXMLId(xml)
  if (id !== undefined) group.id = id
  const items = importItemsFromSectionXML(context, xml)
  if (items.length > 0) group.items = items
  defineReferenceRawXML({ context, target: group, xml })
  return group
}

const importItemsFromSectionXML = (
  context: ConfigurationContextFromXML,
  xml: {
    panel?: ClientApplicationInterfacePanelXML | ClientApplicationInterfacePanelXML[]
    group?: ClientApplicationInterfaceGroupXML | ClientApplicationInterfaceGroupXML[]
  }
): ClientApplicationInterfaceItems => [
  ...toArray(xml.panel).map((panel) => importPanelFromXML(context, panel)),
  ...toArray(xml.group).map((group) => importGroupFromXML(context, group)),
]

const importItemsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: unknown
): ClientApplicationInterfaceItems | undefined => {
  const items = toArray(xml)
    .filter(isRecord)
    .flatMap((section) => importItemsFromSectionXML(context, section))
  return items.length > 0 ? items : undefined
}

const importPanelDefsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: ClientApplicationInterfacePanelDefXML | ClientApplicationInterfacePanelDefXML[] | undefined
): ClientApplicationInterfacePanelDefs | undefined => {
  const panelDefs = toArray(xml)
    .map((panelDef) => {
      const id = getXMLId(panelDef)
      if (id === undefined) return undefined
      const result: ClientApplicationInterfacePanelDef = { id }
      if (panelDef.name !== undefined) result.name = panelDef.name
      if (panelDef.spr !== undefined) result.spr = panelDef.spr
      defineReferenceRawXML({ context, target: result, xml: panelDef })
      return result
    })
    .filter((panelDef): panelDef is ClientApplicationInterfacePanelDef => panelDef !== undefined)

  ;(context as ClientApplicationInterfaceContext).clientApplicationInterfacePanelDefsById = new Map(
    panelDefs.map((panelDef) => [panelDef.id, panelDef])
  )
  const panelsByUuid = (context as ClientApplicationInterfaceContext).clientApplicationInterfacePanelsByUuid
  for (const panelDef of panelDefs) {
    if (panelDef.spr === undefined) continue
    for (const panel of panelsByUuid?.get(panelDef.id) ?? []) {
      panel.spr = panelDef.spr
    }
  }

  return panelDefs.length > 0 ? panelDefs : undefined
}

const getPanelPresentation = (
  panel: ClientApplicationInterfacePanel,
  panelDefsById: Map<string, ClientApplicationInterfacePanelDef>
): SectionsPanelRepresentation | undefined => panel.spr ?? (panel.uuid ? panelDefsById.get(panel.uuid)?.spr : undefined)

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
  const presentation = panelPresentationToYAML(getPanelPresentation(panel, panelDefsById))
  const displayName = panel.name ?? standardName
  const needsExpanded =
    panel.height !== undefined || panel.name !== undefined || presentation !== undefined || standardName === undefined

  if (!needsExpanded && standardName !== undefined) return { Панель: standardName }

  return {
    Панель: {
      ...(displayName !== undefined ? { Имя: displayName } : {}),
      ...(panel.uuid !== undefined && standardName === undefined ? { UUID: panel.uuid } : {}),
      ...(panel.height !== undefined ? { Высота: panel.height } : {}),
      ...(presentation !== undefined ? { Представление: presentation } : {}),
    },
  }
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

  const uuid = yaml.UUID ?? (yaml.Имя !== undefined ? standardPanelUuidByName[yaml.Имя] : undefined)
  if (uuid !== undefined) result.uuid = uuid
  if (yaml.Имя !== undefined && standardPanelUuidByName[yaml.Имя] === undefined) result.name = yaml.Имя
  if (yaml.Высота !== undefined) result.height = yaml.Высота
  const spr = panelPresentationFromYAML(yaml.Представление)
  if (spr !== undefined) result.spr = spr
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
  const items = yaml
    .map((item, index) =>
      "Панель" in item
        ? importPanelFromYAML(item.Панель, source?.[index])
        : importGroupFromYAML(item.Группа, source?.[index])
    )
    .filter((item): item is ClientApplicationInterfaceItem => item !== undefined)
  return items.length > 0 ? items : []
}

const importItemsFromYAML: ImportFromYAMLFunctionNew = ({ value, source }) =>
  importItemsYAMLValue(
    value as ClientApplicationInterfaceItemsYAML | undefined,
    source as ClientApplicationInterfaceItems | undefined
  )

const mergePanelWithReference = (
  panel: ClientApplicationInterfacePanel,
  referencePanel: unknown,
  context: ConfigurationContext
): Record<string, unknown> => {
  const referenceXML = getReferenceRawXML(referencePanel) ?? referencePanel
  const xml = copyUnknownXMLKeys(referenceXML, ["_id", "id", "uuid", "name", "height"])
  xml._id = panel.id ?? getXMLId(referenceXML as { _id?: string; id?: string } | undefined) ?? getUUID(context)
  if (panel.uuid !== undefined) xml.uuid = panel.uuid
  if (panel.name !== undefined) xml.name = panel.name
  if (panel.height !== undefined) xml.height = panel.height
  return xml
}

const mergeGroupWithReference = (
  group: ClientApplicationInterfaceGroup,
  referenceGroup: unknown,
  context: ConfigurationContext
): Record<string, unknown> => {
  const referenceXML = getReferenceRawXML(referenceGroup) ?? referenceGroup
  const xml = copyUnknownXMLKeys(referenceXML, ["_id", "id", "panel", "group"])
  xml._id = group.id ?? getXMLId(referenceXML as { _id?: string; id?: string } | undefined) ?? getUUID(context)
  const childItems = exportItemsToSectionXML({
    context,
    items: group.items ?? [],
    referenceItems: (referenceGroup as ClientApplicationInterfaceGroup | undefined)?.items,
  })
  Object.assign(xml, childItems)
  return xml
}

const exportItemsToSectionXML = (params: {
  context: ConfigurationContext
  items: ClientApplicationInterfaceItems
  referenceItems?: ClientApplicationInterfaceItems
}): Record<string, unknown> => {
  const panels: Record<string, unknown>[] = []
  const groups: Record<string, unknown>[] = []

  params.items.forEach((item, index) => {
    const referenceItem = params.referenceItems?.[index]
    if (item.kind === "panel") {
      panels.push(mergePanelWithReference(item, referenceItem, params.context))
    } else {
      groups.push(mergeGroupWithReference(item, referenceItem, params.context))
    }
  })

  return {
    ...(panels.length > 0 ? { panel: panels } : {}),
    ...(groups.length > 0 ? { group: groups } : {}),
  }
}

const exportItemsToXML: ExportToXMLFunctionNew = ({ context, value, referenceMetadata }) => {
  if (value === undefined) return undefined
  const items = value as ClientApplicationInterfaceItems
  return items.map((item, index) =>
    exportItemsToSectionXML({
      context,
      items: [item],
      referenceItems: referenceMetadata ? [referenceMetadata[index]] : undefined,
    })
  )
}

const collectPanels = (items: ClientApplicationInterfaceItems | undefined): ClientApplicationInterfacePanel[] =>
  items?.flatMap((item) => (item.kind === "panel" ? [item] : collectPanels(item.items))) ?? []

const collectAllPanels = (metadataItem: Record<string, unknown> | undefined): ClientApplicationInterfacePanel[] =>
  ["top", "left", "right", "bottom"].flatMap((key) =>
    collectPanels(metadataItem?.[key] as ClientApplicationInterfaceItems | undefined)
  )

const mergePanelDefWithReference = (params: {
  id: string
  spr?: SectionsPanelRepresentation
  referencePanelDef?: ClientApplicationInterfacePanelDef
}): Record<string, unknown> => {
  const referenceXML = getReferenceRawXML(params.referencePanelDef) ?? params.referencePanelDef
  const xml = copyUnknownXMLKeys(referenceXML, ["_id", "id", "name", "spr"])
  xml._id = params.id
  const name = params.referencePanelDef?.name
  if (name !== undefined) xml.name = name
  if (params.spr !== undefined) xml.spr = params.spr
  return xml
}

const exportPanelDefsToXML: ExportToXMLFunctionNew = ({ value, metadataItem, referenceMetadata }) => {
  const panels = collectAllPanels(metadataItem as Record<string, unknown> | undefined)
  const panelDefs = (value as ClientApplicationInterfacePanelDefs | undefined) ?? []
  const referencePanelDefs = (referenceMetadata as ClientApplicationInterfacePanelDefs | undefined) ?? panelDefs
  const byId = new Map(panelDefs.map((panelDef) => [panelDef.id, panelDef]))
  const referenceById = new Map(referencePanelDefs.map((panelDef) => [panelDef.id, panelDef]))
  const usedPanelIds = new Set(panels.map((panel) => panel.uuid).filter((uuid): uuid is string => uuid !== undefined))
  const emittedIds = new Set<string>()
  const result: Record<string, unknown>[] = []

  for (const referencePanelDef of referencePanelDefs) {
    if (!usedPanelIds.has(referencePanelDef.id)) continue
    emittedIds.add(referencePanelDef.id)
    const panel = panels.find((item) => item.uuid === referencePanelDef.id)
    result.push(
      mergePanelDefWithReference({
        id: referencePanelDef.id,
        spr: panel?.spr ?? byId.get(referencePanelDef.id)?.spr,
        referencePanelDef,
      })
    )
  }

  if (referencePanelDefs.length > 0) {
    return result.length > 0 ? result : undefined
  }

  for (const panel of panels) {
    if (panel.uuid === undefined || emittedIds.has(panel.uuid)) continue
    emittedIds.add(panel.uuid)
    result.push(
      mergePanelDefWithReference({
        id: panel.uuid,
        spr: panel.spr ?? byId.get(panel.uuid)?.spr,
        referencePanelDef: referenceById.get(panel.uuid),
      })
    )
  }

  return result.length > 0 ? result : undefined
}

registerMetadataItemRule({
  propertyType: "ClientApplicationInterface",
  itemRule: ClientApplicationInterfaceRules,
})

registerTypeRule("ClientApplicationInterfaceItems", "importFromXML", importItemsFromXML)
registerTypeRule("ClientApplicationInterfaceItems", "exportToXML", exportItemsToXML)
registerTypeRule("ClientApplicationInterfaceItems", "importFromYAML", importItemsFromYAML)
registerTypeRule("ClientApplicationInterfaceItems", "exportToYAML", exportItemsPropertyToYAML)
registerTypeRule(
  "ClientApplicationInterfaceItems",
  "exportToJSONSchema",
  () => ClientApplicationInterfaceItemsYAMLSchema
)

registerTypeRule("ClientApplicationInterfacePanelDefs", "importFromXML", importPanelDefsFromXML)
registerTypeRule("ClientApplicationInterfacePanelDefs", "exportToXML", exportPanelDefsToXML)
registerTypeRule("ClientApplicationInterfacePanelDefs", "exportToJSONSchema", () => Type.Array(Type.Object({})))
