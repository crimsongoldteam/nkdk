import { Context } from "../../context/types"
import { MetadataAttribute } from "./types"

const defaultsAttribute = {
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

const defaultsTabularSectionAttribute = {
  passwordMode: false,
  markNegatives: false,
  multiLine: false,
  extendedEdit: false,
  fillChecking: "DontCheck",
  choiceFoldersAndItems: "Items",
  quickChoice: "Auto",
  createOnInput: "Auto",
  choiceHistoryOnInput: "Auto",
  indexing: "DontIndex",
  fullTextSearch: "Use",
  dataHistory: "Use",
} as const

export const getDefaultsAttribute = (
  _context: Context,
  _data: MetadataAttribute
): Required<Pick<MetadataAttribute, keyof typeof defaultsAttribute>> => {
  return defaultsAttribute
}

export const getDefaultsTabularSectionAttribute = (
  _context: Context,
  _data: MetadataAttribute
): Required<Pick<MetadataAttribute, keyof typeof defaultsTabularSectionAttribute>> => {
  return defaultsTabularSectionAttribute
}
