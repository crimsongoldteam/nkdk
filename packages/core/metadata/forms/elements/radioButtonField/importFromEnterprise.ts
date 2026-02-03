import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importChoiceListFromEnterprise } from "~/metadata/commonObjects/choiceList/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import {
  importI8nTextCombinedFromEnterprise,
  importI8nTextFromEnterprise,
} from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importPictureFromEnterprise } from "~/metadata/commonObjects/picture/importFromEnterprise"
import { importTypeDescriptionFromEnterprise } from "~/metadata/commonObjects/typeDescription/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  RadioButtonField,
  RadioButtonFieldPartialEnterprise,
  RadioButtonFieldTypedEnterprise,
} from "~/metadata/forms/elements/radioButtonField/types"
import { importEventsFromEnterprise } from "~/metadata/forms/events/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  ImportPartialFromEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importContextMenuFromEnterprise } from "../contextMenu/importFromEnterprise"
import { importExtendedTooltipFromEnterprise } from "../extendedTooltip/importFromEnterprise"
import { PropertyRule } from "../calendarField/rules"

export function importRadioButtonFieldTypedFromEnterprise<To extends RadioButtonField | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (data === undefined) return undefined as To

  const props = importRadioButtonFieldPropsFromEnterprise(context, undefined, data)

  const result: RadioButtonField = {
    ...props,
    elementType: "RadioButtonField",
    name: name,
  }

  const title = importI8nTextFromEnterprise(context, undefined, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result as To
}

export function importRadioButtonFieldPartialFromEnterprise<To extends RadioButtonField>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const props = importRadioButtonFieldPropsFromEnterprise(context, undefined, data)
  const result: To = {
    ...source,
    ...props,
    elementType: source.elementType, // Сохраняем elementType из source
    name: source.name,
  }

  const title = importI8nTextCombinedFromEnterprise(context, undefined, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

const importRadioButtonFieldPropsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: RadioButtonFieldTypedEnterprise | RadioButtonFieldPartialEnterprise | undefined
): Omit<Partial<RadioButtonField>, "elementType" | "name"> => {
  const result: Omit<Partial<RadioButtonField>, "elementType" | "name"> = {}

  if (data === undefined) return result

  const autoCellHeight = importBooleanFromEnterprise(context, undefined, data.АвтоВысотаЯчейки)
  if (autoCellHeight !== undefined) result.autoCellHeight = autoCellHeight

  const defaultItem = importBooleanFromEnterprise(context, undefined, data.АктивизироватьПоУмолчанию)
  if (defaultItem !== undefined) result.defaultItem = defaultItem

  const displayImportance = importSystemEnumerationFromYAML<SE.DisplayImportance>(
    context,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const verticalAlign = importSystemEnumerationFromYAML<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеПоложение,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlign !== undefined) result.verticalAlign = verticalAlign

  const verticalAlignInGroup = importSystemEnumerationFromYAML<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеПоложениеВГруппе,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.verticalAlignInGroup = verticalAlignInGroup

  const type = importSystemEnumerationFromYAML<SE.FormFieldType>(context, data.Вид, SE.FormFieldTypeFromEnterprise)
  if (type !== undefined) result.type = type

  const visible = importBooleanFromEnterprise(context, undefined, data.Видимость)
  if (visible !== undefined) result.visible = visible

  if (data.ВысотаЗаголовка !== undefined) result.titleHeight = data.ВысотаЗаголовка

  const cellHyperlink = importBooleanFromEnterprise(context, undefined, data.ГиперссылкаЯчейки)
  if (cellHyperlink !== undefined) result.cellHyperlink = cellHyperlink

  const horizontalAlign = importSystemEnumerationFromYAML<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложение,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlign !== undefined) result.horizontalAlign = horizontalAlign

  const horizontalAlignInGroup = importSystemEnumerationFromYAML<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложениеВГруппе,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = horizontalAlignInGroup

  const footerHorizontalAlign = importSystemEnumerationFromYAML<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложениеВПодвале,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (footerHorizontalAlign !== undefined) result.footerHorizontalAlign = footerHorizontalAlign

  const headerHorizontalAlign = importSystemEnumerationFromYAML<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложениеВШапке,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (headerHorizontalAlign !== undefined) result.headerHorizontalAlign = headerHorizontalAlign

  const enabled = importBooleanFromEnterprise(context, undefined, data.Доступность)
  if (enabled !== undefined) result.enabled = enabled

  const footerPicture = importPictureFromEnterprise(context, undefined, data.КартинкаПодвала)
  if (footerPicture !== undefined) result.footerPicture = footerPicture

  const headerPicture = importPictureFromEnterprise(context, undefined, data.КартинкаШапки)
  if (headerPicture !== undefined) result.headerPicture = headerPicture

  const contextMenu = importContextMenuFromEnterprise(context, undefined, data.КонтекстноеМеню)
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  const typeRestriction = importTypeDescriptionFromEnterprise(context, undefined, data.ОграничениеТипа)
  if (typeRestriction !== undefined) result.typeRestriction = typeRestriction

  const showInFooter = importBooleanFromEnterprise(context, undefined, data.ОтображатьВПодвале)
  if (showInFooter !== undefined) result.showInFooter = showInFooter

  const showInHeader = importBooleanFromEnterprise(context, undefined, data.ОтображатьВШапке)
  if (showInHeader !== undefined) result.showInHeader = showInHeader

  const toolTipRepresentation = importSystemEnumerationFromYAML<SE.ToolTipRepresentation>(
    context,
    data.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const warningOnEditRepresentation = importSystemEnumerationFromYAML<SE.WarningOnEditRepresentation>(
    context,
    data.ОтображениеПредупрежденияПриРедактировании,
    SE.WarningOnEditRepresentationFromEnterprise
  )
  if (warningOnEditRepresentation !== undefined) result.warningOnEditRepresentation = warningOnEditRepresentation

  const toolTip = importI8nTextFromEnterprise(context, undefined, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const titleLocation = importSystemEnumerationFromYAML<SE.FormItemTitleLocation>(
    context,
    data.ПоложениеЗаголовка,
    SE.FormItemTitleLocationFromEnterprise
  )
  if (titleLocation !== undefined) result.titleLocation = titleLocation

  const userVisible = importUserVisibleFromEnterprise(
    context,
    undefined,
    data.РазрешитьИспользование,
    data.ЗапретитьИспользование
  )
  if (userVisible !== undefined) {
    result.userVisible = userVisible
  }

  const warningOnEdit = importI8nTextFromEnterprise(context, undefined, data.ПредупреждениеПриРедактировании)
  if (warningOnEdit !== undefined) result.warningOnEdit = warningOnEdit

  const skipOnInput = importBooleanFromEnterprise(context, undefined, data.ПропускатьПриВводе)
  if (skipOnInput !== undefined) result.skipOnInput = skipOnInput

  if (data.ПутьКДанным !== undefined) result.dataPath = data.ПутьКДанным

  if (data.ПутьКДаннымПодвала !== undefined) result.footerDataPath = data.ПутьКДаннымПодвала

  const extendedTooltip = importExtendedTooltipFromEnterprise(context, undefined, data.РасширеннаяПодсказка)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  const editMode = importSystemEnumerationFromYAML<SE.ColumnEditMode>(
    context,
    data.РежимРедактирования,
    SE.ColumnEditModeFromEnterprise
  )
  if (editMode !== undefined) result.editMode = editMode

  if (data.СочетаниеКлавиш !== undefined) result.shortcut = data.СочетаниеКлавиш

  if (data.Таблица !== undefined) result.table = data.Таблица

  const footerText = importI8nTextFromEnterprise(context, undefined, data.ТекстПодвала)
  if (footerText !== undefined) result.footerText = footerText

  const readOnly = importBooleanFromEnterprise(context, undefined, data.ТолькоПросмотр)
  if (readOnly !== undefined) result.readOnly = readOnly

  const fixingInTable = importSystemEnumerationFromYAML<SE.FixingInTable>(
    context,
    data.ФиксацияВТаблице,
    SE.FixingInTableFromEnterprise
  )
  if (fixingInTable !== undefined) result.fixingInTable = fixingInTable

  const titleTextColor = importColorFromEnterprise(context, undefined, data.ЦветТекстаЗаголовка)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  const footerTextColor = importColorFromEnterprise(context, undefined, data.ЦветТекстаПодвала)
  if (footerTextColor !== undefined) result.footerTextColor = footerTextColor

  const titleBackColor = importColorFromEnterprise(context, undefined, data.ЦветФонаЗаголовка)
  if (titleBackColor !== undefined) result.titleBackColor = titleBackColor

  const footerBackColor = importColorFromEnterprise(context, undefined, data.ЦветФонаПодвала)
  if (footerBackColor !== undefined) result.footerBackColor = footerBackColor

  const titleFont = importFontFromEnterprise(context, undefined, data.ШрифтЗаголовка)
  if (titleFont !== undefined) result.titleFont = titleFont

  const footerFont = importFontFromEnterprise(context, undefined, data.ШрифтПодвала)
  if (footerFont !== undefined) result.footerFont = footerFont

  const radioButtonType = importSystemEnumerationFromYAML<SE.RadioButtonType>(
    context,
    data.ВидПереключателя,
    SE.RadioButtonTypeFromEnterprise
  )
  if (radioButtonType !== undefined) result.radioButtonType = radioButtonType

  if (data.ВысотаЗаголовкаЭлемента !== undefined) result.itemTitleHeight = data.ВысотаЗаголовкаЭлемента

  if (data.ВысотаЭлемента !== undefined) result.itemHeight = data.ВысотаЭлемента

  if (data.КоличествоКолонок !== undefined) result.columnsCount = data.КоличествоКолонок

  const equalColumnsWidth = importBooleanFromEnterprise(context, undefined, data.ОдинаковаяШиринаКолонок)
  if (equalColumnsWidth !== undefined) result.equalColumnsWidth = equalColumnsWidth

  const choiceList = importChoiceListFromEnterprise(context, undefined, data.СписокВыбора)
  if (choiceList !== undefined) result.choiceList = choiceList

  const borderColor = importColorFromEnterprise(context, undefined, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const textColor = importColorFromEnterprise(context, undefined, data.ЦветТекста)
  if (textColor !== undefined) result.textColor = textColor

  const backColor = importColorFromEnterprise(context, undefined, data.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  if (data.ШиринаЭлемента !== undefined) result.itemWidth = data.ШиринаЭлемента

  const font = importFontFromEnterprise(context, undefined, data.Шрифт)
  if (font !== undefined) result.font = font

  const events = importEventsFromEnterprise(context, undefined, data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "RadioButtonField",
  importRadioButtonFieldPartialFromEnterprise as ImportPartialFromEnterpriseFn
)
