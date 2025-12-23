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
  context: Context,
  xml: MetadataCatalogXML | undefined
): MetadataCatalog | undefined => {
  if (!xml || !xml.Catalog?.Properties) return undefined

  const props = xml.Catalog.Properties

  let attributes: MetadataAttributes | undefined
  if (xml.Catalog.ChildObjects?.Attribute) {
    attributes = importMetadataAttributesFromXML(context, xml.Catalog.ChildObjects.Attribute)
  }

  let tabularSections: MetadataTabularSections | undefined
  if (xml.Catalog.ChildObjects?.TabularSection) {
    tabularSections = importMetadataTabularSectionsFromXML(context, xml.Catalog.ChildObjects.TabularSection)
  }

  let commands: MetadataCommands | undefined
  if (xml.Catalog.ChildObjects?.Command) {
    commands = importMetadataCommandsFromXML(context, xml.Catalog.ChildObjects.Command)
  }

  const result = {
    additionalIndexes: importAdditionalIndexesFromXML(context, props.AdditionalIndexes),
    attributes: attributes,
    autonumbering: importBooleanFromXML(context, props.Autonumbering),
    auxiliaryChoiceForm: props.AuxiliaryChoiceForm,
    auxiliaryFolderChoiceForm: props.AuxiliaryFolderChoiceForm,
    auxiliaryFolderForm: props.AuxiliaryFolderForm,
    auxiliaryListForm: props.AuxiliaryListForm,
    auxiliaryObjectForm: props.AuxiliaryObjectForm,
    basedOn: importMetadataItemLinksFromXML(context, props.BasedOn),
    characteristics: importCharacteristicsDescriptionsFromXML(context, props.Characteristics),
    checkUnique: importBooleanFromXML(context, props.CheckUnique),
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
    dataLockFields: importMetadataFieldsFromXML(context, props.DataLockFields),
    defaultChoiceForm: props.DefaultChoiceForm,
    defaultFolderChoiceForm: props.DefaultFolderChoiceForm,
    defaultFolderForm: props.DefaultFolderForm,
    defaultListForm: props.DefaultListForm,
    defaultObjectForm: props.DefaultObjectForm,
    defaultPresentation: props.DefaultPresentation,
    descriptionLength: props.DescriptionLength,
    editType: props.EditType,
    executeAfterWriteDataHistoryVersionProcessing: props.ExecuteAfterWriteDataHistoryVersionProcessing,
    explanation: importI8nTextFromXML(context, props.Explanation),
    extendedListPresentation: importI8nTextFromXML(context, props.ExtendedListPresentation),
    extendedObjectPresentation: importI8nTextFromXML(context, props.ExtendedObjectPresentation),
    foldersOnTop: importBooleanFromXML(context, props.FoldersOnTop),
    fullTextSearch: props.FullTextSearch,
    fullTextSearchOnInputByString: props.FullTextSearchOnInputByString,
    hierarchical: importBooleanFromXML(context, props.Hierarchical),
    hierarchyType: props.HierarchyType,
    includeHelpInContents: importBooleanFromXML(context, props.IncludeHelpInContents),
    inputByString: importMetadataFieldsFromXML(context, props.InputByString),
    levelCount: props.LevelCount,
    limitLevelCount: importBooleanFromXML(context, props.LimitLevelCount),
    listPresentation: importI8nTextFromXML(context, props.ListPresentation),
    name: props.Name!,
    objectBelonging: props.ObjectBelonging,
    objectPresentation: importI8nTextFromXML(context, props.ObjectPresentation),
    owners: importMetadataItemLinksFromXML(context, props.Owners),
    predefined: importPredefinedItemsFromXML(context, props.Predefined),
    predefinedDataUpdate: props.PredefinedDataUpdate,
    quickChoice: importBooleanFromXML(context, props.QuickChoice),
    searchStringModeOnInputByString: props.SearchStringModeOnInputByString,
    standardAttributes: importStandardAttributeDescriptionsFromXML(context, props.StandardAttributes),
    subordinationUse: props.SubordinationUse,
    synonym: importI8nTextFromXML(context, props.Synonym),
    tabularSections: tabularSections,
    updateDataHistoryImmediatelyAfterWrite: importBooleanFromXML(context, props.UpdateDataHistoryImmediatelyAfterWrite),
    useStandardCommands: importBooleanFromXML(context, props.UseStandardCommands),
  }

  const compactedResult = compactObject(result)
  const defaults = getDefaults(compactedResult, context)
  return removeDefaults(compactedResult, defaults)
}
