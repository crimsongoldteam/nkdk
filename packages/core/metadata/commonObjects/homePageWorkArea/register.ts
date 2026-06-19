import { Type } from "@sinclair/typebox"
import { importBooleanFromXML } from "~/metadata/commonObjects/boolean/fromXML"
import { importBooleanFromYAML } from "~/metadata/commonObjects/boolean/fromYAML"
import { exportBooleanToYAML } from "~/metadata/commonObjects/boolean/toYAML"
import { buildMetadataTargetSchema, METADATA_NAME_PATTERN } from "~/metadata/commonObjects/metadataTargets"
import { importMetadataItemLinkFromYAML } from "~/metadata/commonObjects/metadataRef/fromYAML"
import { exportMetadataItemLinkToYAML } from "~/metadata/commonObjects/metadataRef/toYAML"
import {
  ExportToXMLFunctionNew,
  registerMetadataItemRule,
  registerTypeRule,
  type PropertyRule,
} from "~/metadata/orchestration"
import type { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { HomePageWorkAreaRules } from "./rules"
import {
  HomePageWorkAreaColumnItem,
  HomePageWorkAreaColumnItemXML,
  HomePageWorkAreaColumnItems,
  HomePageWorkAreaColumnItemsYAML,
  HomePageWorkAreaColumnXML,
  HomePageWorkAreaVisibility,
  HomePageWorkAreaVisibilityYAML,
  HomePageWorkAreaVisibilityXML,
} from "./types"

const workingAreaTemplateToYAML = {
  OneColumn: "ОднаКолонка",
  TwoColumnsEqualWidth: "ДвеКолонкиРавнойШирины",
  TwoColumnsVariableWidth: "ДвеКолонкиПеременнойШирины",
} as const

const workingAreaTemplateFromYAML = {
  ОднаКолонка: "OneColumn",
  ДвеКолонкиРавнойШирины: "TwoColumnsEqualWidth",
  ДвеКолонкиПеременнойШирины: "TwoColumnsVariableWidth",
} as const

const maCommandInterfaceDisplaysToYAML = {
  Top: "Верх",
  Bottom: "Низ",
  None: "Нет",
} as const

const maCommandInterfaceDisplaysFromYAML = {
  Верх: "Top",
  Низ: "Bottom",
  Нет: "None",
} as const

const stringboolYAMLSchema = Type.Union([Type.Literal("Истина"), Type.Literal("Ложь")])
const homePageWorkAreaVisibilitySchema = Type.Object(
  {
    Общее: Type.Optional(stringboolYAMLSchema),
    Роли: Type.Optional(Type.Record(Type.String(), stringboolYAMLSchema)),
  },
  { additionalProperties: false }
)
const homePageWorkAreaColumnItemSchema = Type.Object(
  {
    Форма: Type.Optional(
      Type.Union([
        Type.String({ pattern: `^(?:ОбщаяФорма|CommonForm)\\.${METADATA_NAME_PATTERN}$` }),
        buildMetadataTargetSchema({
          kind: "member",
          owner: "explicit",
          memberKinds: ["Form"],
        }),
      ])
    ),
    Высота: Type.Optional(Type.Number()),
    Видимость: Type.Optional(homePageWorkAreaVisibilitySchema),
  },
  { additionalProperties: false }
)
const homePageWorkAreaColumnItemsSchema = Type.Array(homePageWorkAreaColumnItemSchema)

const roleNameRule = {
  type: "MetadataItemLink",
  metadataTarget: { kind: "object", roots: ["Role"] },
} as const satisfies PropertyRule
const XML_REFERENCE_RAW = "__xmlReferenceRaw"

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
  if (!isRecord(referenceMetadata)) return undefined
  const raw = referenceMetadata[XML_REFERENCE_RAW]
  return isRecord(raw) ? raw : undefined
}

const getXMLName = (value: { _name?: string; name?: string } | undefined): string | undefined =>
  value?._name ?? value?.name

const mapToYAML = <Map extends Record<string, string>>(map: Map, value: string | undefined): string | undefined =>
  value === undefined ? undefined : value in map ? map[value] : value

const mapFromYAML = <Map extends Record<string, string>>(map: Map, value: string | undefined): string | undefined =>
  value === undefined ? undefined : value in map ? map[value] : value

const importEnumFromXML = (_context: ConfigurationContextFromXML, _rule: PropertyRule, xml: unknown): string | undefined =>
  typeof xml === "string" ? xml : undefined

const exportEnumToXML: ExportToXMLFunctionNew = ({ value }) => (typeof value === "string" ? value : undefined)

const importWorkingAreaTemplateFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: string | undefined
): string | undefined => mapFromYAML(workingAreaTemplateFromYAML, value)

const exportWorkingAreaTemplateToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: string | undefined
): string | undefined => mapToYAML(workingAreaTemplateToYAML, value)

const importCommandInterfaceDisplayFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: string | undefined
): string | undefined => mapFromYAML(maCommandInterfaceDisplaysFromYAML, value)

const exportCommandInterfaceDisplayToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: string | undefined
): string | undefined => mapToYAML(maCommandInterfaceDisplaysToYAML, value)

const importVisibilityFromXML = (
  context: ConfigurationContextFromXML,
  xml: HomePageWorkAreaVisibilityXML | undefined
): HomePageWorkAreaVisibility | undefined => {
  if (xml === undefined) return undefined

  const result: HomePageWorkAreaVisibility = {}
  const common = importBooleanFromXML(context, undefined, xml["xr:Common"])
  if (common !== undefined) result.common = common

  const roles: Record<string, boolean> = {}
  for (const role of toArray(xml["xr:Value"])) {
    const roleName = getXMLName(role)
    const value = importBooleanFromXML(context, undefined, role["#text"])
    if (roleName !== undefined && value !== undefined) roles[roleName] = value
  }
  if (Object.keys(roles).length > 0) result.roles = roles

  defineReferenceRawXML({ context, target: result, xml })
  return Object.keys(result).length > 0 ? result : undefined
}

const exportVisibilityToXML = (params: {
  context: ConfigurationContext
  value: HomePageWorkAreaVisibility | undefined
  referenceMetadata: unknown
}): HomePageWorkAreaVisibilityXML | undefined => {
  const { value, referenceMetadata } = params
  if (value === undefined) return undefined

  const reference = getReferenceRawXML(referenceMetadata) ?? (isRecord(referenceMetadata) ? referenceMetadata : undefined)
  const result = copyUnknownXMLKeys(reference, ["xr:Common", "xr:Value"]) as HomePageWorkAreaVisibilityXML
  if (value.common !== undefined) result["xr:Common"] = value.common
  if (value.roles !== undefined) {
    const referenceRoles = toArray(reference?.["xr:Value"]).filter(isRecord)
    const roles = Object.entries(value.roles).map(([roleName, roleVisibility]) => {
      const referenceRole = referenceRoles.find((role) => getXMLName(role) === roleName)
      return {
        ...copyUnknownXMLKeys(referenceRole, ["_name", "name"]),
        _name: roleName,
        "#text": roleVisibility,
      }
    })
    if (roles.length > 0) result["xr:Value"] = roles
  }

  return Object.keys(result).length > 0 ? result : undefined
}

const importVisibilityFromYAML = (
  context: ConfigurationContext,
  yaml: HomePageWorkAreaVisibilityYAML | undefined,
  source: HomePageWorkAreaVisibility | undefined
): HomePageWorkAreaVisibility | undefined => {
  if (yaml === undefined) return source

  const result: HomePageWorkAreaVisibility = {}
  const common = importBooleanFromYAML(context, undefined, yaml.Общее)
  if (common !== undefined) result.common = common
  if (yaml.Роли !== undefined) {
    const roles: Record<string, boolean> = {}
    for (const [roleName, roleVisibility] of Object.entries(yaml.Роли)) {
      const importedRoleName = importMetadataItemLinkFromYAML(context, roleNameRule, roleName)
      const importedValue = importBooleanFromYAML(context, undefined, roleVisibility)
      if (importedRoleName !== undefined && importedValue !== undefined) roles[importedRoleName] = importedValue
    }
    if (Object.keys(roles).length > 0) result.roles = roles
  }

  return Object.keys(result).length > 0 ? result : undefined
}

const exportVisibilityToYAML = (
  context: ConfigurationContext,
  value: HomePageWorkAreaVisibility | undefined
): HomePageWorkAreaVisibilityYAML | undefined => {
  if (value === undefined) return undefined

  const result: HomePageWorkAreaVisibilityYAML = {}
  const common = exportBooleanToYAML(context, undefined, value.common)
  if (common !== undefined) result.Общее = common
  if (value.roles !== undefined) {
    const roles: NonNullable<HomePageWorkAreaVisibilityYAML["Роли"]> = {}
    for (const [roleName, roleVisibility] of Object.entries(value.roles)) {
      const exportedRoleName = exportMetadataItemLinkToYAML(context, roleNameRule, roleName)
      const exportedValue = exportBooleanToYAML(context, undefined, roleVisibility)
      if (exportedRoleName !== undefined && exportedValue !== undefined) roles[exportedRoleName] = exportedValue
    }
    if (Object.keys(roles).length > 0) result.Роли = roles
  }

  return Object.keys(result).length > 0 ? result : undefined
}

const findReferenceItemByForm = (
  referenceMetadata: unknown,
  form: string | undefined
): Record<string, unknown> | undefined => {
  if (form === undefined) return undefined
  const raw = getReferenceRawXML(referenceMetadata) ?? referenceMetadata
  if (Array.isArray(raw)) {
    return raw.map(getReferenceRawXML).find((item) => item?.Form === form)
  }
  const referenceItems = isRecord(raw) ? toArray(raw.Item).filter(isRecord) : []
  return referenceItems.find((item) => item.Form === form)
}

const importColumnItemsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: HomePageWorkAreaColumnXML | undefined
): HomePageWorkAreaColumnItems | undefined => {
  if (xml === undefined) return undefined

  const result = toArray(xml.Item)
    .map((item) => {
      const columnItem: HomePageWorkAreaColumnItem = {}
      if (item.Form !== undefined) columnItem.form = item.Form
      if (item.Height !== undefined) columnItem.height = Number(item.Height)
      const visibility = importVisibilityFromXML(context, item.Visibility)
      if (visibility !== undefined) columnItem.visibility = visibility
      defineReferenceRawXML({ context, target: columnItem, xml: item })
      return Object.keys(columnItem).length > 0 ? columnItem : undefined
    })
    .filter((item): item is HomePageWorkAreaColumnItem => item !== undefined)

  defineReferenceRawXML({ context, target: result, xml })
  return result.length > 0 ? result : undefined
}

const exportColumnItemsToXML: ExportToXMLFunctionNew = ({ context, value, referenceMetadata }) => {
  if (value === undefined) return undefined

  const items = (value as HomePageWorkAreaColumnItems).map((item) => {
    const referenceItem = findReferenceItemByForm(referenceMetadata, item.form)
    const itemXML = copyUnknownXMLKeys(referenceItem, ["Form", "Height", "Visibility"]) as HomePageWorkAreaColumnItemXML
    if (item.form !== undefined) itemXML.Form = item.form
    if (item.height !== undefined) itemXML.Height = item.height
    const visibilityReference = item.visibility === undefined ? undefined : referenceItem?.Visibility
    const visibilityXML = exportVisibilityToXML({
      context,
      value: item.visibility,
      referenceMetadata: visibilityReference,
    })
    if (visibilityXML !== undefined) itemXML.Visibility = visibilityXML
    return itemXML
  })

  return items.length > 0 ? { Item: items } : undefined
}

const importColumnItemsFromYAML = (params: {
  context: ConfigurationContext
  value: HomePageWorkAreaColumnItemsYAML | undefined
  source?: HomePageWorkAreaColumnItems
}): HomePageWorkAreaColumnItems | undefined => {
  const { context, value, source } = params
  if (value === undefined) return source

  const result = value.map((item, index) => {
    const sourceItem = source?.[index]
    const columnItem: HomePageWorkAreaColumnItem = {}
    if (item.Форма !== undefined) columnItem.form = item.Форма
    if (item.Высота !== undefined) columnItem.height = item.Высота
    const visibility = importVisibilityFromYAML(context, item.Видимость, sourceItem?.visibility)
    if (visibility !== undefined) columnItem.visibility = visibility
    return Object.keys(columnItem).length > 0 ? columnItem : sourceItem
  })

  return result.filter((item): item is HomePageWorkAreaColumnItem => item !== undefined)
}

const exportColumnItemsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  value: HomePageWorkAreaColumnItems | undefined
): HomePageWorkAreaColumnItemsYAML | undefined => {
  if (value === undefined) return undefined

  const result = value.map((item) => {
    const yaml: HomePageWorkAreaColumnItemsYAML[number] = {}
    if (item.form !== undefined) yaml.Форма = item.form
    if (item.height !== undefined) yaml.Высота = item.height
    const visibility = exportVisibilityToYAML(context, item.visibility)
    if (visibility !== undefined) yaml.Видимость = visibility
    return yaml
  })

  return result.length > 0 ? result : undefined
}

registerMetadataItemRule({
  propertyType: "HomePageWorkArea",
  itemRule: HomePageWorkAreaRules,
})

registerTypeRule("HomePageWorkAreaTemplate", "importFromXML", importEnumFromXML)
registerTypeRule("HomePageWorkAreaTemplate", "exportToXML", exportEnumToXML)
registerTypeRule("HomePageWorkAreaTemplate", "importFromYAML", importWorkingAreaTemplateFromYAML)
registerTypeRule("HomePageWorkAreaTemplate", "exportToYAML", exportWorkingAreaTemplateToYAML)
registerTypeRule("HomePageWorkAreaTemplate", "exportToJSONSchema", () => Type.String())

registerTypeRule("HomePageWorkAreaCommandInterfaceDisplay", "importFromXML", importEnumFromXML)
registerTypeRule("HomePageWorkAreaCommandInterfaceDisplay", "exportToXML", exportEnumToXML)
registerTypeRule("HomePageWorkAreaCommandInterfaceDisplay", "importFromYAML", importCommandInterfaceDisplayFromYAML)
registerTypeRule("HomePageWorkAreaCommandInterfaceDisplay", "exportToYAML", exportCommandInterfaceDisplayToYAML)
registerTypeRule("HomePageWorkAreaCommandInterfaceDisplay", "exportToJSONSchema", () => Type.String())

registerTypeRule("HomePageWorkAreaColumnItems", "importFromXML", importColumnItemsFromXML)
registerTypeRule("HomePageWorkAreaColumnItems", "exportToXML", exportColumnItemsToXML)
registerTypeRule("HomePageWorkAreaColumnItems", "importFromYAML", importColumnItemsFromYAML)
registerTypeRule("HomePageWorkAreaColumnItems", "exportToYAML", exportColumnItemsToYAML)
registerTypeRule("HomePageWorkAreaColumnItems", "exportToJSONSchema", () => homePageWorkAreaColumnItemsSchema)
