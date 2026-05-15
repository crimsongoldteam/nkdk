import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/fromXML"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import type { AvailableFieldItem, AvailableFieldXML, AvailableFields, AvailableFieldsXML } from "./types"

const getFieldText = (field: AvailableFieldXML["dcsset:field"]): string | undefined => {
  if (typeof field === "string") return field
  if (field && typeof field === "object" && "#text" in field) {
    const text = field["#text"]
    return typeof text === "string" ? text : undefined
  }
  return undefined
}

const hasMetadata = (item: AvailableFieldXML): boolean =>
  item["dcsset:use"] !== undefined ||
  item["dcsset:title"] !== undefined ||
  item["dcsset:lwsTitle"] !== undefined ||
  item["dcsset:viewMode"] !== undefined

const importBoolean = (value: boolean | string | undefined): boolean | undefined => {
  if (value === undefined) return undefined
  if (typeof value === "boolean") return value
  return value === "true"
}

const importAvailableFieldsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: AvailableFieldsXML | undefined
): AvailableFields | undefined => {
  if (!xml) return undefined

  const items = xml["dcsset:item"]
  if (!items) return undefined

  const fieldItems = Array.isArray(items) ? items : [items]
  const fields = fieldItems
    .map((item): AvailableFieldItem | undefined => {
      const field = getFieldText(item["dcsset:field"])
      if (!field) return undefined
      if (!hasMetadata(item)) return field

      return {
        field,
        ...(item["dcsset:use"] !== undefined ? { use: importBoolean(item["dcsset:use"]) } : {}),
        ...(item["dcsset:title"] !== undefined
          ? { title: importI8nTextFromXML(context, { type: "I8nText" }, item["dcsset:title"]) }
          : {}),
        ...(item["dcsset:lwsTitle"] !== undefined
          ? { lwsTitle: importI8nTextFromXML(context, { type: "I8nText" }, item["dcsset:lwsTitle"]) }
          : {}),
        ...(item["dcsset:viewMode"] !== undefined ? { viewMode: item["dcsset:viewMode"] } : {}),
      }
    })
    .filter((field): field is AvailableFieldItem => field !== undefined)

  return fields.length > 0 ? fields : undefined
}

registerTypeRule("AvailableFields", "importFromXML", importAvailableFieldsFromXML)
