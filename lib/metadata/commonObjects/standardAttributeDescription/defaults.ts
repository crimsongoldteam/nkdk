import { Context } from "../../context/types"
import { StandardAttributeDescription } from "./types"

export const getDefaults = (
  _data: StandardAttributeDescription,
  _configurationSettings: Context
): Partial<StandardAttributeDescription> => {
  return {
    fillChecking: "DontCheck",
    multiLine: false,
    fillFromFillingValue: false,
    createOnInput: "Auto",
    typeReductionMode: "TransformValues",
    extendedEdit: false,
    quickChoice: "Auto",
    choiceHistoryOnInput: "Auto",
    passwordMode: false,
    dataHistory: "Use",
    markNegatives: false,
    fullTextSearch: "Use",
  }
}
