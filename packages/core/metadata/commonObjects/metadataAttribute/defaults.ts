import { Context } from "../../context/types"
import { MetadataAttribute } from "./types"

const defaults = {
  passwordMode: false,
  markNegatives: false,
  multiLine: false,
  extendedEdit: false,
  fillFromFillingValue: false,
  fillChecking: "DontCheck",
  choiceFoldersAndItems: "Items",
  quickChoice: "Auto",
  createOnInput: "Auto",
  choiceHistoryOnInput: "Auto",
  use: "ForItem",
  indexing: "DontIndex",
  fullTextSearch: "Use",
  dataHistory: "Use",
} as const

export const getDefaults = (
  _data: MetadataAttribute,
  _context: Context
): Required<Pick<MetadataAttribute, keyof typeof defaults>> => {
  return defaults
}
