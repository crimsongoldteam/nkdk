import { exportMetadataCommandsToXML } from "~/lib/metadata/appliedObjects/metadataCommand/exportToXML"
import { MetadataDocument, MetadataDocumentXML } from "~/lib/metadata/appliedObjects/metadataDocument/types"
import { exportMetadataDocumentNumeratorToXML } from "~/lib/metadata/appliedObjects/metadataDocumentNumerator/exportToXML"
import { exportAdditionalIndexesToXML } from "~/lib/metadata/commonObjects/additionalIndex/exportToXML"
import { exportCharacteristicsDescriptionsToXML } from "~/lib/metadata/commonObjects/characteristicsDescription/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportMetadataAttributesToXML } from "~/lib/metadata/commonObjects/metadataAttribute/exportToXML"
import { exportMetadataFieldsToXML } from "~/lib/metadata/commonObjects/metadataField/exportToXML"
import { exportMetadataItemLinksToXML } from "~/lib/metadata/commonObjects/metadataItemLink/exportToXML"
import { exportMetadataTabularSectionsToXML } from "~/lib/metadata/commonObjects/metadataTabularSection/exportToXML"
import { exportStandardAttributeDescriptionsToXML } from "~/lib/metadata/commonObjects/standardAttributeDescription/exportToXML"

export const exportMetadataDocumentToXML = (data: MetadataDocument | undefined): MetadataDocumentXML | undefined => {
  if (!data) return undefined

  return {
    ActionsWritingOnPost: data.actionsWritingOnPost,
    AdditionalIndexes: exportAdditionalIndexesToXML(data.additionalIndexes),
    Attributes: exportMetadataAttributesToXML(data.attributes),
    Autonumbering: data.autonumbering,
    AuxiliaryChoiceForm: data.auxiliaryChoiceForm,
    AuxiliaryListForm: data.auxiliaryListForm,
    AuxiliaryObjectForm: data.auxiliaryObjectForm,
    BasedOn: exportMetadataItemLinksToXML(data.basedOn),
    Characteristics: exportCharacteristicsDescriptionsToXML(data.characteristics),
    CheckUnique: data.checkUnique,
    ChoiceDataGetModeOnInputByString: data.choiceDataGetModeOnInputByString,
    ChoiceHistoryOnInput: data.choiceHistoryOnInput,
    Commands: exportMetadataCommandsToXML(data.commands),
    Comment: data.comment,
    CreateOnInput: data.createOnInput,
    DataHistory: data.dataHistory,
    DataLockControlMode: data.dataLockControlMode,
    DataLockFields: exportMetadataFieldsToXML(data.dataLockFields),
    DefaultChoiceForm: data.defaultChoiceForm,
    DefaultListForm: data.defaultListForm,
    DefaultObjectForm: data.defaultObjectForm,
    ExecuteAfterWriteDataHistoryVersionProcessing: data.executeAfterWriteDataHistoryVersionProcessing,
    Explanation: exportI8nTextToXML(data.explanation),
    ExtendedListPresentation: exportI8nTextToXML(data.extendedListPresentation),
    ExtendedObjectPresentation: exportI8nTextToXML(data.extendedObjectPresentation),
    FullTextSearch: data.fullTextSearch,
    FullTextSearchOnInputByString: data.fullTextSearchOnInputByString,
    IncludeHelpInContents: data.includeHelpInContents,
    InputByString: exportMetadataFieldsToXML(data.inputByString),
    ListPresentation: exportI8nTextToXML(data.listPresentation),
    Name: data.name,
    NumberAllowedLength: data.numberAllowedLength,
    NumberLength: data.numberLength,
    NumberPeriodicity: data.numberPeriodicity,
    NumberType: data.numberType,
    Numerator: exportMetadataDocumentNumeratorToXML(data.numerator),
    ObjectBelonging: data.objectBelonging,
    ObjectPresentation: exportI8nTextToXML(data.objectPresentation),
    Posting: data.posting,
    PrivilegedPostingMode: data.privilegedPostingMode,
    PrivilegedUnpostingMode: data.privilegedUnpostingMode,
    RealTimePosting: data.realTimePosting,
    RegisterRecords: exportMetadataItemLinksToXML(data.registerRecords),
    RegisterRecordsDeletion: data.registerRecordsDeletion,
    SearchStringModeOnInputByString: data.searchStringModeOnInputByString,
    SequenceFilling: data.sequenceFilling,
    StandardAttributes: exportStandardAttributeDescriptionsToXML(data.standardAttributes),
    Synonym: exportI8nTextToXML(data.synonym),
    TabularSections: exportMetadataTabularSectionsToXML(data.tabularSections),
    UpdateDataHistoryImmediatelyAfterWrite: data.updateDataHistoryImmediatelyAfterWrite,
    UseStandardCommands: data.useStandardCommands,
  }
}
