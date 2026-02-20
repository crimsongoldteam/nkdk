import { MetadataCatalog, MetadataCatalogEnterprise } from "~/metadata/appliedObjects/metadataCatalog/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { importPropertiesFromYAML } from "~/metadata/metadataFactory"
import { MetadataCatalogRules } from "./rules"

export const importMetadataCatalogFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: MetadataCatalogEnterprise | undefined,
  name: string
): MetadataCatalog | undefined => {
  if (!data) return undefined

  const result = importPropertiesFromYAML({
    context,
    metadataType: "MetadataCatalog",
    yaml: data,
    rules: MetadataCatalogRules,
    name,
  })

  return result
  // if (!data) return undefined
  // const result: MetadataCatalog = {
  //   name,
  // }
  // const synonym = importI8nTextFromYAML(context, { type: "I8nText" }, data.Синоним)
  // if (synonym !== undefined) result.synonym = synonym
  // if (data.Комментарий !== undefined) result.comment = data.Комментарий
  // const hierarchical = importBooleanFromEnterprise(context, undefined, data.Иерархический)
  // if (hierarchical !== undefined) result.hierarchical = hierarchical
  // const hierarchyType = importSystemEnumerationFromYAML<SE.HierarchyType>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "HierarchyType" },
  //   data.ВидИерархии
  // )
  // if (hierarchyType !== undefined) result.hierarchyType = hierarchyType
  // const autonumbering = importBooleanFromEnterprise(context, undefined, data.Автонумерация)
  // if (autonumbering !== undefined) result.autonumbering = autonumbering
  // const quickChoice = importBooleanFromEnterprise(context, undefined, data.БыстрыйВыбор)
  // if (quickChoice !== undefined) result.quickChoice = quickChoice
  // const basedOn = importMetadataItemLinksFromEnterprise(context, undefined, data.ВводитсяНаОсновании)
  // if (basedOn !== undefined) result.basedOn = basedOn
  // const inputByString = importMetadataFieldsFromEnterprise(context, undefined, data.ВводПоСтроке)
  // if (inputByString !== undefined) result.inputByString = inputByString
  // const includeHelpInContents = importBooleanFromEnterprise(context, undefined, data.ВключатьСправкуВСодержание)
  // if (includeHelpInContents !== undefined) result.includeHelpInContents = includeHelpInContents
  // const owners = importMetadataItemLinksFromEnterprise(context, undefined, data.Владельцы)
  // if (owners !== undefined) result.owners = owners
  // const executeAfterWriteDataHistoryVersionProcessing = importBooleanFromEnterprise(
  //   context,
  //   undefined,
  //   data.ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных
  // )
  // if (executeAfterWriteDataHistoryVersionProcessing !== undefined)
  //   result.executeAfterWriteDataHistoryVersionProcessing = executeAfterWriteDataHistoryVersionProcessing
  // const foldersOnTop = importBooleanFromEnterprise(context, undefined, data.ГруппыСверху)
  // if (foldersOnTop !== undefined) result.foldersOnTop = foldersOnTop
  // if (data.ДлинаКода !== undefined) result.codeLength = data.ДлинаКода
  // if (data.ДлинаНаименования !== undefined) result.descriptionLength = data.ДлинаНаименования
  // if (data.ДополнительнаяФормаГруппы !== undefined) result.auxiliaryFolderForm = data.ДополнительнаяФормаГруппы
  // if (data.ДополнительнаяФормаДляВыбора !== undefined) result.auxiliaryChoiceForm = data.ДополнительнаяФормаДляВыбора
  // if (data.ДополнительнаяФормаДляВыбораГруппы !== undefined)
  //   result.auxiliaryFolderChoiceForm = data.ДополнительнаяФормаДляВыбораГруппы
  // if (data.ДополнительнаяФормаОбъекта !== undefined) result.auxiliaryObjectForm = data.ДополнительнаяФормаОбъекта
  // if (data.ДополнительнаяФормаСписка !== undefined) result.auxiliaryListForm = data.ДополнительнаяФормаСписка
  // const additionalIndexes = importAdditionalIndexesFromEnterprise(context, undefined, data.ДополнительныеИндексы)
  // if (additionalIndexes !== undefined) result.additionalIndexes = additionalIndexes
  // const codeAllowedLength = importSystemEnumerationFromYAML<SE.AllowedLength>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "AllowedLength" },
  //   data.ДопустимаяДлинаКода
  // )
  // if (codeAllowedLength !== undefined) result.codeAllowedLength = codeAllowedLength
  // const subordinationUse = importSystemEnumerationFromYAML<SE.SubordinationUse>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "SubordinationUse" },
  //   data.ИспользованиеПодчинения
  // )
  // if (subordinationUse !== undefined) result.subordinationUse = subordinationUse
  // const useStandardCommands = importBooleanFromEnterprise(context, undefined, data.ИспользоватьСтандартныеКоманды)
  // if (useStandardCommands !== undefined) result.useStandardCommands = useStandardCommands
  // const choiceHistoryOnInput = importSystemEnumerationFromYAML<SE.ChoiceHistoryOnInput>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "ChoiceHistoryOnInput" },
  //   data.ИсторияВыбораПриВводе
  // )
  // if (choiceHistoryOnInput !== undefined) result.choiceHistoryOnInput = choiceHistoryOnInput
  // const dataHistory = importSystemEnumerationFromYAML<SE.DataHistoryUse>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "DataHistoryUse" },
  //   data.ИсторияДанных
  // )
  // if (dataHistory !== undefined) result.dataHistory = dataHistory
  // if (data.КоличествоУровней !== undefined) result.levelCount = data.КоличествоУровней
  // const checkUnique = importBooleanFromEnterprise(context, undefined, data.КонтрольУникальности)
  // if (checkUnique !== undefined) result.checkUnique = checkUnique
  // const predefinedDataUpdate = importSystemEnumerationFromYAML<SE.PredefinedDataUpdate>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "PredefinedDataUpdate" },
  //   data.ОбновлениеПредопределенныхДанных
  // )
  // if (predefinedDataUpdate !== undefined) result.predefinedDataUpdate = predefinedDataUpdate
  // const updateDataHistoryImmediatelyAfterWrite = importBooleanFromEnterprise(
  //   context,
  //   undefined,
  //   data.ОбновлятьИсториюДанныхСразуПослеЗаписи
  // )
  // if (updateDataHistoryImmediatelyAfterWrite !== undefined)
  //   result.updateDataHistoryImmediatelyAfterWrite = updateDataHistoryImmediatelyAfterWrite
  // const limitLevelCount = importBooleanFromEnterprise(context, undefined, data.ОграничиватьКоличествоУровней)
  // if (limitLevelCount !== undefined) result.limitLevelCount = limitLevelCount
  // if (data.ОсновнаяФормаГруппы !== undefined) result.defaultFolderForm = data.ОсновнаяФормаГруппы
  // if (data.ОсновнаяФормаДляВыбора !== undefined) result.defaultChoiceForm = data.ОсновнаяФормаДляВыбора
  // if (data.ОсновнаяФормаДляВыбораГруппы !== undefined)
  //   result.defaultFolderChoiceForm = data.ОсновнаяФормаДляВыбораГруппы
  // if (data.ОсновнаяФормаОбъекта !== undefined) result.defaultObjectForm = data.ОсновнаяФормаОбъекта
  // if (data.ОсновнаяФормаСписка !== undefined) result.defaultListForm = data.ОсновнаяФормаСписка
  // const defaultPresentation = importSystemEnumerationFromYAML<SE.CatalogMainPresentation>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "CatalogMainPresentation" },
  //   data.ОсновноеПредставление
  // )
  // if (defaultPresentation !== undefined) result.defaultPresentation = defaultPresentation
  // const fullTextSearch = importSystemEnumerationFromYAML<SE.UseFullTextSearch>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "UseFullTextSearch" },
  //   data.ПолнотекстовыйПоиск
  // )
  // if (fullTextSearch !== undefined) result.fullTextSearch = fullTextSearch
  // const fullTextSearchOnInputByString = importSystemEnumerationFromYAML<SE.FullTextSearchOnInputByString>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "FullTextSearchOnInputByString" },
  //   data.ПолнотекстовыйПоискПриВводеПоСтроке
  // )
  // if (fullTextSearchOnInputByString !== undefined) result.fullTextSearchOnInputByString = fullTextSearchOnInputByString
  // const dataLockFields = importMetadataFieldsFromEnterprise(context, undefined, data.ПоляБлокировкиДанных)
  // if (dataLockFields !== undefined) result.dataLockFields = dataLockFields
  // const explanation = importI8nTextFromYAML(context, { type: "I8nText" }, data.Пояснение)
  // if (explanation !== undefined) result.explanation = explanation
  // const predefined = importPredefinedItemsFromEnterprise(context, undefined, data.Предопределенные)
  // if (predefined !== undefined) result.predefined = predefined
  // const objectPresentation = importI8nTextFromYAML(context, { type: "I8nText" }, data.ПредставлениеОбъекта)
  // if (objectPresentation !== undefined) result.objectPresentation = objectPresentation
  // const listPresentation = importI8nTextFromYAML(context, { type: "I8nText" }, data.ПредставлениеСписка)
  // if (listPresentation !== undefined) result.listPresentation = listPresentation
  // const objectBelonging = importSystemEnumerationFromYAML<SE.ObjectBelonging>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "ObjectBelonging" },
  //   data.ПринадлежностьОбъекта
  // )
  // if (objectBelonging !== undefined) result.objectBelonging = objectBelonging
  // const extendedObjectPresentation = importI8nTextFromYAML(context, undefined, data.РасширенноеПредставлениеОбъекта)
  // if (extendedObjectPresentation !== undefined) result.extendedObjectPresentation = extendedObjectPresentation
  // const extendedListPresentation = importI8nTextFromYAML(
  //   context,
  //   { type: "I8nText" },
  //   data.РасширенноеПредставлениеСписка
  // )
  // if (extendedListPresentation !== undefined) result.extendedListPresentation = extendedListPresentation
  // const choiceDataGetModeOnInputByString = importSystemEnumerationFromYAML<SE.ChoiceDataGetModeOnInputByString>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "ChoiceDataGetModeOnInputByString" },
  //   data.РежимПолученияДанныхВыбораПриВводеПоСтроке
  // )
  // if (choiceDataGetModeOnInputByString !== undefined)
  //   result.choiceDataGetModeOnInputByString = choiceDataGetModeOnInputByString
  // const dataLockControlMode = importSystemEnumerationFromYAML<SE.DefaultDataLockControlMode>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "DefaultDataLockControlMode" },
  //   data.РежимУправленияБлокировкойДанных
  // )
  // if (dataLockControlMode !== undefined) result.dataLockControlMode = dataLockControlMode
  // const codeSeries = importSystemEnumerationFromYAML<SE.CatalogCodesSeries>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "CatalogCodesSeries" },
  //   data.СерииКодов
  // )
  // if (codeSeries !== undefined) result.codeSeries = codeSeries
  // const createOnInput = importSystemEnumerationFromYAML<SE.CreateOnInput>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "CreateOnInput" },
  //   data.СозданиеПриВводе
  // )
  // if (createOnInput !== undefined) result.createOnInput = createOnInput
  // const choiceMode = importSystemEnumerationFromYAML<SE.ChoiceMode>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "ChoiceMode" },
  //   data.СпособВыбора
  // )
  // if (choiceMode !== undefined) result.choiceMode = choiceMode
  // const searchStringModeOnInputByString = importSystemEnumerationFromYAML<SE.SearchStringModeOnInputByString>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "SearchStringModeOnInputByString" },
  //   data.СпособПоискаСтрокиПриВводеПоСтроке
  // )
  // if (searchStringModeOnInputByString !== undefined)
  //   result.searchStringModeOnInputByString = searchStringModeOnInputByString
  // const editType = importSystemEnumerationFromYAML<SE.EditType>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "EditType" },
  //   data.СпособРедактирования
  // )
  // if (editType !== undefined) result.editType = editType
  // const standardAttributes = importStandardAttributeDescriptionsFromEnterprise(
  //   context,
  //   undefined,
  //   data.СтандартныеРеквизиты
  // )
  // if (standardAttributes !== undefined) result.standardAttributes = standardAttributes
  // const codeType = importSystemEnumerationFromYAML<SE.CatalogCodeType>(
  //   context,
  //   { type: "SystemEnumeration", typeSE: "CatalogCodeType" },
  //   data.ТипКода
  // )
  // if (codeType !== undefined) result.codeType = codeType
  // const characteristics = importCharacteristicsDescriptionsFromEnterprise(context, undefined, data.Характеристики)
  // if (characteristics !== undefined) result.characteristics = characteristics
  // const attributes = importMetadataAttributesFromEnterprise(context, undefined, data.Реквизиты)
  // if (attributes !== undefined) result.attributes = attributes
  // const tabularSections = importMetadataTabularSectionsFromEnterprise(context, undefined, data.ТабличныеЧасти)
  // if (tabularSections !== undefined) result.tabularSections = tabularSections
  // const commands = importMetadataCommandsFromEnterprise(context, undefined, data.Команды)
  // if (commands !== undefined) result.commands = commands
  // const defaults = getDefaults(result, context)
  // return removeDefaults(result, defaults)
}
