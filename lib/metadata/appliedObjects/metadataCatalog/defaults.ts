import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataCatalog } from "./types"

export function getDefaults(
  _data: MetadataCatalog,
  _configurationSettings: ConfigurationSettings
): Partial<MetadataCatalog> {
  return {
    hierarchical: false,
    hierarchyType: "HierarchyFoldersAndItems",
    limitLevelCount: false,
    levelCount: 2,
    foldersOnTop: true,
    useStandardCommands: true,
    subordinationUse: "ToItems",
    codeLength: 9,
    descriptionLength: 25,
    codeType: "String",
    codeAllowedLength: "Variable",
    codeSeries: "WholeCatalog",
    checkUnique: true,
    autonumbering: true,
    defaultPresentation: "AsDescription",
    predefinedDataUpdate: "Auto",
    editType: "InDialog",
    quickChoice: false,
    choiceMode: "BothWays",
    searchStringModeOnInputByString: "Begin",
    fullTextSearchOnInputByString: "DontUse",
    choiceDataGetModeOnInputByString: "Directly",
    includeHelpInContents: false,
    dataLockControlMode: "Managed",
    fullTextSearch: "Use",
    createOnInput: "Use",
    choiceHistoryOnInput: "Auto",
    dataHistory: "DontUse",
    updateDataHistoryImmediatelyAfterWrite: false,
    executeAfterWriteDataHistoryVersionProcessing: false,
  }
}
