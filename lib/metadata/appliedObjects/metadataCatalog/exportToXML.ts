import { exportMetadataCommandsToXML } from "~/lib/metadata/appliedObjects/metadataCommand/exportToXML"
import { exportAdditionalIndexesToXML } from "~/lib/metadata/commonObjects/additionalIndex/exportToXML"
import { exportCharacteristicsDescriptionsToXML } from "~/lib/metadata/commonObjects/characteristicsDescription/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportMetadataAttributesToXML } from "~/lib/metadata/commonObjects/metadataAttribute/exportToXML"
import { exportMetadataFieldsToXML } from "~/lib/metadata/commonObjects/metadataField/exportToXML"
import { exportMetadataItemLinksToXML } from "~/lib/metadata/commonObjects/metadataItemLink/exportToXML"
import { exportMetadataTabularSectionsToXML } from "~/lib/metadata/commonObjects/metadataTabularSection/exportToXML"
import { exportPredefinedListToXML } from "~/lib/metadata/commonObjects/predifined/exportToXML"
import { exportStandardAttributeDescriptionsToXML } from "~/lib/metadata/commonObjects/standardAttributeDescription/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

export const exportMetadataCatalogToXML = (data: MetadataCatalog | undefined): MetadataCatalogXML | undefined => {
  if (!data) return undefined

  return {
    AdditionalIndexes: exportAdditionalIndexesToXML(data.additionalIndexes),
    Attributes: exportMetadataAttributesToXML(data.attributes),
    Autonumbering: data.autonumbering,
    AuxiliaryChoiceForm: data.auxiliaryChoiceForm,
    AuxiliaryFolderChoiceForm: data.auxiliaryFolderChoiceForm,
    AuxiliaryFolderForm: data.auxiliaryFolderForm,
    AuxiliaryListForm: data.auxiliaryListForm,
    AuxiliaryObjectForm: data.auxiliaryObjectForm,
    BasedOn: exportMetadataItemLinksToXML(data.basedOn),
    Characteristics: exportCharacteristicsDescriptionsToXML(data.characteristics),
    CheckUnique: data.checkUnique,
    ChoiceDataGetModeOnInputByString: data.choiceDataGetModeOnInputByString,
    ChoiceHistoryOnInput: data.choiceHistoryOnInput,
    ChoiceMode: data.choiceMode,
    CodeAllowedLength: data.codeAllowedLength,
    CodeLength: data.codeLength,
    CodeSeries: data.codeSeries,
    CodeType: data.codeType,
    Commands: exportMetadataCommandsToXML(data.commands),
    Comment: data.comment,
    CreateOnInput: data.createOnInput,
    DataHistory: data.dataHistory,
    DataLockControlMode: data.dataLockControlMode,
    DataLockFields: exportMetadataFieldsToXML(data.dataLockFields),
    DefaultChoiceForm: data.defaultChoiceForm,
    DefaultFolderChoiceForm: data.defaultFolderChoiceForm,
    DefaultFolderForm: data.defaultFolderForm,
    DefaultListForm: data.defaultListForm,
    DefaultObjectForm: data.defaultObjectForm,
    DefaultPresentation: data.defaultPresentation,
    DescriptionLength: data.descriptionLength,
    EditType: data.editType,
    ExecuteAfterWriteDataHistoryVersionProcessing: data.executeAfterWriteDataHistoryVersionProcessing,
    Explanation: exportI8nTextToXML(data.explanation),
    ExtendedListPresentation: exportI8nTextToXML(data.extendedListPresentation),
    ExtendedObjectPresentation: exportI8nTextToXML(data.extendedObjectPresentation),
    FoldersOnTop: data.foldersOnTop,
    FullTextSearch: data.fullTextSearch,
    FullTextSearchOnInputByString: data.fullTextSearchOnInputByString,
    Hierarchical: data.hierarchical,
    HierarchyType: data.hierarchyType,
    IncludeHelpInContents: data.includeHelpInContents,
    InputByString: exportMetadataFieldsToXML(data.inputByString),
    LevelCount: data.levelCount,
    LimitLevelCount: data.limitLevelCount,
    ListPresentation: exportI8nTextToXML(data.listPresentation),
    Name: data.name,
    ObjectBelonging: data.objectBelonging,
    ObjectPresentation: exportI8nTextToXML(data.objectPresentation),
    Owners: exportMetadataItemLinksToXML(data.owners),
    Predefined: exportPredefinedListToXML(data.predefined),
    PredefinedDataUpdate: data.predefinedDataUpdate,
    QuickChoice: data.quickChoice,
    SearchStringModeOnInputByString: data.searchStringModeOnInputByString,
    StandardAttributes: exportStandardAttributeDescriptionsToXML(data.standardAttributes),
    SubordinationUse: data.subordinationUse,
    Synonym: exportI8nTextToXML(data.synonym),
    TabularSections: exportMetadataTabularSectionsToXML(data.tabularSections),
    UpdateDataHistoryImmediatelyAfterWrite: data.updateDataHistoryImmediatelyAfterWrite,
    UseStandardCommands: data.useStandardCommands,
  }
}

registerExport(FormElementType.MetadataCatalog, exportMetadataCatalogToXML)
