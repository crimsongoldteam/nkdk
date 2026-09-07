import { Type } from "typebox"
import { importBooleanFromYAML } from "../boolean/fromYAML"
import { exportBooleanToYAML } from "../boolean/toYAML"
import { buildMetadataTargetSchema, METADATA_NAME_PATTERN } from "../metadataTargets"
import { importMetadataItemLinkFromYAML } from "../metadataRef/fromYAML"
import { exportMetadataItemLinkToYAML } from "../metadataRef/toYAML"
import { ExportToXMLFunctionNew, defineMetadataItemRule, definePropertyTypeRule, type PropertyRule } from "../../ruleRuntime"
import type { ConfigurationContext, ConfigurationContextFromXML } from "@nkdk/runtime"
import { isXmlElementNode, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import { readRoleVisibilityXML } from "../roleVisibilityXML"
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

const toArray = <T>(value: T | T[] | undefined): T[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value]

const mapToYAML = <Map extends Record<string, string>>(map: Map, value: string | undefined): string | undefined =>
  value === undefined ? undefined : value in map ? map[value] : value

const mapFromYAML = <Map extends Record<string, string>>(map: Map, value: string | undefined): string | undefined =>
  value === undefined ? undefined : value in map ? map[value] : value

const importEnumFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: unknown
): string | undefined => (isXmlElementNode(xml) ? xmlTextValue(xml) : typeof xml === "string" ? xml : undefined)

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

const exportVisibilityToXML = (params: {
  value: HomePageWorkAreaVisibility | undefined
}): HomePageWorkAreaVisibilityXML | undefined => {
  const { value } = params
  if (value === undefined) return undefined

  const result: HomePageWorkAreaVisibilityXML = {}
  if (value.common !== undefined) result["xr:Common"] = value.common
  if (value.roles !== undefined) {
    const roles = Object.entries(value.roles).map(([roleName, roleVisibility]) => {
      return {
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

const importColumnItemsFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: HomePageWorkAreaColumnXML | XmlElementNode | undefined
): HomePageWorkAreaColumnItems | undefined => {
  if (xml === undefined) return undefined

  const result = (isXmlElementNode(xml) ? xmlElementChildren(xml, "Item") : toArray(xml.Item))
    .map((item) => {
      const columnItem: HomePageWorkAreaColumnItem = {}
      const form = isXmlElementNode(item) ? childText(item, "Form") : item.Form
      const height = isXmlElementNode(item) ? childText(item, "Height") : item.Height
      if (form !== undefined) columnItem.form = form
      if (height !== undefined) columnItem.height = Number(height)
      const visibility = readRoleVisibilityXML(
        isXmlElementNode(item) ? xmlElementChildren(item, "Visibility")[0] : item.Visibility)
      if (visibility !== undefined) columnItem.visibility = visibility
      return Object.keys(columnItem).length > 0 ? columnItem : undefined
    })
    .filter((item): item is HomePageWorkAreaColumnItem => item !== undefined)

  return result
}

function childText(node: XmlElementNode, name: string): string | undefined {
  const child = xmlElementChildren(node, name)[0]
  return child === undefined ? undefined : xmlTextValue(child)
}

const exportColumnItemsToXML: ExportToXMLFunctionNew = ({ value }) => {
  if (value === undefined) return undefined

  const items = (value as HomePageWorkAreaColumnItems).map((item) => {
    const itemXML: HomePageWorkAreaColumnItemXML = {}
    if (item.form !== undefined) itemXML.Form = item.form
    if (item.height !== undefined) itemXML.Height = item.height
    const visibilityXML = exportVisibilityToXML({
      value: item.visibility,
    })
    if (visibilityXML !== undefined) itemXML.Visibility = visibilityXML
    return itemXML
  })

  return items.length > 0 ? { Item: items } : {}
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

  return result
}

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "HomePageWorkArea",
  itemRule: HomePageWorkAreaRules,
})

export const metadataPropertyRule001 = definePropertyTypeRule("HomePageWorkAreaTemplate", "importFromXML", importEnumFromXML)
export const metadataPropertyRule002 = definePropertyTypeRule("HomePageWorkAreaTemplate", "exportToXML", exportEnumToXML)
export const metadataPropertyRule003 = definePropertyTypeRule("HomePageWorkAreaTemplate", "importFromYAML", importWorkingAreaTemplateFromYAML)
export const metadataPropertyRule004 = definePropertyTypeRule("HomePageWorkAreaTemplate", "exportToYAML", exportWorkingAreaTemplateToYAML)
export const metadataPropertyRule005 = definePropertyTypeRule("HomePageWorkAreaTemplate", "exportToJSONSchema", () => Type.String())

export const metadataPropertyRule006 = definePropertyTypeRule("HomePageWorkAreaCommandInterfaceDisplay", "importFromXML", importEnumFromXML)
export const metadataPropertyRule007 = definePropertyTypeRule("HomePageWorkAreaCommandInterfaceDisplay", "exportToXML", exportEnumToXML)
export const metadataPropertyRule008 = definePropertyTypeRule("HomePageWorkAreaCommandInterfaceDisplay", "importFromYAML", importCommandInterfaceDisplayFromYAML)
export const metadataPropertyRule009 = definePropertyTypeRule("HomePageWorkAreaCommandInterfaceDisplay", "exportToYAML", exportCommandInterfaceDisplayToYAML)
export const metadataPropertyRule010 = definePropertyTypeRule("HomePageWorkAreaCommandInterfaceDisplay", "exportToJSONSchema", () => Type.String())

export const metadataPropertyRule011 = definePropertyTypeRule("HomePageWorkAreaColumnItems", "importFromXML", importColumnItemsFromXML)
export const metadataPropertyRule012 = definePropertyTypeRule("HomePageWorkAreaColumnItems", "exportToXML", exportColumnItemsToXML)
export const metadataPropertyRule013 = definePropertyTypeRule("HomePageWorkAreaColumnItems", "importFromYAML", importColumnItemsFromYAML)
export const metadataPropertyRule014 = definePropertyTypeRule("HomePageWorkAreaColumnItems", "exportToYAML", exportColumnItemsToYAML)
export const metadataPropertyRule015 = definePropertyTypeRule("HomePageWorkAreaColumnItems", "exportToJSONSchema", () => homePageWorkAreaColumnItemsSchema)
export const metadataPropertyRule016 = definePropertyTypeRule("HomePageWorkAreaColumnItems", "xmlImportPropertyBehavior", {
  presenceAffectsExport: true,
  explicitEmptyValue: () => [],
})
