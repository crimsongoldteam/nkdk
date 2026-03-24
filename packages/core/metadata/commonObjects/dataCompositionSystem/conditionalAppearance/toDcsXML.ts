import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/toXML"
import type { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertyToXML } from "~/metadata/orchestration"
import type { AppearanceFields } from "../appearanceFields/types"
import { exportFilterToDcsXML } from "../filter/toDcsXML"
import type { Filter } from "../filter/types"
import type { ConditionalAppearanceItem } from "./types"

type SelectionItemXML = { "dcsset:field": string }

type SelectionXML = {
  "dcsset:item"?: SelectionItemXML | SelectionItemXML[]
}

/** См. importSelectionFromDcsXML — выгрузка списка полей в dcsset:selection. */
const exportSelectionToDcsXML = (fields: AppearanceFields | undefined): SelectionXML | undefined => {
  if (!fields) return undefined
  const fieldNames = (fields as unknown as { _fieldNames?: string[] })._fieldNames
  if (!fieldNames || fieldNames.length === 0) return undefined
  const items: SelectionItemXML[] = fieldNames.map((name) => ({ "dcsset:field": name }))
  return { "dcsset:item": items.length === 1 ? items[0] : items }
}

export const exportConditionalAppearanceToDcsXML = (
  context: ConfigurationContext,
  items: ConditionalAppearanceItem[]
): Record<string, unknown> => {
  const xmlItems = items.map((item) => {
    const selection = exportSelectionToDcsXML(item.fields)
    const filter = exportFilterToDcsXML(context, item.filter as Filter | undefined)
    const appearance =
      item.appearance !== undefined
        ? (exportPropertyToXML({
            context,
            rule: { type: "Appearance" },
            value: item.appearance,
          }) as Record<string, unknown> | undefined)
        : undefined
    const presentation =
      item.presentation !== undefined ? exportI8nTextToXML(context, { type: "I8nText" }, item.presentation) : undefined
    const userSettingPresentation =
      item.userSettingPresentation !== undefined
        ? exportI8nTextToXML(context, { type: "I8nText" }, item.userSettingPresentation)
        : undefined

    return {
      ...(item.use !== undefined ? { "dcsset:use": item.use } : {}),
      ...(selection !== undefined ? { "dcsset:selection": selection } : {}),
      ...(filter !== undefined ? { "dcsset:filter": filter } : {}),
      ...(appearance !== undefined ? { "dcsset:appearance": appearance } : {}),
      ...(presentation !== undefined ? { "dcsset:presentation": presentation } : {}),
      ...(item.viewMode !== undefined ? { "dcsset:viewMode": item.viewMode } : {}),
      ...(item.userSettingID ? { "dcsset:userSettingID": item.userSettingID } : {}),
      ...(userSettingPresentation !== undefined ? { "dcsset:userSettingPresentation": userSettingPresentation } : {}),
      ...(item.useInGroup !== undefined ? { "dcsset:useInGroup": item.useInGroup } : {}),
      ...(item.useInHierarchicalGroup !== undefined
        ? { "dcsset:useInHierarchicalGroup": item.useInHierarchicalGroup }
        : {}),
      ...(item.useInOverall !== undefined ? { "dcsset:useInOverall": item.useInOverall } : {}),
      ...(item.useInFieldsHeader !== undefined ? { "dcsset:useInFieldsHeader": item.useInFieldsHeader } : {}),
      ...(item.useInHeader !== undefined ? { "dcsset:useInHeader": item.useInHeader } : {}),
      ...(item.useInParameters !== undefined ? { "dcsset:useInParameters": item.useInParameters } : {}),
      ...(item.useInFilter !== undefined ? { "dcsset:useInFilter": item.useInFilter } : {}),
      ...(item.useInResourceFieldsHeader !== undefined
        ? { "dcsset:useInResourceFieldsHeader": item.useInResourceFieldsHeader }
        : {}),
      ...(item.useInOverallHeader !== undefined ? { "dcsset:useInOverallHeader": item.useInOverallHeader } : {}),
      ...(item.useInOverallResourceFieldsHeader !== undefined
        ? { "dcsset:useInOverallResourceFieldsHeader": item.useInOverallResourceFieldsHeader }
        : {}),
    }
  })

  if (xmlItems.length === 0) return {}
  return { "dcsset:item": xmlItems.length === 1 ? xmlItems[0] : xmlItems }
}
