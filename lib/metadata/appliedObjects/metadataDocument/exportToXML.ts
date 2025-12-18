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
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"

export const exportMetadataDocumentToXML = (
  data: MetadataDocument | undefined,
  configurationSettings: ConfigurationSettings
): MetadataDocumentXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ActionsWritingOnPost: data.actionsWritingOnPost,
    AdditionalIndexes: exportAdditionalIndexesToXML(data.additionalIndexes, configurationSettings),
    Attributes: exportMetadataAttributesToXML(data.attributes, configurationSettings),
    Autonumbering: data.autonumbering,
    AuxiliaryChoiceForm: data.auxiliaryChoiceForm,
    AuxiliaryListForm: data.auxiliaryListForm,
    AuxiliaryObjectForm: data.auxiliaryObjectForm,
    BasedOn: exportMetadataItemLinksToXML(data.basedOn, configurationSettings),
    Characteristics: exportCharacteristicsDescriptionsToXML(data.characteristics, configurationSettings),
    CheckUnique: data.checkUnique,
    ChoiceDataGetModeOnInputByString: data.choiceDataGetModeOnInputByString,
    ChoiceHistoryOnInput: data.choiceHistoryOnInput,
    Commands: exportMetadataCommandsToXML(data.commands, configurationSettings),
    Comment: data.comment,
    CreateOnInput: data.createOnInput,
    DataHistory: data.dataHistory,
    DataLockControlMode: data.dataLockControlMode,
    DataLockFields: exportMetadataFieldsToXML(data.dataLockFields, configurationSettings),
    DefaultChoiceForm: data.defaultChoiceForm,
    DefaultListForm: data.defaultListForm,
    DefaultObjectForm: data.defaultObjectForm,
    ExecuteAfterWriteDataHistoryVersionProcessing: data.executeAfterWriteDataHistoryVersionProcessing,
    Explanation: exportI8nTextToXML(data.explanation, configurationSettings),
    ExtendedListPresentation: exportI8nTextToXML(data.extendedListPresentation, configurationSettings),
    ExtendedObjectPresentation: exportI8nTextToXML(data.extendedObjectPresentation, configurationSettings),
    FullTextSearch: data.fullTextSearch,
    FullTextSearchOnInputByString: data.fullTextSearchOnInputByString,
    IncludeHelpInContents: data.includeHelpInContents,
    InputByString: exportMetadataFieldsToXML(data.inputByString, configurationSettings),
    ListPresentation: exportI8nTextToXML(data.listPresentation, configurationSettings),
    Name: data.name!,
    NumberAllowedLength: data.numberAllowedLength,
    NumberLength: data.numberLength,
    NumberPeriodicity: data.numberPeriodicity,
    NumberType: data.numberType,
    Numerator: exportMetadataDocumentNumeratorToXML(data.numerator, configurationSettings),
    ObjectBelonging: data.objectBelonging,
    ObjectPresentation: exportI8nTextToXML(data.objectPresentation, configurationSettings),
    Posting: data.posting,
    PrivilegedPostingMode: data.privilegedPostingMode,
    PrivilegedUnpostingMode: data.privilegedUnpostingMode,
    RealTimePosting: data.realTimePosting,
    RegisterRecords: exportMetadataItemLinksToXML(data.registerRecords, configurationSettings),
    RegisterRecordsDeletion: data.registerRecordsDeletion,
    SearchStringModeOnInputByString: data.searchStringModeOnInputByString,
    SequenceFilling: data.sequenceFilling,
    StandardAttributes: exportStandardAttributeDescriptionsToXML(data.standardAttributes, configurationSettings),
    Synonym: exportI8nTextToXML(data.synonym, configurationSettings),
    TabularSections: exportMetadataTabularSectionsToXML(data.tabularSections, configurationSettings),
    UpdateDataHistoryImmediatelyAfterWrite: data.updateDataHistoryImmediatelyAfterWrite,
    UseStandardCommands: data.useStandardCommands,
  })
}
