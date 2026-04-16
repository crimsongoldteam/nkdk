import { importMetadataCommandsFromXML } from "~/metadata/appliedObjects/metadataCommand/fromXML"
import { MetadataDocument, MetadataDocumentXML } from "~/metadata/appliedObjects/metadataDocument/types"
import { importMetadataDocumentNumeratorFromXML } from "~/metadata/appliedObjects/metadataDocumentNumerator/fromXML"
import { importAdditionalIndexesFromXML } from "~/metadata/commonObjects/additionalIndex/fromXML"
import { importCharacteristicsDescriptionsFromXML } from "~/metadata/commonObjects/characteristicsDescription/fromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/fromXML"
import { importMetadataAttributesFromXML } from "~/metadata/commonObjects/metadataAttribute/register"
import { importMetadataFieldsFromXML } from "~/metadata/commonObjects/metadataField/fromXML"
import { importMetadataItemLinksFromXML } from "~/metadata/commonObjects/metadataRef/fromXML"
import { importMetadataTabularSectionsFromXML } from "~/metadata/commonObjects/metadataTabularSection/register"
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"

export const importMetadataDocumentFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: MetadataDocumentXML | undefined
): MetadataDocument | undefined => {
  if (!xml) return undefined

  const result: MetadataDocument = {} as MetadataDocument

  if (xml.ActionsWritingOnPost !== undefined) result.actionsWritingOnPost = xml.ActionsWritingOnPost

  const additionalIndexes = importAdditionalIndexesFromXML(context, undefined, xml.AdditionalIndexes)
  if (additionalIndexes !== undefined) result.additionalIndexes = additionalIndexes

  const attributes = importMetadataAttributesFromXML(context, undefined, xml.Attributes)
  if (attributes !== undefined) result.attributes = attributes

  if (xml.Autonumbering !== undefined) result.autonumbering = xml.Autonumbering

  if (xml.AuxiliaryChoiceForm !== undefined) result.auxiliaryChoiceForm = xml.AuxiliaryChoiceForm

  if (xml.AuxiliaryListForm !== undefined) result.auxiliaryListForm = xml.AuxiliaryListForm

  if (xml.AuxiliaryObjectForm !== undefined) result.auxiliaryObjectForm = xml.AuxiliaryObjectForm

  const basedOn = importMetadataItemLinksFromXML(context, undefined, xml.BasedOn)
  if (basedOn !== undefined) result.basedOn = basedOn

  const characteristics = importCharacteristicsDescriptionsFromXML(context, undefined, xml.Characteristics)
  if (characteristics !== undefined) result.characteristics = characteristics

  if (xml.CheckUnique !== undefined) result.checkUnique = xml.CheckUnique

  if (xml.ChoiceDataGetModeOnInputByString !== undefined)
    result.choiceDataGetModeOnInputByString = xml.ChoiceDataGetModeOnInputByString

  if (xml.ChoiceHistoryOnInput !== undefined) result.choiceHistoryOnInput = xml.ChoiceHistoryOnInput

  const commands = importMetadataCommandsFromXML(context, { type: "MetadataCommands" }, xml.Commands)
  if (commands !== undefined) result.commands = commands

  if (xml.Comment !== undefined) result.comment = xml.Comment

  if (xml.CreateOnInput !== undefined) result.createOnInput = xml.CreateOnInput

  if (xml.DataHistory !== undefined) result.dataHistory = xml.DataHistory

  if (xml.DataLockControlMode !== undefined) result.dataLockControlMode = xml.DataLockControlMode

  const dataLockFields = importMetadataFieldsFromXML(context, undefined, xml.DataLockFields)
  if (dataLockFields !== undefined) result.dataLockFields = dataLockFields

  if (xml.DefaultChoiceForm !== undefined) result.defaultChoiceForm = xml.DefaultChoiceForm

  if (xml.DefaultListForm !== undefined) result.defaultListForm = xml.DefaultListForm

  if (xml.DefaultObjectForm !== undefined) result.defaultObjectForm = xml.DefaultObjectForm

  if (xml.ExecuteAfterWriteDataHistoryVersionProcessing !== undefined)
    result.executeAfterWriteDataHistoryVersionProcessing = xml.ExecuteAfterWriteDataHistoryVersionProcessing

  const explanation = importI8nTextFromXML(context, { type: "I8nText" }, xml.Explanation)
  if (explanation !== undefined) result.explanation = explanation

  const extendedListPresentation = importI8nTextFromXML(context, { type: "I8nText" }, xml.ExtendedListPresentation)
  if (extendedListPresentation !== undefined) result.extendedListPresentation = extendedListPresentation

  const extendedObjectPresentation = importI8nTextFromXML(context, { type: "I8nText" }, xml.ExtendedObjectPresentation)
  if (extendedObjectPresentation !== undefined) result.extendedObjectPresentation = extendedObjectPresentation

  if (xml.FullTextSearch !== undefined) result.fullTextSearch = xml.FullTextSearch

  if (xml.FullTextSearchOnInputByString !== undefined)
    result.fullTextSearchOnInputByString = xml.FullTextSearchOnInputByString

  if (xml.IncludeHelpInContents !== undefined) result.includeHelpInContents = xml.IncludeHelpInContents

  const inputByString = importMetadataFieldsFromXML(context, undefined, xml.InputByString)
  if (inputByString !== undefined) result.inputByString = inputByString

  const listPresentation = importI8nTextFromXML(context, { type: "I8nText" }, xml.ListPresentation)
  if (listPresentation !== undefined) result.listPresentation = listPresentation

  if (xml.Name !== undefined) result.name = xml.Name

  if (xml.NumberAllowedLength !== undefined) result.numberAllowedLength = xml.NumberAllowedLength

  if (xml.NumberLength !== undefined) result.numberLength = xml.NumberLength

  if (xml.NumberPeriodicity !== undefined) result.numberPeriodicity = xml.NumberPeriodicity

  if (xml.NumberType !== undefined) result.numberType = xml.NumberType

  const numerator = importMetadataDocumentNumeratorFromXML(context, xml.Numerator)
  if (numerator !== undefined) result.numerator = numerator

  if (xml.ObjectBelonging !== undefined) result.objectBelonging = xml.ObjectBelonging

  const objectPresentation = importI8nTextFromXML(context, { type: "I8nText" }, xml.ObjectPresentation)
  if (objectPresentation !== undefined) result.objectPresentation = objectPresentation

  if (xml.Posting !== undefined) result.posting = xml.Posting

  if (xml.PrivilegedPostingMode !== undefined) result.privilegedPostingMode = xml.PrivilegedPostingMode

  if (xml.PrivilegedUnpostingMode !== undefined) result.privilegedUnpostingMode = xml.PrivilegedUnpostingMode

  if (xml.RealTimePosting !== undefined) result.realTimePosting = xml.RealTimePosting

  const registerRecords = importMetadataItemLinksFromXML(context, undefined, xml.RegisterRecords)
  if (registerRecords !== undefined) result.registerRecords = registerRecords

  if (xml.RegisterRecordsDeletion !== undefined) result.registerRecordsDeletion = xml.RegisterRecordsDeletion

  if (xml.SearchStringModeOnInputByString !== undefined)
    result.searchStringModeOnInputByString = xml.SearchStringModeOnInputByString

  if (xml.SequenceFilling !== undefined) result.sequenceFilling = xml.SequenceFilling

  // const standardAttributes = importStandardAttributeDescriptionsFromXML(context, undefined, xml.StandardAttributes)
  // if (standardAttributes !== undefined) result.standardAttributes = standardAttributes

  const synonym = importI8nTextFromXML(context, { type: "I8nText" }, xml.Synonym)
  if (synonym !== undefined) result.synonym = synonym

  const tabularSections = importMetadataTabularSectionsFromXML(context, undefined, xml.TabularSections)
  if (tabularSections !== undefined) result.tabularSections = tabularSections

  if (xml.UpdateDataHistoryImmediatelyAfterWrite !== undefined)
    result.updateDataHistoryImmediatelyAfterWrite = xml.UpdateDataHistoryImmediatelyAfterWrite

  if (xml.UseStandardCommands !== undefined) result.useStandardCommands = xml.UseStandardCommands

  return result
}
