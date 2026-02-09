import { exportAdditionalIndexesToEnterprise } from "~/metadata/commonObjects/additionalIndex/exportToEnterprise"
import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportCharacteristicsDescriptionsToEnterprise } from "~/metadata/commonObjects/characteristicsDescription/exportToEnterprise"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
import { exportMetadataAttributesToEnterprise } from "~/metadata/commonObjects/metadataAttribute/exportToEnterprise"
import { exportMetadataFieldsToEnterprise } from "~/metadata/commonObjects/metadataField/exportToEnterprise"
import { exportMetadataItemLinksToEnterprise } from "~/metadata/commonObjects/metadataRef/exportToEnterprise"
import { exportMetadataTabularSectionsToEnterprise } from "~/metadata/commonObjects/metadataTabularSection/exportToEnterprise"
import { exportPredefinedItemsToEnterprise } from "~/metadata/commonObjects/predifined/exportToEnterprise"
import { exportStandardAttributeDescriptionsToEnterprise } from "~/metadata/commonObjects/standardAttributeDescription/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportMetadataCommandsToEnterprise } from "../metadataCommand/exportToEnterprise"
import { MetadataCatalog, MetadataCatalogEnterprise } from "./types"

export const exportMetadataCatalogToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: MetadataCatalog | undefined
): MetadataCatalogEnterprise | undefined => {
  if (!data) return undefined

  const result: MetadataCatalogEnterprise = {}

  const autonumbering = exportBooleanToEnterprise(context, undefined, data.autonumbering)
  if (autonumbering !== undefined) result.Автонумерация = autonumbering

  const quickChoice = exportBooleanToEnterprise(context, undefined, data.quickChoice)
  if (quickChoice !== undefined) result.БыстрыйВыбор = quickChoice

  const basedOn = exportMetadataItemLinksToEnterprise(context, undefined, data.basedOn)
  if (basedOn !== undefined) result.ВводитсяНаОсновании = basedOn

  const inputByString = exportMetadataFieldsToEnterprise(context, undefined, data.inputByString)
  if (inputByString !== undefined) result.ВводПоСтроке = inputByString

  const hierarchyType = exportSystemEnumerationToYAML<SE.HierarchyTypeEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "HierarchyType" },
    data.hierarchyType
  )
  if (hierarchyType !== undefined) result.ВидИерархии = hierarchyType

  const includeHelpInContents = exportBooleanToEnterprise(context, undefined, data.includeHelpInContents)
  if (includeHelpInContents !== undefined) result.ВключатьСправкуВСодержание = includeHelpInContents

  const owners = exportMetadataItemLinksToEnterprise(context, undefined, data.owners)
  if (owners !== undefined) result.Владельцы = owners

  const executeAfterWriteDataHistoryVersionProcessing = exportBooleanToEnterprise(
    context,
    undefined,
    data.executeAfterWriteDataHistoryVersionProcessing
  )
  if (executeAfterWriteDataHistoryVersionProcessing !== undefined)
    result.ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных = executeAfterWriteDataHistoryVersionProcessing

  const foldersOnTop = exportBooleanToEnterprise(context, undefined, data.foldersOnTop)
  if (foldersOnTop !== undefined) result.ГруппыСверху = foldersOnTop

  if (data.codeLength !== undefined) result.ДлинаКода = data.codeLength

  if (data.descriptionLength !== undefined) result.ДлинаНаименования = data.descriptionLength

  if (data.auxiliaryFolderForm !== undefined) result.ДополнительнаяФормаГруппы = data.auxiliaryFolderForm

  if (data.auxiliaryChoiceForm !== undefined) result.ДополнительнаяФормаДляВыбора = data.auxiliaryChoiceForm

  if (data.auxiliaryFolderChoiceForm !== undefined)
    result.ДополнительнаяФормаДляВыбораГруппы = data.auxiliaryFolderChoiceForm

  if (data.auxiliaryObjectForm !== undefined) result.ДополнительнаяФормаОбъекта = data.auxiliaryObjectForm

  if (data.auxiliaryListForm !== undefined) result.ДополнительнаяФормаСписка = data.auxiliaryListForm

  const additionalIndexes = exportAdditionalIndexesToEnterprise(context, undefined, data.additionalIndexes)
  if (additionalIndexes !== undefined) result.ДополнительныеИндексы = additionalIndexes

  const codeAllowedLength = exportSystemEnumerationToYAML<SE.AllowedLengthEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "AllowedLength" },
    data.codeAllowedLength
  )
  if (codeAllowedLength !== undefined) result.ДопустимаяДлинаКода = codeAllowedLength

  const hierarchical = exportBooleanToEnterprise(context, undefined, data.hierarchical)
  if (hierarchical !== undefined) result.Иерархический = hierarchical

  const subordinationUse = exportSystemEnumerationToYAML<SE.SubordinationUseEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "SubordinationUse" },
    data.subordinationUse
  )
  if (subordinationUse !== undefined) result.ИспользованиеПодчинения = subordinationUse

  const useStandardCommands = exportBooleanToEnterprise(context, undefined, data.useStandardCommands)
  if (useStandardCommands !== undefined) result.ИспользоватьСтандартныеКоманды = useStandardCommands

  const choiceHistoryOnInput = exportSystemEnumerationToYAML<SE.ChoiceHistoryOnInputEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ChoiceHistoryOnInput" },
    data.choiceHistoryOnInput
  )
  if (choiceHistoryOnInput !== undefined) result.ИсторияВыбораПриВводе = choiceHistoryOnInput

  const dataHistory = exportSystemEnumerationToYAML<SE.DataHistoryUseEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "DataHistoryUse" },
    data.dataHistory
  )
  if (dataHistory !== undefined) result.ИсторияДанных = dataHistory

  if (data.levelCount !== undefined) result.КоличествоУровней = data.levelCount

  if (data.comment !== undefined) result.Комментарий = data.comment

  const checkUnique = exportBooleanToEnterprise(context, undefined, data.checkUnique)
  if (checkUnique !== undefined) result.КонтрольУникальности = checkUnique

  const predefinedDataUpdate = exportSystemEnumerationToYAML<SE.PredefinedDataUpdateEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "PredefinedDataUpdate" },
    data.predefinedDataUpdate
  )
  if (predefinedDataUpdate !== undefined) result.ОбновлениеПредопределенныхДанных = predefinedDataUpdate

  const updateDataHistoryImmediatelyAfterWrite = exportBooleanToEnterprise(
    context,
    undefined,
    data.updateDataHistoryImmediatelyAfterWrite
  )
  if (updateDataHistoryImmediatelyAfterWrite !== undefined)
    result.ОбновлятьИсториюДанныхСразуПослеЗаписи = updateDataHistoryImmediatelyAfterWrite

  const limitLevelCount = exportBooleanToEnterprise(context, undefined, data.limitLevelCount)
  if (limitLevelCount !== undefined) result.ОграничиватьКоличествоУровней = limitLevelCount

  if (data.defaultFolderForm !== undefined) result.ОсновнаяФормаГруппы = data.defaultFolderForm

  if (data.defaultChoiceForm !== undefined) result.ОсновнаяФормаДляВыбора = data.defaultChoiceForm

  if (data.defaultFolderChoiceForm !== undefined) result.ОсновнаяФормаДляВыбораГруппы = data.defaultFolderChoiceForm

  if (data.defaultObjectForm !== undefined) result.ОсновнаяФормаОбъекта = data.defaultObjectForm

  if (data.defaultListForm !== undefined) result.ОсновнаяФормаСписка = data.defaultListForm

  const defaultPresentation = exportSystemEnumerationToYAML<SE.CatalogMainPresentationEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "CatalogMainPresentation" },
    data.defaultPresentation
  )
  if (defaultPresentation !== undefined) result.ОсновноеПредставление = defaultPresentation

  const fullTextSearch = exportSystemEnumerationToYAML<SE.UseFullTextSearchEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "UseFullTextSearch" },
    data.fullTextSearch
  )
  if (fullTextSearch !== undefined) result.ПолнотекстовыйПоиск = fullTextSearch

  const fullTextSearchOnInputByString = exportSystemEnumerationToYAML<SE.FullTextSearchOnInputByStringEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "FullTextSearchOnInputByString" },
    data.fullTextSearchOnInputByString
  )
  if (fullTextSearchOnInputByString !== undefined)
    result.ПолнотекстовыйПоискПриВводеПоСтроке = fullTextSearchOnInputByString

  const dataLockFields = exportMetadataFieldsToEnterprise(context, undefined, data.dataLockFields)
  if (dataLockFields !== undefined) result.ПоляБлокировкиДанных = dataLockFields

  const explanation = exportI8nTextToYAML(context, { type: "I8nText" }, data.explanation)
  if (explanation !== undefined) result.Пояснение = explanation

  const predefined = exportPredefinedItemsToEnterprise(context, undefined, data.predefined)
  if (predefined !== undefined) result.Предопределенные = predefined

  const objectPresentation = exportI8nTextToYAML(context, { type: "I8nText" }, data.objectPresentation)
  if (objectPresentation !== undefined) result.ПредставлениеОбъекта = objectPresentation

  const listPresentation = exportI8nTextToYAML(context, { type: "I8nText" }, data.listPresentation)
  if (listPresentation !== undefined) result.ПредставлениеСписка = listPresentation

  const objectBelonging = exportSystemEnumerationToYAML<SE.ObjectBelongingEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ObjectBelonging" },
    data.objectBelonging
  )
  if (objectBelonging !== undefined) result.ПринадлежностьОбъекта = objectBelonging

  const extendedObjectPresentation = exportI8nTextToYAML(context, { type: "I8nText" }, data.extendedObjectPresentation)
  if (extendedObjectPresentation !== undefined) result.РасширенноеПредставлениеОбъекта = extendedObjectPresentation

  const extendedListPresentation = exportI8nTextToYAML(context, { type: "I8nText" }, data.extendedListPresentation)
  if (extendedListPresentation !== undefined) result.РасширенноеПредставлениеСписка = extendedListPresentation

  const choiceDataGetModeOnInputByString = exportSystemEnumerationToYAML<SE.ChoiceDataGetModeOnInputByStringEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ChoiceDataGetModeOnInputByString" },
    data.choiceDataGetModeOnInputByString
  )
  if (choiceDataGetModeOnInputByString !== undefined)
    result.РежимПолученияДанныхВыбораПриВводеПоСтроке = choiceDataGetModeOnInputByString

  const dataLockControlMode = exportSystemEnumerationToYAML<SE.DefaultDataLockControlModeEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "DefaultDataLockControlMode" },
    data.dataLockControlMode
  )
  if (dataLockControlMode !== undefined) result.РежимУправленияБлокировкойДанных = dataLockControlMode

  const codeSeries = exportSystemEnumerationToYAML<SE.CatalogCodesSeriesEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "CatalogCodesSeries" },
    data.codeSeries
  )
  if (codeSeries !== undefined) result.СерииКодов = codeSeries

  const synonym = exportI8nTextToYAML(context, { type: "I8nText" }, data.synonym)
  if (synonym !== undefined) result.Синоним = synonym

  const createOnInput = exportSystemEnumerationToYAML<SE.CreateOnInputEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "CreateOnInput" },
    data.createOnInput
  )
  if (createOnInput !== undefined) result.СозданиеПриВводе = createOnInput

  const choiceMode = exportSystemEnumerationToYAML<SE.ChoiceModeEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ChoiceMode" },
    data.choiceMode
  )
  if (choiceMode !== undefined) result.СпособВыбора = choiceMode

  const searchStringModeOnInputByString = exportSystemEnumerationToYAML<SE.SearchStringModeOnInputByStringEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "SearchStringModeOnInputByString" },
    data.searchStringModeOnInputByString
  )
  if (searchStringModeOnInputByString !== undefined)
    result.СпособПоискаСтрокиПриВводеПоСтроке = searchStringModeOnInputByString

  const editType = exportSystemEnumerationToYAML<SE.EditTypeEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "EditType" },
    data.editType
  )
  if (editType !== undefined) result.СпособРедактирования = editType

  const standardAttributes = exportStandardAttributeDescriptionsToEnterprise(
    context,
    undefined,
    data.standardAttributes
  )
  if (standardAttributes !== undefined) result.СтандартныеРеквизиты = standardAttributes

  const codeType = exportSystemEnumerationToYAML<SE.CatalogCodeTypeEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "CatalogCodeType" },
    data.codeType
  )
  if (codeType !== undefined) result.ТипКода = codeType

  const characteristics = exportCharacteristicsDescriptionsToEnterprise(context, undefined, data.characteristics)
  if (characteristics !== undefined) result.Характеристики = characteristics

  const attributes = exportMetadataAttributesToEnterprise(context, undefined, data.attributes)
  if (attributes !== undefined) result.Реквизиты = attributes

  const tabularSections = exportMetadataTabularSectionsToEnterprise(context, undefined, data.tabularSections)
  if (tabularSections !== undefined) result.ТабличныеЧасти = tabularSections

  const commands = exportMetadataCommandsToEnterprise(context, data.commands)
  if (commands !== undefined) result.Команды = commands

  return result
}
