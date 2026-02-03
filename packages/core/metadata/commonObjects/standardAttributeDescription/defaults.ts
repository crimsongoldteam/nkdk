import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { StandardAttributeDescription } from "./types"

const defaults = {
  choiceHistoryOnInput: "Auto",
  createOnInput: "Auto",
  dataHistory: "Use",
  extendedEdit: false,
  fillChecking: "DontCheck",
  fillFromFillingValue: false,
  fullTextSearch: "Use",
  markNegatives: false,
  multiLine: false,
  passwordMode: false,
  quickChoice: "Auto",
  typeReductionMode: "TransformValues",
} as const

export const getDefaults = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  _data: StandardAttributeDescription
): Required<Pick<StandardAttributeDescription, keyof typeof defaults>> => {
  return defaults
}
