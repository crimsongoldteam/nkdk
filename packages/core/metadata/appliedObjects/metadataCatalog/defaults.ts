import { Context } from "../../context/types"
import { MetadataCatalog } from "./types"

const defaults = {
  autonumbering: true,
  checkUnique: true,
  choiceDataGetModeOnInputByString: "Directly",
  choiceHistoryOnInput: "Auto",
  choiceMode: "BothWays",
  codeAllowedLength: "Variable",
  codeLength: 9,
  codeSeries: "WholeCatalog",
  codeType: "String",
  createOnInput: "Use",
  dataHistory: "DontUse",
  dataLockControlMode: "Managed",
  defaultPresentation: "AsDescription",
  descriptionLength: 25,
  editType: "InDialog",
  executeAfterWriteDataHistoryVersionProcessing: false,
  foldersOnTop: true,
  fullTextSearch: "Use",
  fullTextSearchOnInputByString: "DontUse",
  hierarchical: false,
  hierarchyType: "HierarchyFoldersAndItems",
  includeHelpInContents: false,
  levelCount: 2,
  limitLevelCount: false,
  predefinedDataUpdate: "Auto",
  quickChoice: false,
  searchStringModeOnInputByString: "Begin",
  subordinationUse: "ToItems",
  updateDataHistoryImmediatelyAfterWrite: false,
  useStandardCommands: true,
} as const

export const getDefaults = (
  _data: MetadataCatalog,
  _context: Context
): Required<Pick<MetadataCatalog, keyof typeof defaults>> => {
  return defaults
}
