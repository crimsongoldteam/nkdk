import { exportAdditionalIndexesToEnterprise } from "~/metadata/commonObjects/additionalIndex/exportToEnterprise"
import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportCharacteristicsDescriptionsToEnterprise } from "~/metadata/commonObjects/characteristicsDescription/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportMetadataAttributesToEnterprise } from "~/metadata/commonObjects/metadataAttribute/exportToEnterprise"
import { exportMetadataFieldsToEnterprise } from "~/metadata/commonObjects/metadataField/exportToEnterprise"
import { exportMetadataItemLinksToEnterprise } from "~/metadata/commonObjects/metadataRef/exportToEnterprise"
import { exportMetadataTabularSectionsToEnterprise } from "~/metadata/commonObjects/metadataTabularSection/exportToEnterprise"
import { exportPredefinedItemsToEnterprise } from "~/metadata/commonObjects/predifined/exportToEnterprise"
import { exportStandardAttributeDescriptionsToEnterprise } from "~/metadata/commonObjects/standardAttributeDescription/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportMetadataCommandsToEnterprise } from "../metadataCommand/exportToEnterprise"
import { MetadataCatalog, MetadataCatalogEnterprise } from "./types"

export const exportMetadataCatalogToEnterprise = (
  context: ConfigurationContext,
  data: MetadataCatalog | undefined
): MetadataCatalogEnterprise | undefined => {
  if (!data) return undefined

  const result: MetadataCatalogEnterprise = {}

  const autonumbering = exportBooleanToEnterprise(context, data.autonumbering)
  if (autonumbering !== undefined) result.Автонумерация = autonumbering

  const quickChoice = exportBooleanToEnterprise(context, data.quickChoice)
  if (quickChoice !== undefined) result.БыстрыйВыбор = quickChoice

  const basedOn = exportMetadataItemLinksToEnterprise(context, data.basedOn)
  if (basedOn !== undefined) result.ВводитсяНаОсновании = basedOn

  const inputByString = exportMetadataFieldsToEnterprise(context, data.inputByString)
  if (inputByString !== undefined) result.ВводПоСтроке = inputByString

  const hierarchyType = exportSystemEnumerationToYAML(context, data.hierarchyType, SE.HierarchyTypeToEnterprise)
  if (hierarchyType !== undefined) result.ВидИерархии = hierarchyType

  const includeHelpInContents = exportBooleanToEnterprise(context, data.includeHelpInContents)
  if (includeHelpInContents !== undefined) result.ВключатьСправкуВСодержание = includeHelpInContents

  const owners = exportMetadataItemLinksToEnterprise(context, data.owners)
  if (owners !== undefined) result.Владельцы = owners

  const executeAfterWriteDataHistoryVersionProcessing = exportBooleanToEnterprise(
    context,
    data.executeAfterWriteDataHistoryVersionProcessing
  )
  if (executeAfterWriteDataHistoryVersionProcessing !== undefined)
    result.ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных = executeAfterWriteDataHistoryVersionProcessing

  const foldersOnTop = exportBooleanToEnterprise(context, data.foldersOnTop)
  if (foldersOnTop !== undefined) result.ГруппыСверху = foldersOnTop

  if (data.codeLength !== undefined) result.ДлинаКода = data.codeLength

  if (data.descriptionLength !== undefined) result.ДлинаНаименования = data.descriptionLength

  if (data.auxiliaryFolderForm !== undefined) result.ДополнительнаяФормаГруппы = data.auxiliaryFolderForm

  if (data.auxiliaryChoiceForm !== undefined) result.ДополнительнаяФормаДляВыбора = data.auxiliaryChoiceForm

  if (data.auxiliaryFolderChoiceForm !== undefined)
    result.ДополнительнаяФормаДляВыбораГруппы = data.auxiliaryFolderChoiceForm

  if (data.auxiliaryObjectForm !== undefined) result.ДополнительнаяФормаОбъекта = data.auxiliaryObjectForm

  if (data.auxiliaryListForm !== undefined) result.ДополнительнаяФормаСписка = data.auxiliaryListForm

  const additionalIndexes = exportAdditionalIndexesToEnterprise(context, data.additionalIndexes)
  if (additionalIndexes !== undefined) result.ДополнительныеИндексы = additionalIndexes

  const codeAllowedLength = exportSystemEnumerationToYAML(context, data.codeAllowedLength, SE.AllowedLengthToEnterprise)
  if (codeAllowedLength !== undefined) result.ДопустимаяДлинаКода = codeAllowedLength

  const hierarchical = exportBooleanToEnterprise(context, data.hierarchical)
  if (hierarchical !== undefined) result.Иерархический = hierarchical

  const subordinationUse = exportSystemEnumerationToYAML(
    context,
    data.subordinationUse,
    SE.SubordinationUseToEnterprise
  )
  if (subordinationUse !== undefined) result.ИспользованиеПодчинения = subordinationUse

  const useStandardCommands = exportBooleanToEnterprise(context, data.useStandardCommands)
  if (useStandardCommands !== undefined) result.ИспользоватьСтандартныеКоманды = useStandardCommands

  const choiceHistoryOnInput = exportSystemEnumerationToYAML(
    context,
    data.choiceHistoryOnInput,
    SE.ChoiceHistoryOnInputToEnterprise
  )
  if (choiceHistoryOnInput !== undefined) result.ИсторияВыбораПриВводе = choiceHistoryOnInput

  const dataHistory = exportSystemEnumerationToYAML(context, data.dataHistory, SE.DataHistoryUseToEnterprise)
  if (dataHistory !== undefined) result.ИсторияДанных = dataHistory

  if (data.levelCount !== undefined) result.КоличествоУровней = data.levelCount

  if (data.comment !== undefined) result.Комментарий = data.comment

  const checkUnique = exportBooleanToEnterprise(context, data.checkUnique)
  if (checkUnique !== undefined) result.КонтрольУникальности = checkUnique

  const predefinedDataUpdate = exportSystemEnumerationToYAML(
    context,
    data.predefinedDataUpdate,
    SE.PredefinedDataUpdateToEnterprise
  )
  if (predefinedDataUpdate !== undefined) result.ОбновлениеПредопределенныхДанных = predefinedDataUpdate

  const updateDataHistoryImmediatelyAfterWrite = exportBooleanToEnterprise(
    context,
    data.updateDataHistoryImmediatelyAfterWrite
  )
  if (updateDataHistoryImmediatelyAfterWrite !== undefined)
    result.ОбновлятьИсториюДанныхСразуПослеЗаписи = updateDataHistoryImmediatelyAfterWrite

  const limitLevelCount = exportBooleanToEnterprise(context, data.limitLevelCount)
  if (limitLevelCount !== undefined) result.ОграничиватьКоличествоУровней = limitLevelCount

  if (data.defaultFolderForm !== undefined) result.ОсновнаяФормаГруппы = data.defaultFolderForm

  if (data.defaultChoiceForm !== undefined) result.ОсновнаяФормаДляВыбора = data.defaultChoiceForm

  if (data.defaultFolderChoiceForm !== undefined) result.ОсновнаяФормаДляВыбораГруппы = data.defaultFolderChoiceForm

  if (data.defaultObjectForm !== undefined) result.ОсновнаяФормаОбъекта = data.defaultObjectForm

  if (data.defaultListForm !== undefined) result.ОсновнаяФормаСписка = data.defaultListForm

  const defaultPresentation = exportSystemEnumerationToYAML(
    context,
    data.defaultPresentation,
    SE.CatalogMainPresentationToEnterprise
  )
  if (defaultPresentation !== undefined) result.ОсновноеПредставление = defaultPresentation

  const fullTextSearch = exportSystemEnumerationToYAML(context, data.fullTextSearch, SE.UseFullTextSearchToEnterprise)
  if (fullTextSearch !== undefined) result.ПолнотекстовыйПоиск = fullTextSearch

  const fullTextSearchOnInputByString = exportSystemEnumerationToYAML(
    context,
    data.fullTextSearchOnInputByString,
    SE.FullTextSearchOnInputByStringToEnterprise
  )
  if (fullTextSearchOnInputByString !== undefined)
    result.ПолнотекстовыйПоискПриВводеПоСтроке = fullTextSearchOnInputByString

  const dataLockFields = exportMetadataFieldsToEnterprise(context, data.dataLockFields)
  if (dataLockFields !== undefined) result.ПоляБлокировкиДанных = dataLockFields

  const explanation = exportI8nTextToEnterprise(context, data.explanation)
  if (explanation !== undefined) result.Пояснение = explanation

  const predefined = exportPredefinedItemsToEnterprise(context, data.predefined)
  if (predefined !== undefined) result.Предопределенные = predefined

  const objectPresentation = exportI8nTextToEnterprise(context, data.objectPresentation)
  if (objectPresentation !== undefined) result.ПредставлениеОбъекта = objectPresentation

  const listPresentation = exportI8nTextToEnterprise(context, data.listPresentation)
  if (listPresentation !== undefined) result.ПредставлениеСписка = listPresentation

  const objectBelonging = exportSystemEnumerationToYAML(context, data.objectBelonging, SE.ObjectBelongingToEnterprise)
  if (objectBelonging !== undefined) result.ПринадлежностьОбъекта = objectBelonging

  const extendedObjectPresentation = exportI8nTextToEnterprise(context, data.extendedObjectPresentation)
  if (extendedObjectPresentation !== undefined) result.РасширенноеПредставлениеОбъекта = extendedObjectPresentation

  const extendedListPresentation = exportI8nTextToEnterprise(context, data.extendedListPresentation)
  if (extendedListPresentation !== undefined) result.РасширенноеПредставлениеСписка = extendedListPresentation

  const choiceDataGetModeOnInputByString = exportSystemEnumerationToYAML(
    context,
    data.choiceDataGetModeOnInputByString,
    SE.ChoiceDataGetModeOnInputByStringToEnterprise
  )
  if (choiceDataGetModeOnInputByString !== undefined)
    result.РежимПолученияДанныхВыбораПриВводеПоСтроке = choiceDataGetModeOnInputByString

  const dataLockControlMode = exportSystemEnumerationToYAML(
    context,
    data.dataLockControlMode,
    SE.DefaultDataLockControlModeToEnterprise
  )
  if (dataLockControlMode !== undefined) result.РежимУправленияБлокировкойДанных = dataLockControlMode

  const codeSeries = exportSystemEnumerationToYAML(context, data.codeSeries, SE.CatalogCodesSeriesToEnterprise)
  if (codeSeries !== undefined) result.СерииКодов = codeSeries

  const synonym = exportI8nTextToEnterprise(context, data.synonym)
  if (synonym !== undefined) result.Синоним = synonym

  const createOnInput = exportSystemEnumerationToYAML(context, data.createOnInput, SE.CreateOnInputToEnterprise)
  if (createOnInput !== undefined) result.СозданиеПриВводе = createOnInput

  const choiceMode = exportSystemEnumerationToYAML(context, data.choiceMode, SE.ChoiceModeToEnterprise)
  if (choiceMode !== undefined) result.СпособВыбора = choiceMode

  const searchStringModeOnInputByString = exportSystemEnumerationToYAML(
    context,
    data.searchStringModeOnInputByString,
    SE.SearchStringModeOnInputByStringToEnterprise
  )
  if (searchStringModeOnInputByString !== undefined)
    result.СпособПоискаСтрокиПриВводеПоСтроке = searchStringModeOnInputByString

  const editType = exportSystemEnumerationToYAML(context, data.editType, SE.EditTypeToEnterprise)
  if (editType !== undefined) result.СпособРедактирования = editType

  const standardAttributes = exportStandardAttributeDescriptionsToEnterprise(context, data.standardAttributes)
  if (standardAttributes !== undefined) result.СтандартныеРеквизиты = standardAttributes

  const codeType = exportSystemEnumerationToYAML(context, data.codeType, SE.CatalogCodeTypeToEnterprise)
  if (codeType !== undefined) result.ТипКода = codeType

  const characteristics = exportCharacteristicsDescriptionsToEnterprise(context, data.characteristics)
  if (characteristics !== undefined) result.Характеристики = characteristics

  const attributes = exportMetadataAttributesToEnterprise(context, data.attributes)
  if (attributes !== undefined) result.Реквизиты = attributes

  const tabularSections = exportMetadataTabularSectionsToEnterprise(context, data.tabularSections)
  if (tabularSections !== undefined) result.ТабличныеЧасти = tabularSections

  const commands = exportMetadataCommandsToEnterprise(context, data.commands)
  if (commands !== undefined) result.Команды = commands

  return result
}
