import { ConfigurationContext } from "../../context/types"
import { MetadataDocument } from "./types"

const defaults = {
  actionsWritingOnPost: "WriteModified",
  autonumbering: true,
  checkUnique: false,
  choiceDataGetModeOnInputByString: "Directly",
  choiceHistoryOnInput: "Auto",
  createOnInput: "Use",
  dataHistory: "DontUse",
  dataLockControlMode: "Managed",
  executeAfterWriteDataHistoryVersionProcessing: false,
  fullTextSearch: "Use",
  fullTextSearchOnInputByString: "DontUse",
  includeHelpInContents: false,
  numberAllowedLength: "Variable",
  numberLength: 11,
  numberPeriodicity: "Year",
  numberType: "String",
  posting: "Deny",
  privilegedPostingMode: false,
  privilegedUnpostingMode: false,
  realTimePosting: "Deny",
  registerRecordsDeletion: "AutoDelete",
  searchStringModeOnInputByString: "Begin",
  sequenceFilling: "AutoFill",
  updateDataHistoryImmediatelyAfterWrite: false,
  useStandardCommands: true,
} as const

export const getDefaults = (
  _data: MetadataDocument,
  _context: ConfigurationContext
): Required<Pick<MetadataDocument, keyof typeof defaults>> => {
  return defaults
}
