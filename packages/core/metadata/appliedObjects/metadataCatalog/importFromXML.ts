import { MetadataCatalog, MetadataCatalogXML } from "~/metadata/appliedObjects/metadataCatalog/types"
import { importMetadataCommandsFromXML } from "~/metadata/appliedObjects/metadataCommand/importFromXML"
import { importCharacteristicsDescriptionsFromXML } from "~/metadata/commonObjects/characteristicsDescription/importFromXML"
import { importMetadataFieldsFromXML } from "~/metadata/commonObjects/metadataField/importFromXML"
import { importMetadataTabularSectionsFromXML } from "~/metadata/commonObjects/metadataTabularSection/importFromXML"
import { importMetadataValueCollectionFromXML } from "~/metadata/commonObjects/metadataValueCollection/importFromXML"
import { importStandardAttributeDescriptionsFromXML } from "~/metadata/commonObjects/standardAttributeDescription/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { importBooleanFromXML } from "../../commonObjects/boolean/importFromXML"
import { importMetadataAttributesFromXML } from "../../commonObjects/metadataAttribute/importFromXML"
import { removeDefaults } from "../../helpers/compactObject"
import { getDefaults } from "./defaults"

export const importMetadataCatalogFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: MetadataCatalogXML
): MetadataCatalog | undefined => {
  const props = xml.Catalog.Properties

  const result: MetadataCatalog = {
    name: props.Name,
  }

  const childObjects = xml.Catalog.ChildObjects

  if (childObjects?.Attribute)
    result.attributes = importMetadataAttributesFromXML(context, undefined, childObjects.Attribute)

  const autonumbering = importBooleanFromXML(context, undefined, props.Autonumbering)
  if (autonumbering !== undefined) result.autonumbering = autonumbering

  if (props.AuxiliaryChoiceForm !== undefined) result.auxiliaryChoiceForm = props.AuxiliaryChoiceForm
  if (props.AuxiliaryFolderChoiceForm !== undefined) result.auxiliaryFolderChoiceForm = props.AuxiliaryFolderChoiceForm
  if (props.AuxiliaryFolderForm !== undefined) result.auxiliaryFolderForm = props.AuxiliaryFolderForm
  if (props.AuxiliaryListForm !== undefined) result.auxiliaryListForm = props.AuxiliaryListForm
  if (props.AuxiliaryObjectForm !== undefined) result.auxiliaryObjectForm = props.AuxiliaryObjectForm

  const basedOn = importMetadataValueCollectionFromXML(context, undefined, props.BasedOn)
  if (basedOn) result.basedOn = basedOn

  const characteristics = importCharacteristicsDescriptionsFromXML(context, undefined, props.Characteristics)
  if (characteristics) result.characteristics = characteristics

  const checkUnique = importBooleanFromXML(context, undefined, props.CheckUnique)
  if (checkUnique !== undefined) result.checkUnique = checkUnique

  if (props.ChoiceDataGetModeOnInputByString !== undefined)
    result.choiceDataGetModeOnInputByString = props.ChoiceDataGetModeOnInputByString
  if (props.ChoiceHistoryOnInput !== undefined) result.choiceHistoryOnInput = props.ChoiceHistoryOnInput
  if (props.ChoiceMode !== undefined) result.choiceMode = props.ChoiceMode
  if (props.CodeAllowedLength !== undefined) result.codeAllowedLength = props.CodeAllowedLength
  if (props.CodeLength !== undefined) result.codeLength = props.CodeLength
  if (props.CodeSeries !== undefined) result.codeSeries = props.CodeSeries
  if (props.CodeType !== undefined) result.codeType = props.CodeType

  if (childObjects?.Command) result.commands = importMetadataCommandsFromXML(context, undefined, childObjects.Command)

  if (props.Comment !== undefined) result.comment = props.Comment
  if (props.CreateOnInput !== undefined) result.createOnInput = props.CreateOnInput
  if (props.DataHistory !== undefined) result.dataHistory = props.DataHistory
  if (props.DataLockControlMode !== undefined) result.dataLockControlMode = props.DataLockControlMode

  const dataLockFields = importMetadataFieldsFromXML(context, undefined, props.DataLockFields)
  if (dataLockFields) result.dataLockFields = dataLockFields

  if (props.DefaultChoiceForm !== undefined) result.defaultChoiceForm = props.DefaultChoiceForm
  if (props.DefaultFolderChoiceForm !== undefined) result.defaultFolderChoiceForm = props.DefaultFolderChoiceForm
  if (props.DefaultFolderForm !== undefined) result.defaultFolderForm = props.DefaultFolderForm
  if (props.DefaultListForm !== undefined) result.defaultListForm = props.DefaultListForm
  if (props.DefaultObjectForm !== undefined) result.defaultObjectForm = props.DefaultObjectForm
  if (props.DefaultPresentation !== undefined) result.defaultPresentation = props.DefaultPresentation
  if (props.DescriptionLength !== undefined) result.descriptionLength = props.DescriptionLength
  if (props.EditType !== undefined) result.editType = props.EditType
  if (props.ExecuteAfterWriteDataHistoryVersionProcessing !== undefined)
    result.executeAfterWriteDataHistoryVersionProcessing = props.ExecuteAfterWriteDataHistoryVersionProcessing

  const explanation = iimportI8nTextFromXML(context, { type: "I8nText" }, props.Explanation)
  if (explanation !== undefined) result.explanation = explanation

  const extendedListPresentation = iimportI8nTextFromXML(context, { type: "I8nText" }, props.ExtendedListPresentation)
  if (extendedListPresentation !== undefined) result.extendedListPresentation = extendedListPresentation

  const extendedObjectPresentation = iimportI8nTextFromXML(
    context,
    { type: "I8nText" },
    props.ExtendedObjectPresentation
  )
  if (extendedObjectPresentation !== undefined) result.extendedObjectPresentation = extendedObjectPresentation

  const foldersOnTop = importBooleanFromXML(context, undefined, props.FoldersOnTop)
  if (foldersOnTop !== undefined) result.foldersOnTop = foldersOnTop

  if (props.FullTextSearch !== undefined) result.fullTextSearch = props.FullTextSearch
  if (props.FullTextSearchOnInputByString !== undefined)
    result.fullTextSearchOnInputByString = props.FullTextSearchOnInputByString

  const hierarchical = importBooleanFromXML(context, undefined, props.Hierarchical)
  if (hierarchical !== undefined) result.hierarchical = hierarchical

  if (props.HierarchyType !== undefined) result.hierarchyType = props.HierarchyType

  const includeHelpInContents = importBooleanFromXML(context, undefined, props.IncludeHelpInContents)
  if (includeHelpInContents !== undefined) result.includeHelpInContents = includeHelpInContents

  const inputByString = importMetadataFieldsFromXML(context, undefined, props.InputByString)
  if (inputByString) result.inputByString = inputByString

  if (props.LevelCount !== undefined) result.levelCount = props.LevelCount

  const limitLevelCount = importBooleanFromXML(context, undefined, props.LimitLevelCount)
  if (limitLevelCount !== undefined) result.limitLevelCount = limitLevelCount

  const listPresentation = iimportI8nTextFromXML(context, { type: "I8nText" }, props.ListPresentation)
  if (listPresentation !== undefined) result.listPresentation = listPresentation

  const objectPresentation = iimportI8nTextFromXML(context, { type: "I8nText" }, props.ObjectPresentation)
  if (objectPresentation !== undefined) result.objectPresentation = objectPresentation

  const owners = importMetadataValueCollectionFromXML(context, undefined, props.Owners)
  if (owners) result.owners = owners

  if (props.PredefinedDataUpdate !== undefined) result.predefinedDataUpdate = props.PredefinedDataUpdate

  const quickChoice = importBooleanFromXML(context, undefined, props.QuickChoice)
  if (quickChoice !== undefined) result.quickChoice = quickChoice

  if (props.SearchStringModeOnInputByString !== undefined)
    result.searchStringModeOnInputByString = props.SearchStringModeOnInputByString

  const standardAttributes = importStandardAttributeDescriptionsFromXML(context, undefined, props.StandardAttributes)
  if (standardAttributes) result.standardAttributes = standardAttributes

  if (props.SubordinationUse !== undefined) result.subordinationUse = props.SubordinationUse

  const synonym = iimportI8nTextFromXML(context, { type: "I8nText" }, props.Synonym)
  if (synonym !== undefined) result.synonym = synonym

  if (childObjects?.TabularSection)
    result.tabularSections = importMetadataTabularSectionsFromXML(context, undefined, childObjects.TabularSection)

  const updateDataHistoryImmediatelyAfterWrite = importBooleanFromXML(
    context,
    undefined,
    props.UpdateDataHistoryImmediatelyAfterWrite
  )
  if (updateDataHistoryImmediatelyAfterWrite !== undefined)
    result.updateDataHistoryImmediatelyAfterWrite = updateDataHistoryImmediatelyAfterWrite

  const useStandardCommands = importBooleanFromXML(context, undefined, props.UseStandardCommands)
  if (useStandardCommands !== undefined) result.useStandardCommands = useStandardCommands

  const defaults = getDefaults(result, context)
  return removeDefaults(result, defaults)
}
