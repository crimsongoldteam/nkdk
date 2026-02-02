import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
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
  HTMLDocumentField,
  HTMLDocumentFieldPartialEnterprise,
  HTMLDocumentFieldTypedEnterprise,
} from "~/metadata/forms/elements/htmlDocumentField/types"
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

export function importHTMLDocumentFieldTypedFromEnterprise<To extends HTMLDocumentField | undefined>(
  context: ConfigurationContext,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (data === undefined) return undefined as To

  const props = importHTMLDocumentFieldPropsFromEnterprise(context, data)

  const result: HTMLDocumentField = {
    ...props,
    elementType: "HTMLDocumentField",
    name,
  }

  const title = importI8nTextFromEnterprise(context, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result as To
}

export function importHTMLDocumentFieldPartialFromEnterprise<To extends HTMLDocumentField>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const props = importHTMLDocumentFieldPropsFromEnterprise(context, data)
  const result: To = {
    ...source,
    ...props,
    elementType: "HTMLDocumentField",
    name: source.name,
  }

  const title = importI8nTextCombinedFromEnterprise(context, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

const importHTMLDocumentFieldPropsFromEnterprise = (
  context: ConfigurationContext,
  data: HTMLDocumentFieldTypedEnterprise | HTMLDocumentFieldPartialEnterprise | undefined
): Omit<Partial<HTMLDocumentField>, "elementType" | "name"> => {
  const result: Omit<Partial<HTMLDocumentField>, "elementType" | "name"> = {}

  if (data === undefined) return result

  const autoCellHeight = importBooleanFromEnterprise(context, data.АвтоВысотаЯчейки)
  if (autoCellHeight !== undefined) result.autoCellHeight = autoCellHeight

  const defaultItem = importBooleanFromEnterprise(context, data.АктивизироватьПоУмолчанию)
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

  const visible = importBooleanFromEnterprise(context, data.Видимость)
  if (visible !== undefined) result.visible = visible

  if (data.ВысотаЗаголовка !== undefined) result.titleHeight = data.ВысотаЗаголовка

  const cellHyperlink = importBooleanFromEnterprise(context, data.ГиперссылкаЯчейки)
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

  const enabled = importBooleanFromEnterprise(context, data.Доступность)
  if (enabled !== undefined) result.enabled = enabled

  const footerPicture = importPictureFromEnterprise(context, data.КартинкаПодвала)
  if (footerPicture !== undefined) result.footerPicture = footerPicture

  const headerPicture = importPictureFromEnterprise(context, data.КартинкаШапки)
  if (headerPicture !== undefined) result.headerPicture = headerPicture

  const contextMenu = importContextMenuFromEnterprise(context, data.КонтекстноеМеню)
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  const typeRestriction = importTypeDescriptionFromEnterprise(context, data.ОграничениеТипа)
  if (typeRestriction !== undefined) result.typeRestriction = typeRestriction

  const showInFooter = importBooleanFromEnterprise(context, data.ОтображатьВПодвале)
  if (showInFooter !== undefined) result.showInFooter = showInFooter

  const showInHeader = importBooleanFromEnterprise(context, data.ОтображатьВШапке)
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

  const toolTip = importI8nTextFromEnterprise(context, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const titleLocation = importSystemEnumerationFromYAML<SE.FormItemTitleLocation>(
    context,
    data.ПоложениеЗаголовка,
    SE.FormItemTitleLocationFromEnterprise
  )
  if (titleLocation !== undefined) result.titleLocation = titleLocation

  const userVisible = importUserVisibleFromEnterprise(context, data.РазрешитьИспользование, data.ЗапретитьИспользование)
  if (userVisible !== undefined) {
    result.userVisible = userVisible
  }

  const warningOnEdit = importI8nTextFromEnterprise(context, data.ПредупреждениеПриРедактировании)
  if (warningOnEdit !== undefined) result.warningOnEdit = warningOnEdit

  const skipOnInput = importBooleanFromEnterprise(context, data.ПропускатьПриВводе)
  if (skipOnInput !== undefined) result.skipOnInput = skipOnInput

  if (data.ПутьКДанным !== undefined) result.dataPath = data.ПутьКДанным

  if (data.ПутьКДаннымПодвала !== undefined) result.footerDataPath = data.ПутьКДаннымПодвала

  const extendedTooltip = importExtendedTooltipFromEnterprise(context, data.РасширеннаяПодсказка)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  const editMode = importSystemEnumerationFromYAML<SE.ColumnEditMode>(
    context,
    data.РежимРедактирования,
    SE.ColumnEditModeFromEnterprise
  )
  if (editMode !== undefined) result.editMode = editMode

  if (data.СочетаниеКлавиш !== undefined) result.shortcut = data.СочетаниеКлавиш

  if (data.Таблица !== undefined) result.table = data.Таблица

  const footerText = importI8nTextFromEnterprise(context, data.ТекстПодвала)
  if (footerText !== undefined) result.footerText = footerText

  const readOnly = importBooleanFromEnterprise(context, data.ТолькоПросмотр)
  if (readOnly !== undefined) result.readOnly = readOnly

  const fixingInTable = importSystemEnumerationFromYAML<SE.FixingInTable>(
    context,
    data.ФиксацияВТаблице,
    SE.FixingInTableFromEnterprise
  )
  if (fixingInTable !== undefined) result.fixingInTable = fixingInTable

  const titleTextColor = importColorFromEnterprise(context, data.ЦветТекстаЗаголовка)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  const footerTextColor = importColorFromEnterprise(context, data.ЦветТекстаПодвала)
  if (footerTextColor !== undefined) result.footerTextColor = footerTextColor

  const titleBackColor = importColorFromEnterprise(context, data.ЦветФонаЗаголовка)
  if (titleBackColor !== undefined) result.titleBackColor = titleBackColor

  const footerBackColor = importColorFromEnterprise(context, data.ЦветФонаПодвала)
  if (footerBackColor !== undefined) result.footerBackColor = footerBackColor

  const titleFont = importFontFromEnterprise(context, data.ШрифтЗаголовка)
  if (titleFont !== undefined) result.titleFont = titleFont

  const footerFont = importFontFromEnterprise(context, data.ШрифтПодвала)
  if (footerFont !== undefined) result.footerFont = footerFont

  const autoMaxHeight = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  const output = importSystemEnumerationFromYAML<SE.UseOutput>(context, data.Вывод, SE.UseOutputFromEnterprise)
  if (output !== undefined) result.output = output

  if (data.Высота !== undefined) result.height = data.Высота

  if (data.ИнформацияПрограммыПросмотра !== undefined) result.userAgentInformation = data.ИнформацияПрограммыПросмотра

  if (data.МаксимальнаяВысота !== undefined) result.maxHeight = data.МаксимальнаяВысота

  if (data.МаксимальнаяШирина !== undefined) result.maxWidth = data.МаксимальнаяШирина

  const verticalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const borderColor = importColorFromEnterprise(context, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  const events = importEventsFromEnterprise(context, data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "HTMLDocumentField",
  importHTMLDocumentFieldPartialFromEnterprise as ImportPartialFromEnterpriseFn
)
