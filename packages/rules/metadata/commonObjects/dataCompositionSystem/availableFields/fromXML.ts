import { isEmptyXmlElement, isXmlElementNode, xmlElementChildren, xmlTextValue, type XmlElementNode, type ConfigurationContextFromXML } from "@nkdk/runtime"
import { withConfigurationIndexYamlCollectionItemContext } from "@nkdk/runtime"
import { importI8nTextFromXML } from "../../i8nText/fromXML"
import { PropertyRule, definePropertyTypeRule } from "../../../ruleRuntime"
import type { AvailableFieldItem, AvailableFieldXML, AvailableFields, AvailableFieldsXML } from "./types"

const getFieldText = (field: AvailableFieldXML["dcsset:field"] | XmlElementNode | undefined): string | undefined => {
  if (isXmlElementNode(field)) return xmlTextValue(field) || undefined
  if (typeof field === "string") return field
  if (field && typeof field === "object" && "#text" in field) {
    const text = field["#text"]
    return typeof text === "string" ? text : undefined
  }
  return undefined
}

const optionalChild = (node: XmlElementNode, name: string): XmlElementNode | undefined => {
  const child = xmlElementChildren(node, name)[0]
  return child !== undefined && !isEmptyXmlElement(child) ? child : undefined
}

const importBoolean = (value: boolean | string | undefined): boolean | undefined => {
  if (value === undefined) return undefined
  if (typeof value === "boolean") return value
  return value === "true"
}

const importAvailableFieldsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: AvailableFieldsXML | XmlElementNode | undefined
): AvailableFields | undefined => {
  if (!xml) return undefined

  const items = isXmlElementNode(xml) ? xmlElementChildren(xml, "dcsset:item") : xml["dcsset:item"]
  if (!items) return undefined

  const fieldItems = Array.isArray(items) ? items : [items]
  if (fieldItems.length === 1 && isXmlElementNode(fieldItems[0]) && isEmptyXmlElement(fieldItems[0])) return undefined
  const fields = fieldItems
    .map((item, index): AvailableFieldItem | undefined => {
      const itemContext = withConfigurationIndexYamlCollectionItemContext(context, { index, yamlAsArray: true })
      const node = isXmlElementNode(item) ? item : undefined
      if (node !== undefined && isEmptyXmlElement(node)) throw new TypeError("Пустой элемент списка доступных полей")
      const field = getFieldText(isXmlElementNode(item) ? optionalChild(item, "dcsset:field") : item["dcsset:field"])
      if (!field) return undefined
      const use = isXmlElementNode(item) ? optionalChild(item, "dcsset:use") : item["dcsset:use"]
      const title = isXmlElementNode(item) ? optionalChild(item, "dcsset:title") : item["dcsset:title"]
      const lwsTitle = isXmlElementNode(item) ? optionalChild(item, "dcsset:lwsTitle") : item["dcsset:lwsTitle"]
      const viewMode = isXmlElementNode(item) ? optionalChild(item, "dcsset:viewMode") : item["dcsset:viewMode"]
      if (use === undefined && title === undefined && lwsTitle === undefined && viewMode === undefined) return field

      return {
        field,
        ...(use !== undefined ? { use: importBoolean(isXmlElementNode(use) ? xmlTextValue(use) : use) } : {}),
        ...(title !== undefined
          ? { title: importI8nTextFromXML(itemContext, { type: "I8nText" }, title) }
          : {}),
        ...(lwsTitle !== undefined
          ? { lwsTitle: importI8nTextFromXML(itemContext, { type: "I8nText" }, lwsTitle) }
          : {}),
        ...(viewMode !== undefined ? { viewMode: isXmlElementNode(viewMode) ? xmlTextValue(viewMode) as AvailableFieldXML["dcsset:viewMode"] : viewMode } : {}),
      }
    })
    .filter((field): field is AvailableFieldItem => field !== undefined)

  return fields.length > 0 ? fields : undefined
}

export const metadataPropertyRule000 = definePropertyTypeRule("AvailableFields", "importFromXML", importAvailableFieldsFromXML)
