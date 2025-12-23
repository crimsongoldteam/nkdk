import { MetadataCatalog, MetadataCatalogXML } from "~/lib/metadata/appliedObjects/metadataCatalog/types"
import { importMetadataCommandsFromXML } from "~/lib/metadata/appliedObjects/metadataCommand/importFromXML"
import { importAdditionalIndexesFromXML } from "~/lib/metadata/commonObjects/additionalIndex/importFromXML"
import { importCharacteristicsDescriptionsFromXML } from "~/lib/metadata/commonObjects/characteristicsDescription/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importMetadataFieldsFromXML } from "~/lib/metadata/commonObjects/metadataField/importFromXML"
import { importMetadataItemLinksFromXML } from "~/lib/metadata/commonObjects/metadataItemLink/importFromXML"
import { importMetadataTabularSectionsFromXML } from "~/lib/metadata/commonObjects/metadataTabularSection/importFromXML"
import { importPredefinedItemsFromXML } from "~/lib/metadata/commonObjects/predifined/importFromXML"
import { importStandardAttributeDescriptionsFromXML } from "~/lib/metadata/commonObjects/standardAttributeDescription/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { importBooleanFromXML } from "../../commonObjects/boolean/importFromXML"
import { importMetadataAttributesFromXML } from "../../commonObjects/metadataAttribute/importFromXML"
import { MetadataAttributes } from "../../commonObjects/metadataAttribute/types"
import { MetadataTabularSections } from "../../commonObjects/metadataTabularSection/types"
import { compactObject, removeDefaults } from "../../helpers/compactObject"
import { MetadataCommands } from "../metadataCommand/types"
import { getDefaults } from "./defaults"

export const importMetadataCatalogFromXML = (
  configurationSettings: Context,
  xml: MetadataCatalogXML | undefined
): MetadataCatalog | undefined => {
  if (!xml || !xml.Catalog?.Properties) return undefined

  const props = xml.Catalog.Properties

  let attributes: MetadataAttributes | undefined
  if (xml.Catalog.ChildObjects?.Attribute) {
    attributes = importMetadataAttributesFromXML(configurationSettings, xml.Catalog.ChildObjects.Attribute)
  }

  let tabularSections: MetadataTabularSections | undefined
  if (xml.Catalog.ChildObjects?.TabularSection) {
    tabularSections = importMetadataTabularSectionsFromXML(
      configurationSettings,
      xml.Catalog.ChildObjects.TabularSection
    )
  }

  let commands: MetadataCommands | undefined
  if (xml.Catalog.ChildObjects?.Command) {
    commands = importMetadataCommandsFromXML(configurationSettings, xml.Catalog.ChildObjects.Command)
  }

  const result = {
    additionalIndexes: importAdditionalIndexesFromXML(configurationSettings, props.AdditionalIndexes),
    attributes: attributes,
    autonumbering: importBooleanFromXML(configurationSettings, props.Autonumbering),
    auxiliaryChoiceForm: props.AuxiliaryChoiceForm,
    auxiliaryFolderChoiceForm: props.AuxiliaryFolderChoiceForm,
    auxiliaryFolderForm: props.AuxiliaryFolderForm,
    auxiliaryListForm: props.AuxiliaryListForm,
    auxiliaryObjectForm: props.AuxiliaryObjectForm,
    basedOn: importMetadataItemLinksFromXML(configurationSettings, props.BasedOn),
    characteristics: importCharacteristicsDescriptionsFromXML(configurationSettings, props.Characteristics),
    checkUnique: importBooleanFromXML(configurationSettings, props.CheckUnique),
    choiceDataGetModeOnInputByString: props.ChoiceDataGetModeOnInputByString,
    choiceHistoryOnInput: props.ChoiceHistoryOnInput,
    choiceMode: props.ChoiceMode,
    codeAllowedLength: props.CodeAllowedLength,
    codeLength: props.CodeLength,
    codeSeries: props.CodeSeries,
    codeType: props.CodeType,
    commands: commands,
    comment: props.Comment,
    createOnInput: props.CreateOnInput,
    dataHistory: props.DataHistory,
    dataLockControlMode: props.DataLockControlMode,
    dataLockFields: importMetadataFieldsFromXML(configurationSettings, props.DataLockFields),
    defaultChoiceForm: props.DefaultChoiceForm,
    defaultFolderChoiceForm: props.DefaultFolderChoiceForm,
    defaultFolderForm: props.DefaultFolderForm,
    defaultListForm: props.DefaultListForm,
    defaultObjectForm: props.DefaultObjectForm,
    defaultPresentation: props.DefaultPresentation,
    descriptionLength: props.DescriptionLength,
    editType: props.EditType,
    executeAfterWriteDataHistoryVersionProcessing: props.ExecuteAfterWriteDataHistoryVersionProcessing,
    explanation: importI8nTextFromXML(configurationSettings, props.Explanation),
    extendedListPresentation: importI8nTextFromXML(configurationSettings, props.ExtendedListPresentation),
    extendedObjectPresentation: importI8nTextFromXML(configurationSettings, props.ExtendedObjectPresentation),
    foldersOnTop: importBooleanFromXML(configurationSettings, props.FoldersOnTop),
    fullTextSearch: props.FullTextSearch,
    fullTextSearchOnInputByString: props.FullTextSearchOnInputByString,
    hierarchical: importBooleanFromXML(configurationSettings, props.Hierarchical),
    hierarchyType: props.HierarchyType,
    includeHelpInContents: importBooleanFromXML(configurationSettings, props.IncludeHelpInContents),
    inputByString: importMetadataFieldsFromXML(configurationSettings, props.InputByString),
    levelCount: props.LevelCount,
    limitLevelCount: importBooleanFromXML(configurationSettings, props.LimitLevelCount),
    listPresentation: importI8nTextFromXML(configurationSettings, props.ListPresentation),
    name: props.Name!,
    objectBelonging: props.ObjectBelonging,
    objectPresentation: importI8nTextFromXML(configurationSettings, props.ObjectPresentation),
    owners: importMetadataItemLinksFromXML(configurationSettings, props.Owners),
    predefined: importPredefinedItemsFromXML(configurationSettings, props.Predefined),
    predefinedDataUpdate: props.PredefinedDataUpdate,
    quickChoice: importBooleanFromXML(configurationSettings, props.QuickChoice),
    searchStringModeOnInputByString: props.SearchStringModeOnInputByString,
    standardAttributes: importStandardAttributeDescriptionsFromXML(configurationSettings, props.StandardAttributes),
    subordinationUse: props.SubordinationUse,
    synonym: importI8nTextFromXML(configurationSettings, props.Synonym),
    tabularSections: tabularSections,
    updateDataHistoryImmediatelyAfterWrite: importBooleanFromXML(
      configurationSettings,
      props.UpdateDataHistoryImmediatelyAfterWrite
    ),
    useStandardCommands: importBooleanFromXML(configurationSettings, props.UseStandardCommands),
  }

  const compactedResult = compactObject(result)
  const defaults = getDefaults(compactedResult, configurationSettings)
  return removeDefaults(compactedResult, defaults)
}
