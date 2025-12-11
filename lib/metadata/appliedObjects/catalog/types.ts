import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZUserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"

export interface Catalog {
  elementType: ElementType
  name: string
  id?: string
  attributes?: Attributes
  autonumbering?: boolean
  auxiliaryChoiceForm?: string
  auxiliaryFolderChoiceForm?: string
  auxiliaryFolderForm?: string
  auxiliaryListForm?: string
  auxiliaryObjectForm?: string
  basedOn?: КоллекцияЗначенийСвойстваОбъектаМетаданных
  checkUnique?: boolean
  choiceDataGetModeOnInputByString?: SE.ChoiceDataGetModeOnInputByString
  choiceHistoryOnInput?: SE.ChoiceHistoryOnInput
  choiceMode?: SE.ChoiceMode
  codeAllowedLength?: SE.AllowedLength
  codeLength?: number
  codeSeries?: SE.CharacteristicKindCodesSeries
  codeType?: ТипКодаСправочника
  commands?: CommandList
  comment?: string
  createOnInput?: SE.CreateOnInput
  dataHistory?: SE.DataHistoryUse
  dataLockControlMode?: SE.DefaultDataLockControlMode
  dataLockFields?: FieldList
  defaultChoiceForm?: string
  defaultFolderChoiceForm?: string
  defaultFolderForm?: string
  defaultListForm?: string
  defaultObjectForm?: string
  defaultPresentation?: ОсновноеПредставлениеСправочника
  descriptionLength?: number
  editType?: SE.EditType
  executeAfterWriteDataHistoryVersionProcessing?: boolean
  explanation?: string
  extendedListPresentation?: string
  extendedObjectPresentation?: string
  foldersOnTop?: boolean
  fullTextSearch?: SE.UseFullTextSearch
  fullTextSearchOnInputByString?: SE.FullTextSearchOnInputByString
  hierarchical?: boolean
  hierarchyType?: SE.HierarchyType
  includeHelpInContents?: boolean
  inputByString?: FieldList
  levelCount?: number
  limitLevelCount?: boolean
  listPresentation?: string
  objectBelonging?: SE.ObjectBelonging
  objectPresentation?: I8nText
  owners?: КоллекцияЗначенийСвойстваОбъектаМетаданных
  predefined?: PredefinedList
  predefinedDataUpdate?: SE.PredefinedDataUpdate
  quickChoice?: boolean
  searchStringModeOnInputByString?: SE.SearchStringModeOnInputByString
  standardAttributes?: ОписанияСтандартныхРеквизитов
  subordinationUse?: SE.SubordinationUse
  synonym?: I8nText
  tabularSections?: КоллекцияОбъектовМетаданных
  updateDataHistoryImmediatelyAfterWrite?: boolean
  userVisible?: UserVisible
  useStandardCommands?: boolean
}

export const ZCatalogXML = z.object({
  _name: z.string(),
  _id: z.string(),
  Attributes: ZAttributesXML.optional(),
  Autonumbering: z.boolean().optional(),
  AuxiliaryChoiceForm: z.string().optional(),
  AuxiliaryFolderChoiceForm: z.string().optional(),
  AuxiliaryFolderForm: z.string().optional(),
  AuxiliaryListForm: z.string().optional(),
  AuxiliaryObjectForm: z.string().optional(),
  BasedOn: ZКоллекцияЗначенийСвойстваОбъектаМетаданныхXML.optional(),
  CheckUnique: z.boolean().optional(),
  ChoiceDataGetModeOnInputByString:
    SE.ZChoiceDataGetModeOnInputByString.optional(),
  ChoiceHistoryOnInput: SE.ZChoiceHistoryOnInput.optional(),
  ChoiceMode: SE.ZChoiceMode.optional(),
  CodeAllowedLength: SE.ZAllowedLength.optional(),
  CodeLength: z.number().optional(),
  CodeSeries: SE.ZCharacteristicKindCodesSeries.optional(),
  CodeType: ZТипКодаСправочникаXML.optional(),
  Commands: ZCommandListXML.optional(),
  Comment: z.string().optional(),
  CreateOnInput: SE.ZCreateOnInput.optional(),
  DataHistory: SE.ZDataHistoryUse.optional(),
  DataLockControlMode: SE.ZDefaultDataLockControlMode.optional(),
  DataLockFields: ZFieldListXML.optional(),
  DefaultChoiceForm: z.string().optional(),
  DefaultFolderChoiceForm: z.string().optional(),
  DefaultFolderForm: z.string().optional(),
  DefaultListForm: z.string().optional(),
  DefaultObjectForm: z.string().optional(),
  DefaultPresentation: ZОсновноеПредставлениеСправочникаXML.optional(),
  DescriptionLength: z.number().optional(),
  EditType: SE.ZEditType.optional(),
  ExecuteAfterWriteDataHistoryVersionProcessing: z.boolean().optional(),
  Explanation: z.string().optional(),
  ExtendedListPresentation: z.string().optional(),
  ExtendedObjectPresentation: z.string().optional(),
  FoldersOnTop: z.boolean().optional(),
  FullTextSearch: SE.ZUseFullTextSearch.optional(),
  FullTextSearchOnInputByString: SE.ZFullTextSearchOnInputByString.optional(),
  Hierarchical: z.boolean().optional(),
  HierarchyType: SE.ZHierarchyType.optional(),
  IncludeHelpInContents: z.boolean().optional(),
  InputByString: ZFieldListXML.optional(),
  LevelCount: z.number().optional(),
  LimitLevelCount: z.boolean().optional(),
  ListPresentation: z.string().optional(),
  ObjectBelonging: SE.ZObjectBelonging.optional(),
  ObjectPresentation: ZI8nTextXML.optional(),
  Owners: ZКоллекцияЗначенийСвойстваОбъектаМетаданныхXML.optional(),
  Predefined: ZPredefinedListXML.optional(),
  PredefinedDataUpdate: SE.ZPredefinedDataUpdate.optional(),
  QuickChoice: z.boolean().optional(),
  SearchStringModeOnInputByString:
    SE.ZSearchStringModeOnInputByString.optional(),
  StandardAttributes: ZОписанияСтандартныхРеквизитовXML.optional(),
  SubordinationUse: SE.ZSubordinationUse.optional(),
  Synonym: ZI8nTextXML.optional(),
  TabularSections: ZКоллекцияОбъектовМетаданныхXML.optional(),
  UpdateDataHistoryImmediatelyAfterWrite: z.boolean().optional(),
  UserVisible: ZUserVisibleXML.optional(),
  UseStandardCommands: z.boolean().optional(),
})

export type TCatalog = z.infer<typeof ZCatalog>

export type TCatalogXML = z.infer<typeof ZCatalogXML>
