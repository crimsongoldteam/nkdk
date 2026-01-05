import { MetadataCatalog, MetadataCatalogEnterprise } from "~/metadata/appliedObjects/metadataCatalog/types"
import { importMetadataCommandsFromEnterprise } from "~/metadata/appliedObjects/metadataCommand/importFromEnterprise"
import { importAdditionalIndexesFromEnterprise } from "~/metadata/commonObjects/additionalIndex/importFromEnterprise"
import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importCharacteristicsDescriptionsFromEnterprise } from "~/metadata/commonObjects/characteristicsDescription/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importMetadataAttributesFromEnterprise } from "~/metadata/commonObjects/metadataAttribute/importFromEnterprise"
import { importMetadataFieldsFromEnterprise } from "~/metadata/commonObjects/metadataField/importFromEnterprise"
import { importMetadataItemLinksFromEnterprise } from "~/metadata/commonObjects/metadataRef/importFromEnterprise"
import { importMetadataTabularSectionsFromEnterprise } from "~/metadata/commonObjects/metadataTabularSection/importFromEnterprise"
import { importPredefinedItemsFromEnterprise } from "~/metadata/commonObjects/predifined/importFromEnterprise"
import { importStandardAttributeDescriptionsFromEnterprise } from "~/metadata/commonObjects/standardAttributeDescription/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { getDefaults } from "./defaults"

export const importMetadataCatalogFromEnterprise = (
  context: ConfigurationContext,
  data: MetadataCatalogEnterprise | undefined,
  name: string
): MetadataCatalog | undefined => {
  if (!data) return undefined

  const result: MetadataCatalog = {
    name,
  }

  const synonym = importI8nTextFromEnterprise(context, data.Синоним)
  if (synonym !== undefined) result.synonym = synonym

  if (data.Комментарий !== undefined) result.comment = data.Комментарий

  const hierarchical = importBooleanFromEnterprise(context, data.Иерархический)
  if (hierarchical !== undefined) result.hierarchical = hierarchical

  const hierarchyType = importSystemEnumerationFromEnterprise<SE.HierarchyType>(
    context,
    data.ВидИерархии,
    SE.HierarchyTypeFromEnterprise
  )
  if (hierarchyType !== undefined) result.hierarchyType = hierarchyType

  const autonumbering = importBooleanFromEnterprise(context, data.Автонумерация)
  if (autonumbering !== undefined) result.autonumbering = autonumbering

  const quickChoice = importBooleanFromEnterprise(context, data.БыстрыйВыбор)
  if (quickChoice !== undefined) result.quickChoice = quickChoice

  const basedOn = importMetadataItemLinksFromEnterprise(context, data.ВводитсяНаОсновании)
  if (basedOn !== undefined) result.basedOn = basedOn

  const inputByString = importMetadataFieldsFromEnterprise(context, data.ВводПоСтроке)
  if (inputByString !== undefined) result.inputByString = inputByString

  const includeHelpInContents = importBooleanFromEnterprise(context, data.ВключатьСправкуВСодержание)
  if (includeHelpInContents !== undefined) result.includeHelpInContents = includeHelpInContents

  const owners = importMetadataItemLinksFromEnterprise(context, data.Владельцы)
  if (owners !== undefined) result.owners = owners

  const executeAfterWriteDataHistoryVersionProcessing = importBooleanFromEnterprise(
    context,
    data.ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных
  )
  if (executeAfterWriteDataHistoryVersionProcessing !== undefined)
    result.executeAfterWriteDataHistoryVersionProcessing = executeAfterWriteDataHistoryVersionProcessing

  const foldersOnTop = importBooleanFromEnterprise(context, data.ГруппыСверху)
  if (foldersOnTop !== undefined) result.foldersOnTop = foldersOnTop

  if (data.ДлинаКода !== undefined) result.codeLength = data.ДлинаКода

  if (data.ДлинаНаименования !== undefined) result.descriptionLength = data.ДлинаНаименования

  if (data.ДополнительнаяФормаГруппы !== undefined) result.auxiliaryFolderForm = data.ДополнительнаяФормаГруппы

  if (data.ДополнительнаяФормаДляВыбора !== undefined) result.auxiliaryChoiceForm = data.ДополнительнаяФормаДляВыбора

  if (data.ДополнительнаяФормаДляВыбораГруппы !== undefined)
    result.auxiliaryFolderChoiceForm = data.ДополнительнаяФормаДляВыбораГруппы

  if (data.ДополнительнаяФормаОбъекта !== undefined) result.auxiliaryObjectForm = data.ДополнительнаяФормаОбъекта

  if (data.ДополнительнаяФормаСписка !== undefined) result.auxiliaryListForm = data.ДополнительнаяФормаСписка

  const additionalIndexes = importAdditionalIndexesFromEnterprise(context, data.ДополнительныеИндексы)
  if (additionalIndexes !== undefined) result.additionalIndexes = additionalIndexes

  const codeAllowedLength = importSystemEnumerationFromEnterprise<SE.AllowedLength>(
    context,
    data.ДопустимаяДлинаКода,
    SE.AllowedLengthFromEnterprise
  )
  if (codeAllowedLength !== undefined) result.codeAllowedLength = codeAllowedLength

  const subordinationUse = importSystemEnumerationFromEnterprise<SE.SubordinationUse>(
    context,
    data.ИспользованиеПодчинения,
    SE.SubordinationUseFromEnterprise
  )
  if (subordinationUse !== undefined) result.subordinationUse = subordinationUse

  const useStandardCommands = importBooleanFromEnterprise(context, data.ИспользоватьСтандартныеКоманды)
  if (useStandardCommands !== undefined) result.useStandardCommands = useStandardCommands

  const choiceHistoryOnInput = importSystemEnumerationFromEnterprise<SE.ChoiceHistoryOnInput>(
    context,
    data.ИсторияВыбораПриВводе,
    SE.ChoiceHistoryOnInputFromEnterprise
  )
  if (choiceHistoryOnInput !== undefined) result.choiceHistoryOnInput = choiceHistoryOnInput

  const dataHistory = importSystemEnumerationFromEnterprise<SE.DataHistoryUse>(
    context,
    data.ИсторияДанных,
    SE.DataHistoryUseFromEnterprise
  )
  if (dataHistory !== undefined) result.dataHistory = dataHistory

  if (data.КоличествоУровней !== undefined) result.levelCount = data.КоличествоУровней

  const checkUnique = importBooleanFromEnterprise(context, data.КонтрольУникальности)
  if (checkUnique !== undefined) result.checkUnique = checkUnique

  const predefinedDataUpdate = importSystemEnumerationFromEnterprise<SE.PredefinedDataUpdate>(
    context,
    data.ОбновлениеПредопределенныхДанных,
    SE.PredefinedDataUpdateFromEnterprise
  )
  if (predefinedDataUpdate !== undefined) result.predefinedDataUpdate = predefinedDataUpdate

  const updateDataHistoryImmediatelyAfterWrite = importBooleanFromEnterprise(
    context,
    data.ОбновлятьИсториюДанныхСразуПослеЗаписи
  )
  if (updateDataHistoryImmediatelyAfterWrite !== undefined)
    result.updateDataHistoryImmediatelyAfterWrite = updateDataHistoryImmediatelyAfterWrite

  const limitLevelCount = importBooleanFromEnterprise(context, data.ОграничиватьКоличествоУровней)
  if (limitLevelCount !== undefined) result.limitLevelCount = limitLevelCount

  if (data.ОсновнаяФормаГруппы !== undefined) result.defaultFolderForm = data.ОсновнаяФормаГруппы

  if (data.ОсновнаяФормаДляВыбора !== undefined) result.defaultChoiceForm = data.ОсновнаяФормаДляВыбора

  if (data.ОсновнаяФормаДляВыбораГруппы !== undefined)
    result.defaultFolderChoiceForm = data.ОсновнаяФормаДляВыбораГруппы

  if (data.ОсновнаяФормаОбъекта !== undefined) result.defaultObjectForm = data.ОсновнаяФормаОбъекта

  if (data.ОсновнаяФормаСписка !== undefined) result.defaultListForm = data.ОсновнаяФормаСписка

  const defaultPresentation = importSystemEnumerationFromEnterprise<SE.CatalogMainPresentation>(
    context,
    data.ОсновноеПредставление,
    SE.CatalogMainPresentationFromEnterprise
  )
  if (defaultPresentation !== undefined) result.defaultPresentation = defaultPresentation

  const fullTextSearch = importSystemEnumerationFromEnterprise<SE.UseFullTextSearch>(
    context,
    data.ПолнотекстовыйПоиск,
    SE.UseFullTextSearchFromEnterprise
  )
  if (fullTextSearch !== undefined) result.fullTextSearch = fullTextSearch

  const fullTextSearchOnInputByString = importSystemEnumerationFromEnterprise<SE.FullTextSearchOnInputByString>(
    context,
    data.ПолнотекстовыйПоискПриВводеПоСтроке,
    SE.FullTextSearchOnInputByStringFromEnterprise
  )
  if (fullTextSearchOnInputByString !== undefined) result.fullTextSearchOnInputByString = fullTextSearchOnInputByString

  const dataLockFields = importMetadataFieldsFromEnterprise(context, data.ПоляБлокировкиДанных)
  if (dataLockFields !== undefined) result.dataLockFields = dataLockFields

  const explanation = importI8nTextFromEnterprise(context, data.Пояснение)
  if (explanation !== undefined) result.explanation = explanation

  const predefined = importPredefinedItemsFromEnterprise(context, data.Предопределенные)
  if (predefined !== undefined) result.predefined = predefined

  const objectPresentation = importI8nTextFromEnterprise(context, data.ПредставлениеОбъекта)
  if (objectPresentation !== undefined) result.objectPresentation = objectPresentation

  const listPresentation = importI8nTextFromEnterprise(context, data.ПредставлениеСписка)
  if (listPresentation !== undefined) result.listPresentation = listPresentation

  const objectBelonging = importSystemEnumerationFromEnterprise<SE.ObjectBelonging>(
    context,
    data.ПринадлежностьОбъекта,
    SE.ObjectBelongingFromEnterprise
  )
  if (objectBelonging !== undefined) result.objectBelonging = objectBelonging

  const extendedObjectPresentation = importI8nTextFromEnterprise(context, data.РасширенноеПредставлениеОбъекта)
  if (extendedObjectPresentation !== undefined) result.extendedObjectPresentation = extendedObjectPresentation

  const extendedListPresentation = importI8nTextFromEnterprise(context, data.РасширенноеПредставлениеСписка)
  if (extendedListPresentation !== undefined) result.extendedListPresentation = extendedListPresentation

  const choiceDataGetModeOnInputByString = importSystemEnumerationFromEnterprise<SE.ChoiceDataGetModeOnInputByString>(
    context,
    data.РежимПолученияДанныхВыбораПриВводеПоСтроке,
    SE.ChoiceDataGetModeOnInputByStringFromEnterprise
  )
  if (choiceDataGetModeOnInputByString !== undefined)
    result.choiceDataGetModeOnInputByString = choiceDataGetModeOnInputByString

  const dataLockControlMode = importSystemEnumerationFromEnterprise<SE.DefaultDataLockControlMode>(
    context,
    data.РежимУправленияБлокировкойДанных,
    SE.DefaultDataLockControlModeFromEnterprise
  )
  if (dataLockControlMode !== undefined) result.dataLockControlMode = dataLockControlMode

  const codeSeries = importSystemEnumerationFromEnterprise<SE.CatalogCodesSeries>(
    context,
    data.СерииКодов,
    SE.CatalogCodesSeriesFromEnterprise
  )
  if (codeSeries !== undefined) result.codeSeries = codeSeries

  const createOnInput = importSystemEnumerationFromEnterprise<SE.CreateOnInput>(
    context,
    data.СозданиеПриВводе,
    SE.CreateOnInputFromEnterprise
  )
  if (createOnInput !== undefined) result.createOnInput = createOnInput

  const choiceMode = importSystemEnumerationFromEnterprise<SE.ChoiceMode>(
    context,
    data.СпособВыбора,
    SE.ChoiceModeFromEnterprise
  )
  if (choiceMode !== undefined) result.choiceMode = choiceMode

  const searchStringModeOnInputByString = importSystemEnumerationFromEnterprise<SE.SearchStringModeOnInputByString>(
    context,
    data.СпособПоискаСтрокиПриВводеПоСтроке,
    SE.SearchStringModeOnInputByStringFromEnterprise
  )
  if (searchStringModeOnInputByString !== undefined)
    result.searchStringModeOnInputByString = searchStringModeOnInputByString

  const editType = importSystemEnumerationFromEnterprise<SE.EditType>(
    context,
    data.СпособРедактирования,
    SE.EditTypeFromEnterprise
  )
  if (editType !== undefined) result.editType = editType

  const standardAttributes = importStandardAttributeDescriptionsFromEnterprise(context, data.СтандартныеРеквизиты)
  if (standardAttributes !== undefined) result.standardAttributes = standardAttributes

  const codeType = importSystemEnumerationFromEnterprise<SE.CatalogCodeType>(
    context,
    data.ТипКода,
    SE.CatalogCodeTypeFromEnterprise
  )
  if (codeType !== undefined) result.codeType = codeType

  const characteristics = importCharacteristicsDescriptionsFromEnterprise(context, data.Характеристики)
  if (characteristics !== undefined) result.characteristics = characteristics

  const attributes = importMetadataAttributesFromEnterprise(context, data.Реквизиты)
  if (attributes !== undefined) result.attributes = attributes

  const tabularSections = importMetadataTabularSectionsFromEnterprise(context, data.ТабличныеЧасти)
  if (tabularSections !== undefined) result.tabularSections = tabularSections

  const commands = importMetadataCommandsFromEnterprise(context, data.Команды)
  if (commands !== undefined) result.commands = commands

  const defaults = getDefaults(result, context)
  return removeDefaults(result, defaults)
}
