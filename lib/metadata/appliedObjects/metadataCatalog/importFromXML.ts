import { MetadataCatalog, MetadataCatalogXML } from "~/lib/metadata/appliedObjects/metadataCatalog/types"
import { importMetadataCommandsFromXML } from "~/lib/metadata/appliedObjects/metadataCommand/importFromXML"
import { importAdditionalIndexesFromXML } from "~/lib/metadata/commonObjects/additionalIndex/importFromXML"
import { importCharacteristicsDescriptionsFromXML } from "~/lib/metadata/commonObjects/characteristicsDescription/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importMetadataAttributesFromXML } from "~/lib/metadata/commonObjects/metadataAttribute/importFromXML"
import { importMetadataFieldsFromXML } from "~/lib/metadata/commonObjects/metadataField/importFromXML"
import { importMetadataItemLinksFromXML } from "~/lib/metadata/commonObjects/metadataItemLink/importFromXML"
import { importMetadataTabularSectionsFromXML } from "~/lib/metadata/commonObjects/metadataTabularSection/importFromXML"
import { importPredefinedItemsFromXML } from "~/lib/metadata/commonObjects/predifined/importFromXML"
import { importStandardAttributeDescriptionsFromXML } from "~/lib/metadata/commonObjects/standardAttributeDescription/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"

export const importMetadataCatalogFromXML = (
  xml: MetadataCatalogXML | undefined,
  configurationSettings: ConfigurationSettings
): MetadataCatalog | undefined => {
  if (!xml) return undefined

  return compactObject({
    additionalIndexes: importAdditionalIndexesFromXML(xml.AdditionalIndexes, configurationSettings),
    attributes: importMetadataAttributesFromXML(xml.Attributes, configurationSettings),
    autonumbering: xml.Autonumbering,
    auxiliaryChoiceForm: xml.AuxiliaryChoiceForm,
    auxiliaryFolderChoiceForm: xml.AuxiliaryFolderChoiceForm,
    auxiliaryFolderForm: xml.AuxiliaryFolderForm,
    auxiliaryListForm: xml.AuxiliaryListForm,
    auxiliaryObjectForm: xml.AuxiliaryObjectForm,
    basedOn: importMetadataItemLinksFromXML(xml.BasedOn, configurationSettings),
    characteristics: importCharacteristicsDescriptionsFromXML(xml.Characteristics, configurationSettings),
    checkUnique: xml.CheckUnique,
    choiceDataGetModeOnInputByString: xml.ChoiceDataGetModeOnInputByString,
    choiceHistoryOnInput: xml.ChoiceHistoryOnInput,
    choiceMode: xml.ChoiceMode,
    codeAllowedLength: xml.CodeAllowedLength,
    codeLength: xml.CodeLength,
    codeSeries: xml.CodeSeries,
    codeType: xml.CodeType,
    commands: importMetadataCommandsFromXML(xml.Commands, configurationSettings),
    comment: xml.Comment,
    createOnInput: xml.CreateOnInput,
    dataHistory: xml.DataHistory,
    dataLockControlMode: xml.DataLockControlMode,
    dataLockFields: importMetadataFieldsFromXML(xml.DataLockFields, configurationSettings),
    defaultChoiceForm: xml.DefaultChoiceForm,
    defaultFolderChoiceForm: xml.DefaultFolderChoiceForm,
    defaultFolderForm: xml.DefaultFolderForm,
    defaultListForm: xml.DefaultListForm,
    defaultObjectForm: xml.DefaultObjectForm,
    defaultPresentation: xml.DefaultPresentation,
    descriptionLength: xml.DescriptionLength,
    editType: xml.EditType,
    executeAfterWriteDataHistoryVersionProcessing: xml.ExecuteAfterWriteDataHistoryVersionProcessing,
    explanation: importI8nTextFromXML(xml.Explanation, configurationSettings),
    extendedListPresentation: importI8nTextFromXML(xml.ExtendedListPresentation, configurationSettings),
    extendedObjectPresentation: importI8nTextFromXML(xml.ExtendedObjectPresentation, configurationSettings),
    foldersOnTop: xml.FoldersOnTop,
    fullTextSearch: xml.FullTextSearch,
    fullTextSearchOnInputByString: xml.FullTextSearchOnInputByString,
    hierarchical: xml.Hierarchical,
    hierarchyType: xml.HierarchyType,
    includeHelpInContents: xml.IncludeHelpInContents,
    inputByString: importMetadataFieldsFromXML(xml.InputByString, configurationSettings),
    levelCount: xml.LevelCount,
    limitLevelCount: xml.LimitLevelCount,
    listPresentation: importI8nTextFromXML(xml.ListPresentation, configurationSettings),
    name: xml.Name!,
    objectBelonging: xml.ObjectBelonging,
    objectPresentation: importI8nTextFromXML(xml.ObjectPresentation, configurationSettings),
    owners: importMetadataItemLinksFromXML(xml.Owners, configurationSettings),
    predefined: importPredefinedItemsFromXML(xml.Predefined, configurationSettings),
    predefinedDataUpdate: xml.PredefinedDataUpdate,
    quickChoice: xml.QuickChoice,
    searchStringModeOnInputByString: xml.SearchStringModeOnInputByString,
    standardAttributes: importStandardAttributeDescriptionsFromXML(xml.StandardAttributes, configurationSettings),
    subordinationUse: xml.SubordinationUse,
    synonym: importI8nTextFromXML(xml.Synonym, configurationSettings),
    tabularSections: importMetadataTabularSectionsFromXML(xml.TabularSections, configurationSettings),
    updateDataHistoryImmediatelyAfterWrite: xml.UpdateDataHistoryImmediatelyAfterWrite,
    useStandardCommands: xml.UseStandardCommands,
  })
}
