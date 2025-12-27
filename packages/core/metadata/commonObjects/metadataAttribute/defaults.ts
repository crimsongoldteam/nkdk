import { Context } from "../../context/types"
import { MetadataAttribute } from "./types"

export function getDefaults(_data: MetadataAttribute, _context: Context): Partial<MetadataAttribute> {
  return {
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
  }
}
