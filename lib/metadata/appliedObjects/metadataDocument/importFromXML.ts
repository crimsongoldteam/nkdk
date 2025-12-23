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
import { Context } from "~/lib/metadata/context/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"

export const importMetadataDocumentFromXML = (
  configurationSettings: Context,
  xml: MetadataDocumentXML | undefined
): MetadataDocument | undefined => {
  if (!xml) return undefined

  return compactObject({
    actionsWritingOnPost: xml.ActionsWritingOnPost,
    additionalIndexes: importAdditionalIndexesFromXML(configurationSettings, xml.AdditionalIndexes),
    attributes: importMetadataAttributesFromXML(configurationSettings, xml.Attributes),
    autonumbering: xml.Autonumbering,
    auxiliaryChoiceForm: xml.AuxiliaryChoiceForm,
    auxiliaryListForm: xml.AuxiliaryListForm,
    auxiliaryObjectForm: xml.AuxiliaryObjectForm,
    basedOn: importMetadataItemLinksFromXML(configurationSettings, xml.BasedOn),
    characteristics: importCharacteristicsDescriptionsFromXML(configurationSettings, xml.Characteristics),
    checkUnique: xml.CheckUnique,
    choiceDataGetModeOnInputByString: xml.ChoiceDataGetModeOnInputByString,
    choiceHistoryOnInput: xml.ChoiceHistoryOnInput,
    commands: importMetadataCommandsFromXML(configurationSettings, xml.Commands),
    comment: xml.Comment,
    createOnInput: xml.CreateOnInput,
    dataHistory: xml.DataHistory,
    dataLockControlMode: xml.DataLockControlMode,
    dataLockFields: importMetadataFieldsFromXML(configurationSettings, xml.DataLockFields),
    defaultChoiceForm: xml.DefaultChoiceForm,
    defaultListForm: xml.DefaultListForm,
    defaultObjectForm: xml.DefaultObjectForm,
    executeAfterWriteDataHistoryVersionProcessing: xml.ExecuteAfterWriteDataHistoryVersionProcessing,
    explanation: importI8nTextFromXML(configurationSettings, xml.Explanation),
    extendedListPresentation: importI8nTextFromXML(configurationSettings, xml.ExtendedListPresentation),
    extendedObjectPresentation: importI8nTextFromXML(configurationSettings, xml.ExtendedObjectPresentation),
    fullTextSearch: xml.FullTextSearch,
    fullTextSearchOnInputByString: xml.FullTextSearchOnInputByString,
    includeHelpInContents: xml.IncludeHelpInContents,
    inputByString: importMetadataFieldsFromXML(configurationSettings, xml.InputByString),
    listPresentation: importI8nTextFromXML(configurationSettings, xml.ListPresentation),
    name: xml.Name!,
    numberAllowedLength: xml.NumberAllowedLength,
    numberLength: xml.NumberLength,
    numberPeriodicity: xml.NumberPeriodicity,
    numberType: xml.NumberType,
    numerator: importMetadataDocumentNumeratorFromXML(configurationSettings, xml.Numerator),
    objectBelonging: xml.ObjectBelonging,
    objectPresentation: importI8nTextFromXML(configurationSettings, xml.ObjectPresentation),
    posting: xml.Posting,
    privilegedPostingMode: xml.PrivilegedPostingMode,
    privilegedUnpostingMode: xml.PrivilegedUnpostingMode,
    realTimePosting: xml.RealTimePosting,
    registerRecords: importMetadataItemLinksFromXML(configurationSettings, xml.RegisterRecords),
    registerRecordsDeletion: xml.RegisterRecordsDeletion,
    searchStringModeOnInputByString: xml.SearchStringModeOnInputByString,
    sequenceFilling: xml.SequenceFilling,
    standardAttributes: importStandardAttributeDescriptionsFromXML(configurationSettings, xml.StandardAttributes),
    synonym: importI8nTextFromXML(configurationSettings, xml.Synonym),
    tabularSections: importMetadataTabularSectionsFromXML(configurationSettings, xml.TabularSections),
    updateDataHistoryImmediatelyAfterWrite: xml.UpdateDataHistoryImmediatelyAfterWrite,
    useStandardCommands: xml.UseStandardCommands,
  })
}
