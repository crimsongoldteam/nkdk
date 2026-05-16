import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/toXML"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import type { AvailableFieldItem, AvailableFieldXML, AvailableFields, AvailableFieldsXML } from "./types"

const exportItem = (
  context: ConfigurationContextWithExportToXML,
  item: AvailableFieldItem
): AvailableFieldXML => {
  if (typeof item === "string") return { "dcsset:field": item }

  return {
    "dcsset:field": item.field,
    ...(item.use !== undefined ? { "dcsset:use": item.use } : {}),
    ...(item.title !== undefined
      ? { "dcsset:title": exportI8nTextToXML(context, { type: "I8nText" }, item.title) }
      : {}),
    ...(item.lwsTitle !== undefined
      ? { "dcsset:lwsTitle": exportI8nTextToXML(context, { type: "I8nText" }, item.lwsTitle) }
      : {}),
    ...(item.viewMode !== undefined ? { "dcsset:viewMode": item.viewMode } : {}),
  }
}

const exportAvailableFieldsToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  value: AvailableFields | undefined,
  _referenceMetadata?: AvailableFields | undefined
): AvailableFieldsXML | undefined => {
  if (!value || value.length === 0) return undefined

  const items = value.map((item) => exportItem(context, item))
  return {
    "dcsset:item": items.length === 1 ? items[0] : items,
  }
}

registerTypeRule("AvailableFields", "exportToXML", exportAvailableFieldsToXML)
