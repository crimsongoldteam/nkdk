import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import type { AvailableFields, AvailableFieldsXML } from "./types"

const importAvailableFieldsFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: AvailableFieldsXML | undefined
): AvailableFields | undefined => {
  if (!xml) return undefined

  const items = xml["dcsset:item"]
  if (!items) return undefined

  const fieldItems = Array.isArray(items) ? items : [items]
  const fields = fieldItems
    .map((item) => item?.["dcsset:field"])
    .filter((field): field is string => Boolean(field))

  return fields.length > 0 ? fields : undefined
}

registerTypeRule("AvailableFields", "importFromXML", importAvailableFieldsFromXML)
