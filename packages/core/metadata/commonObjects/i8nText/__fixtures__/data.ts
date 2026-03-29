import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { I8nText } from "../types"

export const typedI8nTextRule = {
  type: "I8nText",
  typedXML: true,
} as const satisfies PropertyRule

export const typedI8nTextValue: I8nText = { items: { ru: "Поле" } }
