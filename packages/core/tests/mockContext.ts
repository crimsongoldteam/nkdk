import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { Table } from "~/metadata/forms/elements/table/types"
import { ConfigurationContext } from "../metadata/context/types"

export const mockContext: ConfigurationContext = {
  defaultLanguage: "ru",
  testMode: true,
}
export const mockRule: PropertyRule<Table> = {
  yaml: "Шапка",
  type: "string",
}
