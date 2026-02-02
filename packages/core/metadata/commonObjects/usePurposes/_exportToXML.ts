import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { MetadataSimpleValueXML } from "../metadataValue/types"
import { UsePurposes, UsePurposesXML } from "./types"

export const _exportUsePurposesToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  data: UsePurposes | undefined
): UsePurposesXML | undefined => {
  if (!data || data.length === 0) return undefined

  const values: MetadataSimpleValueXML[] = data.map((value) => ({
    "_xsi:type": "app:ApplicationUsePurpose",
    "#text": value,
  }))

  return {
    "v8:Value": values.length === 1 ? values[0] : values,
  }
}
