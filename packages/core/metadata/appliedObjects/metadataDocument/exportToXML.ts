import { exportAdditionalIndexesToXML } from "~/metadata/commonObjects/additionalIndex/exportToXML"
import { exportCharacteristicsDescriptionsToXML } from "~/metadata/commonObjects/characteristicsDescription/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportMetadataAttributesToXML } from "~/metadata/commonObjects/metadataAttribute/exportToXML"
import { exportMetadataFieldsToXML } from "~/metadata/commonObjects/metadataField/exportToXML"
import { exportMetadataItemLinksToXML } from "~/metadata/commonObjects/metadataRef/exportToXML"
import { exportMetadataTabularSectionsToXML } from "~/metadata/commonObjects/metadataTabularSection/exportToXML"
import { exportStandardAttributeDescriptionsToXML } from "~/metadata/commonObjects/standardAttributeDescription/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportMetadataCommandsToXML } from "../metadataCommand/exportToXML"
import { exportMetadataDocumentNumeratorToXML } from "../metadataDocumentNumerator/exportToXML"
import { MetadataDocument, MetadataDocumentXML } from "./types"

export const exportMetadataDocumentToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataDocument | undefined
): MetadataDocumentXML | undefined => {
  if (!data) return undefined

  const result: MetadataDocumentXML = {} as MetadataDocumentXML

  if (data.actionsWritingOnPost !== undefined) result.ActionsWritingOnPost = data.actionsWritingOnPost

  const additionalIndexes = exportAdditionalIndexesToXML(context, undefined, data.additionalIndexes)
  if (additionalIndexes !== undefined) result.AdditionalIndexes = additionalIndexes

  const attributes = exportMetadataAttributesToXML(context, undefined, data.attributes)
  if (attributes !== undefined) result.Attributes = attributes

  if (data.autonumbering !== undefined) result.Autonumbering = data.autonumbering

  if (data.auxiliaryChoiceForm !== undefined) result.AuxiliaryChoiceForm = data.auxiliaryChoiceForm

  if (data.auxiliaryListForm !== undefined) result.AuxiliaryListForm = data.auxiliaryListForm

  if (data.auxiliaryObjectForm !== undefined) result.AuxiliaryObjectForm = data.auxiliaryObjectForm

  const basedOn = exportMetadataItemLinksToXML(context, undefined, data.basedOn)
  if (basedOn !== undefined) result.BasedOn = basedOn

  const characteristics = exportCharacteristicsDescriptionsToXML(context, undefined, data.characteristics)
  if (characteristics !== undefined) result.Characteristics = characteristics

  if (data.checkUnique !== undefined) result.CheckUnique = data.checkUnique

  if (data.choiceDataGetModeOnInputByString !== undefined)
    result.ChoiceDataGetModeOnInputByString = data.choiceDataGetModeOnInputByString

  if (data.choiceHistoryOnInput !== undefined) result.ChoiceHistoryOnInput = data.choiceHistoryOnInput

  const commands = exportMetadataCommandsToXML(context, undefined, data.commands)
  if (commands !== undefined) result.Commands = commands

  if (data.comment !== undefined) result.Comment = data.comment

  if (data.createOnInput !== undefined) result.CreateOnInput = data.createOnInput

  if (data.dataHistory !== undefined) result.DataHistory = data.dataHistory

  if (data.dataLockControlMode !== undefined) result.DataLockControlMode = data.dataLockControlMode

  const dataLockFields = exportMetadataFieldsToXML(context, undefined, data.dataLockFields)
  if (dataLockFields !== undefined) result.DataLockFields = dataLockFields

  if (data.defaultChoiceForm !== undefined) result.DefaultChoiceForm = data.defaultChoiceForm

  if (data.defaultListForm !== undefined) result.DefaultListForm = data.defaultListForm

  if (data.defaultObjectForm !== undefined) result.DefaultObjectForm = data.defaultObjectForm

  if (data.executeAfterWriteDataHistoryVersionProcessing !== undefined)
    result.ExecuteAfterWriteDataHistoryVersionProcessing = data.executeAfterWriteDataHistoryVersionProcessing

  const explanation = exportI8nTextToXML(context, undefined, data.explanation)
  if (explanation !== undefined) result.Explanation = explanation

  const extendedListPresentation = exportI8nTextToXML(context, undefined, data.extendedListPresentation)
  if (extendedListPresentation !== undefined) result.ExtendedListPresentation = extendedListPresentation

  const extendedObjectPresentation = exportI8nTextToXML(context, undefined, data.extendedObjectPresentation)
  if (extendedObjectPresentation !== undefined) result.ExtendedObjectPresentation = extendedObjectPresentation

  if (data.fullTextSearch !== undefined) result.FullTextSearch = data.fullTextSearch

  if (data.fullTextSearchOnInputByString !== undefined)
    result.FullTextSearchOnInputByString = data.fullTextSearchOnInputByString

  if (data.includeHelpInContents !== undefined) result.IncludeHelpInContents = data.includeHelpInContents

  const inputByString = exportMetadataFieldsToXML(context, undefined, data.inputByString)
  if (inputByString !== undefined) result.InputByString = inputByString

  const listPresentation = exportI8nTextToXML(context, undefined, data.listPresentation)
  if (listPresentation !== undefined) result.ListPresentation = listPresentation

  if (data.name !== undefined) result.Name = data.name

  if (data.numberAllowedLength !== undefined) result.NumberAllowedLength = data.numberAllowedLength

  if (data.numberLength !== undefined) result.NumberLength = data.numberLength

  if (data.numberPeriodicity !== undefined) result.NumberPeriodicity = data.numberPeriodicity

  if (data.numberType !== undefined) result.NumberType = data.numberType

  const numerator = exportMetadataDocumentNumeratorToXML(context, undefined, data.numerator)
  if (numerator !== undefined) result.Numerator = numerator

  if (data.objectBelonging !== undefined) result.ObjectBelonging = data.objectBelonging

  const objectPresentation = exportI8nTextToXML(context, undefined, data.objectPresentation)
  if (objectPresentation !== undefined) result.ObjectPresentation = objectPresentation

  if (data.posting !== undefined) result.Posting = data.posting

  if (data.privilegedPostingMode !== undefined) result.PrivilegedPostingMode = data.privilegedPostingMode

  if (data.privilegedUnpostingMode !== undefined) result.PrivilegedUnpostingMode = data.privilegedUnpostingMode

  if (data.realTimePosting !== undefined) result.RealTimePosting = data.realTimePosting

  const registerRecords = exportMetadataItemLinksToXML(context, undefined, data.registerRecords)
  if (registerRecords !== undefined) result.RegisterRecords = registerRecords

  if (data.registerRecordsDeletion !== undefined) result.RegisterRecordsDeletion = data.registerRecordsDeletion

  if (data.searchStringModeOnInputByString !== undefined)
    result.SearchStringModeOnInputByString = data.searchStringModeOnInputByString

  if (data.sequenceFilling !== undefined) result.SequenceFilling = data.sequenceFilling

  const standardAttributes = exportStandardAttributeDescriptionsToXML(context, undefined, data.standardAttributes, [
    "Ref",
  ])
  if (standardAttributes !== undefined) result.StandardAttributes = standardAttributes

  const synonym = exportI8nTextToXML(context, undefined, data.synonym)
  if (synonym !== undefined) result.Synonym = synonym

  const tabularSections = exportMetadataTabularSectionsToXML(context, undefined, data.tabularSections)
  if (tabularSections !== undefined) result.TabularSections = tabularSections

  if (data.updateDataHistoryImmediatelyAfterWrite !== undefined)
    result.UpdateDataHistoryImmediatelyAfterWrite = data.updateDataHistoryImmediatelyAfterWrite

  if (data.useStandardCommands !== undefined) result.UseStandardCommands = data.useStandardCommands

  return result
}
