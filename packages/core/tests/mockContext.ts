import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../metadata/context/types"

export const mockContext: ConfigurationContext = {
  defaultLanguage: "ru",
  testMode: true,
}
export const mockRule: PropertyRule<BaseElement> = {
  yaml: "",
  type: "string",
}
