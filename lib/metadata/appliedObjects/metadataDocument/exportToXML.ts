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
import { Context } from "~/lib/metadata/context/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"

export const exportMetadataDocumentToXML = (
  configurationSettings: Context,
  data: MetadataDocument | undefined
): MetadataDocumentXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ActionsWritingOnPost: data.actionsWritingOnPost,
    AdditionalIndexes: exportAdditionalIndexesToXML(configurationSettings, data.additionalIndexes),
    Attributes: exportMetadataAttributesToXML(configurationSettings, data.attributes),
    Autonumbering: data.autonumbering,
    AuxiliaryChoiceForm: data.auxiliaryChoiceForm,
    AuxiliaryListForm: data.auxiliaryListForm,
    AuxiliaryObjectForm: data.auxiliaryObjectForm,
    BasedOn: exportMetadataItemLinksToXML(configurationSettings, data.basedOn),
    Characteristics: exportCharacteristicsDescriptionsToXML(configurationSettings, data.characteristics),
    CheckUnique: data.checkUnique,
    ChoiceDataGetModeOnInputByString: data.choiceDataGetModeOnInputByString,
    ChoiceHistoryOnInput: data.choiceHistoryOnInput,
    Commands: exportMetadataCommandsToXML(configurationSettings, data.commands),
    Comment: data.comment,
    CreateOnInput: data.createOnInput,
    DataHistory: data.dataHistory,
    DataLockControlMode: data.dataLockControlMode,
    DataLockFields: exportMetadataFieldsToXML(configurationSettings, data.dataLockFields),
    DefaultChoiceForm: data.defaultChoiceForm,
    DefaultListForm: data.defaultListForm,
    DefaultObjectForm: data.defaultObjectForm,
    ExecuteAfterWriteDataHistoryVersionProcessing: data.executeAfterWriteDataHistoryVersionProcessing,
    Explanation: exportI8nTextToXML(configurationSettings, data.explanation),
    ExtendedListPresentation: exportI8nTextToXML(configurationSettings, data.extendedListPresentation),
    ExtendedObjectPresentation: exportI8nTextToXML(configurationSettings, data.extendedObjectPresentation),
    FullTextSearch: data.fullTextSearch,
    FullTextSearchOnInputByString: data.fullTextSearchOnInputByString,
    IncludeHelpInContents: data.includeHelpInContents,
    InputByString: exportMetadataFieldsToXML(configurationSettings, data.inputByString),
    ListPresentation: exportI8nTextToXML(configurationSettings, data.listPresentation),
    Name: data.name!,
    NumberAllowedLength: data.numberAllowedLength,
    NumberLength: data.numberLength,
    NumberPeriodicity: data.numberPeriodicity,
    NumberType: data.numberType,
    Numerator: exportMetadataDocumentNumeratorToXML(configurationSettings, data.numerator),
    ObjectBelonging: data.objectBelonging,
    ObjectPresentation: exportI8nTextToXML(configurationSettings, data.objectPresentation),
    Posting: data.posting,
    PrivilegedPostingMode: data.privilegedPostingMode,
    PrivilegedUnpostingMode: data.privilegedUnpostingMode,
    RealTimePosting: data.realTimePosting,
    RegisterRecords: exportMetadataItemLinksToXML(configurationSettings, data.registerRecords),
    RegisterRecordsDeletion: data.registerRecordsDeletion,
    SearchStringModeOnInputByString: data.searchStringModeOnInputByString,
    SequenceFilling: data.sequenceFilling,
    StandardAttributes: exportStandardAttributeDescriptionsToXML(configurationSettings, data.standardAttributes),
    Synonym: exportI8nTextToXML(configurationSettings, data.synonym),
    TabularSections: exportMetadataTabularSectionsToXML(configurationSettings, data.tabularSections),
    UpdateDataHistoryImmediatelyAfterWrite: data.updateDataHistoryImmediatelyAfterWrite,
    UseStandardCommands: data.useStandardCommands,
  })
}
