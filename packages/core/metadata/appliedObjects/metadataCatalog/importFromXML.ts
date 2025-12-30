import { MetadataCatalog, MetadataCatalogXML } from "~/metadata/appliedObjects/metadataCatalog/types"
import { importMetadataCommandsFromXML } from "~/metadata/appliedObjects/metadataCommand/importFromXML"
import { importCharacteristicsDescriptionsFromXML } from "~/metadata/commonObjects/characteristicsDescription/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importMetadataFieldsFromXML } from "~/metadata/commonObjects/metadataField/importFromXML"
import { importMetadataTabularSectionsFromXML } from "~/metadata/commonObjects/metadataTabularSection/importFromXML"
import { importMetadataValueCollectionFromXML } from "~/metadata/commonObjects/metadataValueCollection/importFromXML"
import { importStandardAttributeDescriptionsFromXML } from "~/metadata/commonObjects/standardAttributeDescription/importFromXML"
import { Context } from "~/metadata/context/types"
import { importBooleanFromXML } from "../../commonObjects/boolean/importFromXML"
import { importMetadataAttributesFromXML } from "../../commonObjects/metadataAttribute/importFromXML"
import { removeDefaults } from "../../helpers/compactObject"
import { getDefaults } from "./defaults"

export const importMetadataCatalogFromXML = (
  context: Context,
  xml: MetadataCatalogXML
): MetadataCatalog | undefined => {
  const props = xml.Catalog.Properties

  const result: MetadataCatalog = {
    name: props.Name,
  }

  const childObjects = xml.Catalog.ChildObjects

  if (childObjects?.Attribute) result.attributes = importMetadataAttributesFromXML(context, childObjects.Attribute)

  const autonumbering = importBooleanFromXML(context, props.Autonumbering)
  if (autonumbering !== undefined) result.autonumbering = autonumbering

  if (props.AuxiliaryChoiceForm !== undefined) result.auxiliaryChoiceForm = props.AuxiliaryChoiceForm
  if (props.AuxiliaryFolderChoiceForm !== undefined) result.auxiliaryFolderChoiceForm = props.AuxiliaryFolderChoiceForm
  if (props.AuxiliaryFolderForm !== undefined) result.auxiliaryFolderForm = props.AuxiliaryFolderForm
  if (props.AuxiliaryListForm !== undefined) result.auxiliaryListForm = props.AuxiliaryListForm
  if (props.AuxiliaryObjectForm !== undefined) result.auxiliaryObjectForm = props.AuxiliaryObjectForm

  const basedOn = importMetadataValueCollectionFromXML(context, props.BasedOn)
  if (basedOn) result.basedOn = basedOn

  const characteristics = importCharacteristicsDescriptionsFromXML(context, props.Characteristics)
  if (characteristics) result.characteristics = characteristics

  const checkUnique = importBooleanFromXML(context, props.CheckUnique)
  if (checkUnique !== undefined) result.checkUnique = checkUnique

  if (props.ChoiceDataGetModeOnInputByString !== undefined)
    result.choiceDataGetModeOnInputByString = props.ChoiceDataGetModeOnInputByString
  if (props.ChoiceHistoryOnInput !== undefined) result.choiceHistoryOnInput = props.ChoiceHistoryOnInput
  if (props.ChoiceMode !== undefined) result.choiceMode = props.ChoiceMode
  if (props.CodeAllowedLength !== undefined) result.codeAllowedLength = props.CodeAllowedLength
  if (props.CodeLength !== undefined) result.codeLength = props.CodeLength
  if (props.CodeSeries !== undefined) result.codeSeries = props.CodeSeries
  if (props.CodeType !== undefined) result.codeType = props.CodeType

  if (childObjects?.Command) result.commands = importMetadataCommandsFromXML(context, childObjects.Command)

  if (props.Comment !== undefined) result.comment = props.Comment
  if (props.CreateOnInput !== undefined) result.createOnInput = props.CreateOnInput
  if (props.DataHistory !== undefined) result.dataHistory = props.DataHistory
  if (props.DataLockControlMode !== undefined) result.dataLockControlMode = props.DataLockControlMode

  const dataLockFields = importMetadataFieldsFromXML(context, props.DataLockFields)
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

  const explanation = importI8nTextFromXML(context, props.Explanation)
  if (explanation !== undefined) result.explanation = explanation

  const extendedListPresentation = importI8nTextFromXML(context, props.ExtendedListPresentation)
  if (extendedListPresentation !== undefined) result.extendedListPresentation = extendedListPresentation

  const extendedObjectPresentation = importI8nTextFromXML(context, props.ExtendedObjectPresentation)
  if (extendedObjectPresentation !== undefined) result.extendedObjectPresentation = extendedObjectPresentation

  const foldersOnTop = importBooleanFromXML(context, props.FoldersOnTop)
  if (foldersOnTop !== undefined) result.foldersOnTop = foldersOnTop

  if (props.FullTextSearch !== undefined) result.fullTextSearch = props.FullTextSearch
  if (props.FullTextSearchOnInputByString !== undefined)
    result.fullTextSearchOnInputByString = props.FullTextSearchOnInputByString

  const hierarchical = importBooleanFromXML(context, props.Hierarchical)
  if (hierarchical !== undefined) result.hierarchical = hierarchical

  if (props.HierarchyType !== undefined) result.hierarchyType = props.HierarchyType

  const includeHelpInContents = importBooleanFromXML(context, props.IncludeHelpInContents)
  if (includeHelpInContents !== undefined) result.includeHelpInContents = includeHelpInContents

  const inputByString = importMetadataFieldsFromXML(context, props.InputByString)
  if (inputByString) result.inputByString = inputByString

  if (props.LevelCount !== undefined) result.levelCount = props.LevelCount

  const limitLevelCount = importBooleanFromXML(context, props.LimitLevelCount)
  if (limitLevelCount !== undefined) result.limitLevelCount = limitLevelCount

  const listPresentation = importI8nTextFromXML(context, props.ListPresentation)
  if (listPresentation !== undefined) result.listPresentation = listPresentation

  const objectPresentation = importI8nTextFromXML(context, props.ObjectPresentation)
  if (objectPresentation !== undefined) result.objectPresentation = objectPresentation

  const owners = importMetadataValueCollectionFromXML(context, props.Owners)
  if (owners) result.owners = owners

  if (props.PredefinedDataUpdate !== undefined) result.predefinedDataUpdate = props.PredefinedDataUpdate

  const quickChoice = importBooleanFromXML(context, props.QuickChoice)
  if (quickChoice !== undefined) result.quickChoice = quickChoice

  if (props.SearchStringModeOnInputByString !== undefined)
    result.searchStringModeOnInputByString = props.SearchStringModeOnInputByString

  const standardAttributes = importStandardAttributeDescriptionsFromXML(context, props.StandardAttributes)
  if (standardAttributes) result.standardAttributes = standardAttributes

  if (props.SubordinationUse !== undefined) result.subordinationUse = props.SubordinationUse

  const synonym = importI8nTextFromXML(context, props.Synonym)
  if (synonym !== undefined) result.synonym = synonym

  if (childObjects?.TabularSection)
    result.tabularSections = importMetadataTabularSectionsFromXML(context, childObjects.TabularSection)

  const updateDataHistoryImmediatelyAfterWrite = importBooleanFromXML(
    context,
    props.UpdateDataHistoryImmediatelyAfterWrite
  )
  if (updateDataHistoryImmediatelyAfterWrite !== undefined)
    result.updateDataHistoryImmediatelyAfterWrite = updateDataHistoryImmediatelyAfterWrite

  const useStandardCommands = importBooleanFromXML(context, props.UseStandardCommands)
  if (useStandardCommands !== undefined) result.useStandardCommands = useStandardCommands

  const defaults = getDefaults(result, context)
  return removeDefaults(result, defaults)
}
