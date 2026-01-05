import { importMetadataCommandsFromXML } from "~/metadata/appliedObjects/metadataCommand/importFromXML"
import { MetadataDocument, MetadataDocumentXML } from "~/metadata/appliedObjects/metadataDocument/types"
import { importMetadataDocumentNumeratorFromXML } from "~/metadata/appliedObjects/metadataDocumentNumerator/importFromXML"
import { importAdditionalIndexesFromXML } from "~/metadata/commonObjects/additionalIndex/importFromXML"
import { importCharacteristicsDescriptionsFromXML } from "~/metadata/commonObjects/characteristicsDescription/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importMetadataAttributesFromXML } from "~/metadata/commonObjects/metadataAttribute/importFromXML"
import { importMetadataFieldsFromXML } from "~/metadata/commonObjects/metadataField/importFromXML"
import { importMetadataItemLinksFromXML } from "~/metadata/commonObjects/metadataRef/importFromXML"
import { importMetadataTabularSectionsFromXML } from "~/metadata/commonObjects/metadataTabularSection/importFromXML"
import { importStandardAttributeDescriptionsFromXML } from "~/metadata/commonObjects/standardAttributeDescription/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { compactObject } from "~/metadata/helpers/compactObject"

export const importMetadataDocumentFromXML = (
  context: ConfigurationContext,
  xml: MetadataDocumentXML | undefined
): MetadataDocument | undefined => {
  if (!xml) return undefined

  return compactObject({
    actionsWritingOnPost: xml.ActionsWritingOnPost,
    additionalIndexes: importAdditionalIndexesFromXML(context, xml.AdditionalIndexes),
    attributes: importMetadataAttributesFromXML(context, xml.Attributes),
    autonumbering: xml.Autonumbering,
    auxiliaryChoiceForm: xml.AuxiliaryChoiceForm,
    auxiliaryListForm: xml.AuxiliaryListForm,
    auxiliaryObjectForm: xml.AuxiliaryObjectForm,
    basedOn: importMetadataItemLinksFromXML(context, xml.BasedOn),
    characteristics: importCharacteristicsDescriptionsFromXML(context, xml.Characteristics),
    checkUnique: xml.CheckUnique,
    choiceDataGetModeOnInputByString: xml.ChoiceDataGetModeOnInputByString,
    choiceHistoryOnInput: xml.ChoiceHistoryOnInput,
    commands: importMetadataCommandsFromXML(context, xml.Commands),
    comment: xml.Comment,
    createOnInput: xml.CreateOnInput,
    dataHistory: xml.DataHistory,
    dataLockControlMode: xml.DataLockControlMode,
    dataLockFields: importMetadataFieldsFromXML(context, xml.DataLockFields),
    defaultChoiceForm: xml.DefaultChoiceForm,
    defaultListForm: xml.DefaultListForm,
    defaultObjectForm: xml.DefaultObjectForm,
    executeAfterWriteDataHistoryVersionProcessing: xml.ExecuteAfterWriteDataHistoryVersionProcessing,
    explanation: importI8nTextFromXML(context, xml.Explanation),
    extendedListPresentation: importI8nTextFromXML(context, xml.ExtendedListPresentation),
    extendedObjectPresentation: importI8nTextFromXML(context, xml.ExtendedObjectPresentation),
    fullTextSearch: xml.FullTextSearch,
    fullTextSearchOnInputByString: xml.FullTextSearchOnInputByString,
    includeHelpInContents: xml.IncludeHelpInContents,
    inputByString: importMetadataFieldsFromXML(context, xml.InputByString),
    listPresentation: importI8nTextFromXML(context, xml.ListPresentation),
    name: xml.Name!,
    numberAllowedLength: xml.NumberAllowedLength,
    numberLength: xml.NumberLength,
    numberPeriodicity: xml.NumberPeriodicity,
    numberType: xml.NumberType,
    numerator: importMetadataDocumentNumeratorFromXML(context, xml.Numerator),
    objectBelonging: xml.ObjectBelonging,
    objectPresentation: importI8nTextFromXML(context, xml.ObjectPresentation),
    posting: xml.Posting,
    privilegedPostingMode: xml.PrivilegedPostingMode,
    privilegedUnpostingMode: xml.PrivilegedUnpostingMode,
    realTimePosting: xml.RealTimePosting,
    registerRecords: importMetadataItemLinksFromXML(context, xml.RegisterRecords),
    registerRecordsDeletion: xml.RegisterRecordsDeletion,
    searchStringModeOnInputByString: xml.SearchStringModeOnInputByString,
    sequenceFilling: xml.SequenceFilling,
    standardAttributes: importStandardAttributeDescriptionsFromXML(context, xml.StandardAttributes),
    synonym: importI8nTextFromXML(context, xml.Synonym),
    tabularSections: importMetadataTabularSectionsFromXML(context, xml.TabularSections),
    updateDataHistoryImmediatelyAfterWrite: xml.UpdateDataHistoryImmediatelyAfterWrite,
    useStandardCommands: xml.UseStandardCommands,
  })
}
