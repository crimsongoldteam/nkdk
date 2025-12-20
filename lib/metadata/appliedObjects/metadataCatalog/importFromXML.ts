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
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { importBooleanFromXML } from "../../commonObjects/boolean/importFromXML"
import { importMetadataAttributesFromXML } from "../../commonObjects/metadataAttribute/importFromXML"
import { MetadataAttributes } from "../../commonObjects/metadataAttribute/types"
import { MetadataTabularSections } from "../../commonObjects/metadataTabularSection/types"
import { compactObject, removeDefaults } from "../../helpers/compactObject"
import { MetadataCommands } from "../metadataCommand/types"
import { getDefaults } from "./defaults"

export const importMetadataCatalogFromXML = (
  xml: MetadataCatalogXML | undefined,
  configurationSettings: ConfigurationSettings
): MetadataCatalog | undefined => {
  if (!xml || !xml.Catalog?.Properties) return undefined

  const props = xml.Catalog.Properties

  let attributes: MetadataAttributes | undefined
  if (xml.Catalog.ChildObjects?.Attribute) {
    attributes = importMetadataAttributesFromXML(xml.Catalog.ChildObjects.Attribute, configurationSettings)
  }

  let tabularSections: MetadataTabularSections | undefined
  if (xml.Catalog.ChildObjects?.TabularSection) {
    tabularSections = importMetadataTabularSectionsFromXML(
      xml.Catalog.ChildObjects.TabularSection,
      configurationSettings
    )
  }

  let commands: MetadataCommands | undefined
  if (xml.Catalog.ChildObjects?.Command) {
    commands = importMetadataCommandsFromXML(xml.Catalog.ChildObjects.Command, configurationSettings)
  }

  const result = {
    additionalIndexes: importAdditionalIndexesFromXML(props.AdditionalIndexes, configurationSettings),
    attributes: attributes,
    autonumbering: importBooleanFromXML(props.Autonumbering, configurationSettings),
    auxiliaryChoiceForm: props.AuxiliaryChoiceForm,
    auxiliaryFolderChoiceForm: props.AuxiliaryFolderChoiceForm,
    auxiliaryFolderForm: props.AuxiliaryFolderForm,
    auxiliaryListForm: props.AuxiliaryListForm,
    auxiliaryObjectForm: props.AuxiliaryObjectForm,
    basedOn: importMetadataItemLinksFromXML(props.BasedOn, configurationSettings),
    characteristics: importCharacteristicsDescriptionsFromXML(props.Characteristics, configurationSettings),
    checkUnique: importBooleanFromXML(props.CheckUnique, configurationSettings),
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
    dataLockFields: importMetadataFieldsFromXML(props.DataLockFields, configurationSettings),
    defaultChoiceForm: props.DefaultChoiceForm,
    defaultFolderChoiceForm: props.DefaultFolderChoiceForm,
    defaultFolderForm: props.DefaultFolderForm,
    defaultListForm: props.DefaultListForm,
    defaultObjectForm: props.DefaultObjectForm,
    defaultPresentation: props.DefaultPresentation,
    descriptionLength: props.DescriptionLength,
    editType: props.EditType,
    executeAfterWriteDataHistoryVersionProcessing: props.ExecuteAfterWriteDataHistoryVersionProcessing,
    explanation: importI8nTextFromXML(props.Explanation, configurationSettings),
    extendedListPresentation: importI8nTextFromXML(props.ExtendedListPresentation, configurationSettings),
    extendedObjectPresentation: importI8nTextFromXML(props.ExtendedObjectPresentation, configurationSettings),
    foldersOnTop: importBooleanFromXML(props.FoldersOnTop, configurationSettings),
    fullTextSearch: props.FullTextSearch,
    fullTextSearchOnInputByString: props.FullTextSearchOnInputByString,
    hierarchical: importBooleanFromXML(props.Hierarchical, configurationSettings),
    hierarchyType: props.HierarchyType,
    includeHelpInContents: importBooleanFromXML(props.IncludeHelpInContents, configurationSettings),
    inputByString: importMetadataFieldsFromXML(props.InputByString, configurationSettings),
    levelCount: props.LevelCount,
    limitLevelCount: importBooleanFromXML(props.LimitLevelCount, configurationSettings),
    listPresentation: importI8nTextFromXML(props.ListPresentation, configurationSettings),
    name: props.Name!,
    objectBelonging: props.ObjectBelonging,
    objectPresentation: importI8nTextFromXML(props.ObjectPresentation, configurationSettings),
    owners: importMetadataItemLinksFromXML(props.Owners, configurationSettings),
    predefined: importPredefinedItemsFromXML(props.Predefined, configurationSettings),
    predefinedDataUpdate: props.PredefinedDataUpdate,
    quickChoice: importBooleanFromXML(props.QuickChoice, configurationSettings),
    searchStringModeOnInputByString: props.SearchStringModeOnInputByString,
    standardAttributes: importStandardAttributeDescriptionsFromXML(props.StandardAttributes, configurationSettings),
    subordinationUse: props.SubordinationUse,
    synonym: importI8nTextFromXML(props.Synonym, configurationSettings),
    tabularSections: tabularSections,
    updateDataHistoryImmediatelyAfterWrite: importBooleanFromXML(
      props.UpdateDataHistoryImmediatelyAfterWrite,
      configurationSettings
    ),
    useStandardCommands: importBooleanFromXML(props.UseStandardCommands, configurationSettings),
  }

  const compactedResult = compactObject(result)
  const defaults = getDefaults(compactedResult, configurationSettings)
  return removeDefaults(compactedResult, defaults)
}
