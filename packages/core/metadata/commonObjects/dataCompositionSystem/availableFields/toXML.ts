import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import type { AvailableFields, AvailableFieldsXML } from "./types"

const exportAvailableFieldsToXML = (
  _context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  value: AvailableFields | undefined,
  _referenceMetadata?: AvailableFields | undefined
): AvailableFieldsXML | undefined => {
  if (!value || value.length === 0) return undefined

  const items = value.map((field) => ({ "dcsset:field": field }))
  return {
    "dcsset:item": items.length === 1 ? items[0] : items,
  }
}

registerTypeRule("AvailableFields", "exportToXML", exportAvailableFieldsToXML)
