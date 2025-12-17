import { importMetadataCommandsFromXML } from "~/lib/metadata/appliedObjects/metadataCommand/importFromXML"
import { MetadataDocument, MetadataDocumentXML } from "~/lib/metadata/appliedObjects/metadataDocument/types"
import { importMetadataDocumentNumeratorFromXML } from "~/lib/metadata/appliedObjects/metadataDocumentNumerator/importFromXML"
import { importAdditionalIndexesFromXML } from "~/lib/metadata/commonObjects/additionalIndex/importFromXML"
import { importCharacteristicsDescriptionsFromXML } from "~/lib/metadata/commonObjects/characteristicsDescription/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importMetadataAttributesFromXML } from "~/lib/metadata/commonObjects/metadataAttribute/importFromXML"
import { importMetadataFieldsFromXML } from "~/lib/metadata/commonObjects/metadataField/importFromXML"
import { importMetadataItemLinksFromXML } from "~/lib/metadata/commonObjects/metadataItemLink/importFromXML"
import { importMetadataTabularSectionsFromXML } from "~/lib/metadata/commonObjects/metadataTabularSection/importFromXML"
import { importStandardAttributeDescriptionsFromXML } from "~/lib/metadata/commonObjects/standardAttributeDescription/importFromXML"

export const importMetadataDocumentFromXML = (xml: MetadataDocumentXML | undefined): MetadataDocument | undefined => {
  if (!xml) return undefined

  return {
    actionsWritingOnPost: xml.ActionsWritingOnPost,
    additionalIndexes: importAdditionalIndexesFromXML(xml.AdditionalIndexes),
    attributes: importMetadataAttributesFromXML(xml.Attributes),
    autonumbering: xml.Autonumbering,
    auxiliaryChoiceForm: xml.AuxiliaryChoiceForm,
    auxiliaryListForm: xml.AuxiliaryListForm,
    auxiliaryObjectForm: xml.AuxiliaryObjectForm,
    basedOn: importMetadataItemLinksFromXML(xml.BasedOn),
    characteristics: importCharacteristicsDescriptionsFromXML(xml.Characteristics),
    checkUnique: xml.CheckUnique,
    choiceDataGetModeOnInputByString: xml.ChoiceDataGetModeOnInputByString,
    choiceHistoryOnInput: xml.ChoiceHistoryOnInput,
    commands: importMetadataCommandsFromXML(xml.Commands),
    comment: xml.Comment,
    createOnInput: xml.CreateOnInput,
    dataHistory: xml.DataHistory,
    dataLockControlMode: xml.DataLockControlMode,
    dataLockFields: importMetadataFieldsFromXML(xml.DataLockFields),
    defaultChoiceForm: xml.DefaultChoiceForm,
    defaultListForm: xml.DefaultListForm,
    defaultObjectForm: xml.DefaultObjectForm,
    executeAfterWriteDataHistoryVersionProcessing: xml.ExecuteAfterWriteDataHistoryVersionProcessing,
    explanation: importI8nTextFromXML(xml.Explanation),
    extendedListPresentation: importI8nTextFromXML(xml.ExtendedListPresentation),
    extendedObjectPresentation: importI8nTextFromXML(xml.ExtendedObjectPresentation),
    fullTextSearch: xml.FullTextSearch,
    fullTextSearchOnInputByString: xml.FullTextSearchOnInputByString,
    includeHelpInContents: xml.IncludeHelpInContents,
    inputByString: importMetadataFieldsFromXML(xml.InputByString),
    listPresentation: importI8nTextFromXML(xml.ListPresentation),
    name: xml.Name,
    numberAllowedLength: xml.NumberAllowedLength,
    numberLength: xml.NumberLength,
    numberPeriodicity: xml.NumberPeriodicity,
    numberType: xml.NumberType,
    numerator: importMetadataDocumentNumeratorFromXML(xml.Numerator),
    objectBelonging: xml.ObjectBelonging,
    objectPresentation: importI8nTextFromXML(xml.ObjectPresentation),
    posting: xml.Posting,
    privilegedPostingMode: xml.PrivilegedPostingMode,
    privilegedUnpostingMode: xml.PrivilegedUnpostingMode,
    realTimePosting: xml.RealTimePosting,
    registerRecords: importMetadataItemLinksFromXML(xml.RegisterRecords),
    registerRecordsDeletion: xml.RegisterRecordsDeletion,
    searchStringModeOnInputByString: xml.SearchStringModeOnInputByString,
    sequenceFilling: xml.SequenceFilling,
    standardAttributes: importStandardAttributeDescriptionsFromXML(xml.StandardAttributes),
    synonym: importI8nTextFromXML(xml.Synonym),
    tabularSections: importMetadataTabularSectionsFromXML(xml.TabularSections),
    updateDataHistoryImmediatelyAfterWrite: xml.UpdateDataHistoryImmediatelyAfterWrite,
    useStandardCommands: xml.UseStandardCommands,
  }
}
