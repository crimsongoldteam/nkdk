import { Type } from "@sinclair/typebox"
import { importBooleanFromXML } from "~/metadata/commonObjects/boolean/fromXML"
import { importBooleanFromYAML } from "~/metadata/commonObjects/boolean/fromYAML"
import { exportBooleanToYAML } from "~/metadata/commonObjects/boolean/toYAML"
import { importMetadataItemLinkFromYAML } from "~/metadata/commonObjects/metadataRef/fromYAML"
import { exportMetadataItemLinkToYAML } from "~/metadata/commonObjects/metadataRef/toYAML"
import {
  ExportToXMLFunctionNew,
  registerMetadataItemRule,
  registerTypeRule,
  type PropertyRule,
} from "~/metadata/orchestration"
import type { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import {
  CommandInterfaceOrder,
  CommandInterfaceOrderJSONSchema,
  CommandInterfaceOrderXML,
  CommandInterfacePlacementMap,
  CommandInterfacePlacementMapJSONSchema,
  CommandInterfacePlacementMapXML,
  CommandInterfacePlacementMapYAML,
  CommandInterfaceVisibility,
  CommandInterfaceVisibilityMap,
  CommandInterfaceVisibilityMapJSONSchema,
  CommandInterfaceVisibilityMapXML,
  CommandInterfaceVisibilityMapYAML,
  CommandInterfaceVisibilityXML,
} from "./types"
import { RootCommandInterfaceRules } from "./rules"

const placementToYAML = {
  Auto: "Авто",
  Manual: "Вручную",
} as const

const placementFromYAML = {
  Авто: "Auto",
  Вручную: "Manual",
} as const

const standardCommandGroupToYAML = {
  NavigationPanelImportant: "ПанельНавигацииВажное",
  NavigationPanelOrdinary: "ПанельНавигацииОбычное",
  NavigationPanelSeeAlso: "ПанельНавигацииСмТакже",
  ActionsPanelCreate: "ПанельДействийСоздать",
  ActionsPanelReports: "ПанельДействийОтчеты",
  ActionsPanelTools: "ПанельДействийСервис",
} as const

const standardCommandGroupFromYAML = {
  ПанельНавигацииВажное: "NavigationPanelImportant",
  ПанельНавигацииОбычное: "NavigationPanelOrdinary",
  ПанельНавигацииСмТакже: "NavigationPanelSeeAlso",
  ПанельДействийСоздать: "ActionsPanelCreate",
  ПанельДействийОтчеты: "ActionsPanelReports",
  ПанельДействийСервис: "ActionsPanelTools",
} as const

const roleNameRule = { type: "MetadataItemLink", roleReferenceYAML: "name" } as const satisfies PropertyRule
const XML_REFERENCE_RAW = "__xmlReferenceRaw"

const getXMLName = (value: { _name?: string; name?: string }): string | undefined => value._name ?? value.name

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
  context: ConfigurationContextFromXML
  target: object
  xml: unknown
}): void => {
  if (!params.context.fromXML.forReference || params.xml === undefined) return
  Object.defineProperty(params.target, XML_REFERENCE_RAW, {
    value: params.xml,
    enumerable: false,
  })
}

const getReferenceRawXML = (referenceMetadata: unknown): Record<string, unknown> | undefined => {
  if (referenceMetadata === null || referenceMetadata === undefined || typeof referenceMetadata !== "object") {
    return undefined
  }
  const raw = (referenceMetadata as Record<string, unknown>)[XML_REFERENCE_RAW]
  return isRecord(raw) ? raw : undefined
}

const findReferenceXMLItemByName = (params: {
  referenceMetadata: unknown
  itemKey: "Command" | "Subsystem"
  name: string
}): Record<string, unknown> | undefined => {
  const raw = getReferenceRawXML(params.referenceMetadata)
  const rawItems = raw?.[params.itemKey]
  return toArray(rawItems)
    .filter(isRecord)
    .find((item) => getXMLName(item) === params.name)
}

const mergeXMLItemWithReference = (params: {
  referenceItem: Record<string, unknown> | undefined
  name: string
  knownValues: Record<string, unknown>
}): Record<string, unknown> => {
  const item = copyUnknownXMLKeys(params.referenceItem, ["_name", "name", ...Object.keys(params.knownValues)])
  item._name = params.name
  for (const [key, value] of Object.entries(params.knownValues)) {
    if (value !== undefined) item[key] = value
  }
  return item
}

const getVisibilityXMLItemKey = (rule: PropertyRule): "Command" | "Subsystem" =>
  rule.xml === "SubsystemsVisibility" ? "Subsystem" : "Command"

const commandGroupToYAML = (value: string): string =>
  value in standardCommandGroupToYAML
    ? standardCommandGroupToYAML[value as keyof typeof standardCommandGroupToYAML]
    : value

const commandGroupFromYAML = (value: string): string =>
  value in standardCommandGroupFromYAML
    ? standardCommandGroupFromYAML[value as keyof typeof standardCommandGroupFromYAML]
    : value

const placementValueToYAML = (value: string): string =>
  value in placementToYAML ? placementToYAML[value as keyof typeof placementToYAML] : value

const placementValueFromYAML = (value: string): string =>
  value in placementFromYAML ? placementFromYAML[value as keyof typeof placementFromYAML] : value

const importVisibilityFromXML = (
  context: ConfigurationContextFromXML,
  item: CommandInterfaceVisibilityXML
): CommandInterfaceVisibility | undefined => {
  const visibility = item.Visibility
  if (visibility === undefined) return undefined

  const result: CommandInterfaceVisibility = {}
  const common = importBooleanFromXML(context, undefined, visibility["xr:Common"])
  if (common !== undefined) result.common = common

  const roleValues = toArray(visibility["xr:Value"])
  const roles: Record<string, boolean> = {}
  for (const role of roleValues) {
    const roleName = getXMLName(role)
    const value = importBooleanFromXML(context, undefined, role["#text"])
    if (roleName !== undefined && value !== undefined) roles[roleName] = value
  }
  if (Object.keys(roles).length > 0) result.roles = roles

  return Object.keys(result).length > 0 ? result : undefined
}

const importVisibilityMapFromXML = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule,
  xml: CommandInterfaceVisibilityMapXML | undefined
): CommandInterfaceVisibilityMap | undefined => {
  if (xml === undefined) return undefined

  const itemKey = getVisibilityXMLItemKey(rule)
  const result: CommandInterfaceVisibilityMap = {}
  for (const item of toArray(xml[itemKey])) {
    const name = getXMLName(item)
    const visibility = importVisibilityFromXML(context, item)
    if (name !== undefined && visibility !== undefined) result[name] = visibility
  }

  defineReferenceRawXML({ context, target: result, xml })
  return Object.keys(result).length > 0 ? result : undefined
}

const exportVisibilityMapToXML: ExportToXMLFunctionNew = ({ rule, value, referenceMetadata }) => {
  if (value === undefined) return undefined

  const itemKey = getVisibilityXMLItemKey(rule)
  const visibilityMap = value as CommandInterfaceVisibilityMap
  const items = Object.entries(visibilityMap).map(([name, visibility]) => {
    const referenceItem = findReferenceXMLItemByName({ referenceMetadata, itemKey, name })
    const referenceVisibility = isRecord(referenceItem?.Visibility) ? referenceItem.Visibility : undefined
    const visibilityXML = copyUnknownXMLKeys(referenceVisibility, ["xr:Common", "xr:Value"])
    if (visibility.common !== undefined) visibilityXML["xr:Common"] = visibility.common
    if (visibility.roles !== undefined) {
      const roles = Object.entries(visibility.roles).map(([roleName, roleVisibility]) => ({
        _name: roleName,
        "#text": roleVisibility,
      }))
      if (roles.length > 0) visibilityXML["xr:Value"] = roles
    }
    return mergeXMLItemWithReference({
      referenceItem,
      name,
      knownValues: { Visibility: visibilityXML },
    }) as CommandInterfaceVisibilityXML
  })

  return items.length > 0 ? { [itemKey]: items } : undefined
}

const importVisibilityMapFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  yaml: CommandInterfaceVisibilityMapYAML | undefined
): CommandInterfaceVisibilityMap | undefined => {
  if (yaml === undefined) return undefined

  const result: CommandInterfaceVisibilityMap = {}
  for (const [name, visibility] of Object.entries(yaml)) {
    const item: CommandInterfaceVisibility = {}
    const common = importBooleanFromYAML(context, undefined, visibility.Общее)
    if (common !== undefined) item.common = common

    if (visibility.Роли !== undefined) {
      const roles: Record<string, boolean> = {}
      for (const [roleName, roleVisibility] of Object.entries(visibility.Роли)) {
        const importedRoleName = importMetadataItemLinkFromYAML(context, roleNameRule, roleName)
        const importedValue = importBooleanFromYAML(context, undefined, roleVisibility)
        if (importedRoleName !== undefined && importedValue !== undefined) roles[importedRoleName] = importedValue
      }
      if (Object.keys(roles).length > 0) item.roles = roles
    }

    if (Object.keys(item).length > 0) result[name] = item
  }

  return Object.keys(result).length > 0 ? result : undefined
}

const exportVisibilityMapToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  value: CommandInterfaceVisibilityMap | undefined
): CommandInterfaceVisibilityMapYAML | undefined => {
  if (value === undefined) return undefined

  const result: CommandInterfaceVisibilityMapYAML = {}
  for (const [name, visibility] of Object.entries(value)) {
    const item: CommandInterfaceVisibilityMapYAML[string] = {}
    const common = exportBooleanToYAML(context, undefined, visibility.common)
    if (common !== undefined) item.Общее = common

    if (visibility.roles !== undefined) {
      const roles: Record<string, "Истина" | "Ложь"> = {}
      for (const [roleName, roleVisibility] of Object.entries(visibility.roles)) {
        const exportedRoleName = exportMetadataItemLinkToYAML(context, roleNameRule, roleName)
        const exportedValue = exportBooleanToYAML(context, undefined, roleVisibility)
        if (exportedRoleName !== undefined && exportedValue !== undefined) roles[exportedRoleName] = exportedValue
      }
      if (Object.keys(roles).length > 0) item.Роли = roles
    }

    if (Object.keys(item).length > 0) result[name] = item
  }

  return Object.keys(result).length > 0 ? result : undefined
}

const importPlacementMapFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: CommandInterfacePlacementMapXML | undefined
): CommandInterfacePlacementMap | undefined => {
  if (xml === undefined) return undefined

  const result: CommandInterfacePlacementMap = {}
  for (const item of toArray(xml.Command)) {
    const name = getXMLName(item)
    if (name === undefined) continue
    result[name] = {
      commandGroup: item.CommandGroup,
      placement: item.Placement,
    }
  }

  defineReferenceRawXML({ context, target: result, xml })
  return Object.keys(result).length > 0 ? result : undefined
}

const exportPlacementMapToXML: ExportToXMLFunctionNew = ({ value, referenceMetadata }) => {
  if (value === undefined) return undefined

  const placementMap = value as CommandInterfacePlacementMap
  const items = Object.entries(placementMap).map(([name, placement]) => {
    const referenceItem = findReferenceXMLItemByName({ referenceMetadata, itemKey: "Command", name })
    return mergeXMLItemWithReference({
      referenceItem,
      name,
      knownValues: {
        CommandGroup: placement.commandGroup,
        Placement: placement.placement,
      },
    }) as CommandInterfacePlacementXML
  })

  return items.length > 0 ? { Command: items } : undefined
}

const importPlacementMapFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  yaml: CommandInterfacePlacementMapYAML | undefined
): CommandInterfacePlacementMap | undefined => {
  if (yaml === undefined) return undefined

  const result: CommandInterfacePlacementMap = {}
  for (const [name, placement] of Object.entries(yaml)) {
    result[name] = {
      commandGroup: placement.ГруппаКоманд !== undefined ? commandGroupFromYAML(placement.ГруппаКоманд) : undefined,
      placement: placement.Размещение !== undefined ? placementValueFromYAML(placement.Размещение) : undefined,
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}

const exportPlacementMapToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: CommandInterfacePlacementMap | undefined
): CommandInterfacePlacementMapYAML | undefined => {
  if (value === undefined) return undefined

  const result: CommandInterfacePlacementMapYAML = {}
  for (const [name, placement] of Object.entries(value)) {
    result[name] = {
      ГруппаКоманд: placement.commandGroup !== undefined ? commandGroupToYAML(placement.commandGroup) : undefined,
      Размещение: placement.placement !== undefined ? placementValueToYAML(placement.placement) : undefined,
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}

const importOrderFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: CommandInterfaceOrderXML | undefined
): CommandInterfaceOrder | undefined => {
  if (xml === undefined) return undefined

  const result = toArray(xml.Command)
    .map((item) => {
      const command = getXMLName(item)
      return command !== undefined && item.CommandGroup !== undefined
        ? { command, commandGroup: item.CommandGroup }
        : undefined
    })
    .filter((item): item is CommandInterfaceOrder[number] => item !== undefined)

  defineReferenceRawXML({ context, target: result, xml })
  return result.length > 0 ? result : undefined
}

const exportOrderToXML: ExportToXMLFunctionNew = ({ value, referenceMetadata }) => {
  if (value === undefined) return undefined

  const order = value as CommandInterfaceOrder
  const items = order.map((item) => {
    const referenceItem = findReferenceXMLItemByName({
      referenceMetadata,
      itemKey: "Command",
      name: item.command,
    })
    return mergeXMLItemWithReference({
      referenceItem,
      name: item.command,
      knownValues: { CommandGroup: item.commandGroup },
    }) as CommandInterfaceOrderXML["Command"]
  })

  return items.length > 0 ? { Command: items } : undefined
}

const importOrderFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  yaml: Array<{ Команда: string; ГруппаКоманд: string }> | undefined
): CommandInterfaceOrder | undefined => {
  if (yaml === undefined) return undefined

  const result = yaml.map((item) => ({
    command: item.Команда,
    commandGroup: commandGroupFromYAML(item.ГруппаКоманд),
  }))

  return result.length > 0 ? result : undefined
}

const exportOrderToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: CommandInterfaceOrder | undefined
): Array<{ Команда: string; ГруппаКоманд: string }> | undefined => {
  if (value === undefined) return undefined

  return value.map((item) => ({
    Команда: item.command,
    ГруппаКоманд: commandGroupToYAML(item.commandGroup),
  }))
}

const exportMetadataItemLinksToYAMLWithCommandGroups = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: string[] | undefined
): string[] | undefined => value?.map(commandGroupToYAML)

const importMetadataItemLinksFromYAMLWithCommandGroups = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: string[] | undefined
): string[] | undefined => value?.map(commandGroupFromYAML)

const importCommandGroupsFromXML = (
  _context: ConfigurationContextFromXML,
  rule: PropertyRule,
  xml: Record<string, string | string[]> | undefined
): string[] | undefined => {
  if (xml === undefined) return undefined

  const itemTag = rule.metadataItemLinksXMLItem ?? "Group"
  const rawItems = xml[itemTag]
  if (rawItems === undefined) return undefined
  return toArray(rawItems)
}

const exportCommandGroupsToXML: ExportToXMLFunctionNew = ({ rule, value }) => {
  if (value === undefined) return undefined
  const itemTag = rule.metadataItemLinksXMLItem ?? "Group"
  const groups = value as string[]
  return groups.length > 0 ? { [itemTag]: groups } : undefined
}

registerMetadataItemRule({
  propertyType: "RootCommandInterface",
  itemRule: RootCommandInterfaceRules,
})

registerTypeRule("CommandInterfaceVisibilityMap", "importFromXML", importVisibilityMapFromXML)
registerTypeRule("CommandInterfaceVisibilityMap", "exportToXML", exportVisibilityMapToXML)
registerTypeRule("CommandInterfaceVisibilityMap", "importFromYAML", importVisibilityMapFromYAML)
registerTypeRule("CommandInterfaceVisibilityMap", "exportToYAML", exportVisibilityMapToYAML)
registerTypeRule("CommandInterfaceVisibilityMap", "exportToJSONSchema", () => CommandInterfaceVisibilityMapJSONSchema)

registerTypeRule("CommandInterfacePlacementMap", "importFromXML", importPlacementMapFromXML)
registerTypeRule("CommandInterfacePlacementMap", "exportToXML", exportPlacementMapToXML)
registerTypeRule("CommandInterfacePlacementMap", "importFromYAML", importPlacementMapFromYAML)
registerTypeRule("CommandInterfacePlacementMap", "exportToYAML", exportPlacementMapToYAML)
registerTypeRule("CommandInterfacePlacementMap", "exportToJSONSchema", () => CommandInterfacePlacementMapJSONSchema)

registerTypeRule("CommandInterfaceOrder", "importFromXML", importOrderFromXML)
registerTypeRule("CommandInterfaceOrder", "exportToXML", exportOrderToXML)
registerTypeRule("CommandInterfaceOrder", "importFromYAML", importOrderFromYAML)
registerTypeRule("CommandInterfaceOrder", "exportToYAML", exportOrderToYAML)
registerTypeRule("CommandInterfaceOrder", "exportToJSONSchema", () => CommandInterfaceOrderJSONSchema)

registerTypeRule("CommandInterfaceCommandGroups", "importFromYAML", importMetadataItemLinksFromYAMLWithCommandGroups)
registerTypeRule("CommandInterfaceCommandGroups", "exportToYAML", exportMetadataItemLinksToYAMLWithCommandGroups)
registerTypeRule("CommandInterfaceCommandGroups", "importFromXML", importCommandGroupsFromXML)
registerTypeRule("CommandInterfaceCommandGroups", "exportToXML", exportCommandGroupsToXML)
registerTypeRule("CommandInterfaceCommandGroups", "exportToJSONSchema", () => Type.Array(Type.String()))
