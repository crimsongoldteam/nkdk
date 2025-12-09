export interface Catalog {
  autonumbering?: boolean
  auxiliaryChoiceForm?: string
  auxiliaryFolderChoiceForm?: string
  auxiliaryFolderForm?: string
  auxiliaryListForm?: string
  auxiliaryObjectForm?: string
  checkUnique?: boolean

  codeLength?: number

  comment?: string

  defaultChoiceForm?: string
  defaultFolderChoiceForm?: string
  defaultFolderForm?: string
  defaultListForm?: string
  defaultObjectForm?: string
  descriptionLength?: number

  executeAfterWriteDataHistoryVersionProcessing?: boolean
  explanation?: string
  extendedListPresentation?: string
  extendedObjectPresentation?: string
  foldersOnTop?: boolean
  hierarchical?: boolean
  includeHelpInContents?: boolean
  levelCount?: number
  limitLevelCount?: boolean
  listPresentation?: string
  name?: string
  objectPresentation?: string

  quickChoice?: boolean

  synonym?: string
  updateDataHistoryImmediatelyAfterWrite?: boolean
  useStandardCommands?: boolean
}
