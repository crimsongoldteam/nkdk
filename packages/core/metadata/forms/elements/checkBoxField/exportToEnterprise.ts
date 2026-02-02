import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/picture/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "~/metadata/commonObjects/typeDescription/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  CheckBoxField,
  CheckBoxFieldPartialEnterprise,
  CheckBoxFieldTypedEnterprise,
} from "~/metadata/forms/elements/checkBoxField/types"
import { exportContextMenuToEnterprise } from "~/metadata/forms/elements/contextMenu/exportToEnterprise"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  ExportPartialToEnterpriseFn,
  ExportTypedToEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportExtendedTooltipToEnterprise } from "../extendedTooltip/exportToEnterprise"

export function exportCheckBoxFieldTypedToEnterprise<From extends CheckBoxField | undefined>(
  context: ConfigurationContext,
  data: From
): ToTypedEnterpriseType<From> {
  if (data === undefined) return undefined as ToTypedEnterpriseType<From>

  const props = exportCheckBoxFieldPropsToEnterprise(context, data)

  const title = exportI8nTextToEnterprise(context, data.title)
  const result: CheckBoxFieldTypedEnterprise = {
    Тип: "ПолеФлажок",
    ...props,
  }

  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToTypedEnterpriseType<From>
}

export function exportCheckBoxFieldPartialToEnterprise<From extends CheckBoxField | undefined>(
  context: ConfigurationContext,
  data: From
): ToPartialEnterpriseType<From> {
  if (data === undefined) return undefined as ToPartialEnterpriseType<From>

  const props = exportCheckBoxFieldPropsToEnterprise(context, data)

  const result: CheckBoxFieldPartialEnterprise = {
    ...props,
  }

  const title = exportI8nTextToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToPartialEnterpriseType<From>
}

const exportCheckBoxFieldPropsToEnterprise = (
  context: ConfigurationContext,
  data: CheckBoxField
): CheckBoxFieldPartialEnterprise => {
  const result: CheckBoxFieldPartialEnterprise = {}

  const autoCellHeight = exportBooleanToEnterprise(context, data.autoCellHeight)
  if (autoCellHeight !== undefined) result.АвтоВысотаЯчейки = autoCellHeight

  const defaultItem = exportBooleanToEnterprise(context, data.defaultItem)
  if (defaultItem !== undefined) result.АктивизироватьПоУмолчанию = defaultItem

  const displayImportance = exportSystemEnumerationToYAML(
    context,
    data.displayImportance,
    SE.DisplayImportanceToEnterprise
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const verticalAlign = exportSystemEnumerationToYAML(context, data.verticalAlign, SE.ItemVerticalAlignToEnterprise)
  if (verticalAlign !== undefined) result.ВертикальноеПоложение = verticalAlign

  const verticalAlignInGroup = exportSystemEnumerationToYAML(
    context,
    data.verticalAlignInGroup,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.ВертикальноеПоложениеВГруппе = verticalAlignInGroup

  const type = exportSystemEnumerationToYAML(context, data.type, SE.FormFieldTypeToEnterprise)
  if (type !== undefined) result.Вид = type

  const visible = exportBooleanToEnterprise(context, data.visible)
  if (visible !== undefined) result.Видимость = visible

  if (data.titleHeight !== undefined) result.ВысотаЗаголовка = data.titleHeight

  const cellHyperlink = exportBooleanToEnterprise(context, data.cellHyperlink)
  if (cellHyperlink !== undefined) result.ГиперссылкаЯчейки = cellHyperlink

  const horizontalAlign = exportSystemEnumerationToYAML(
    context,
    data.horizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlign !== undefined) result.ГоризонтальноеПоложение = horizontalAlign

  const horizontalAlignInGroup = exportSystemEnumerationToYAML(
    context,
    data.horizontalAlignInGroup,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.ГоризонтальноеПоложениеВГруппе = horizontalAlignInGroup

  const footerHorizontalAlign = exportSystemEnumerationToYAML(
    context,
    data.footerHorizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (footerHorizontalAlign !== undefined) result.ГоризонтальноеПоложениеВПодвале = footerHorizontalAlign

  const headerHorizontalAlign = exportSystemEnumerationToYAML(
    context,
    data.headerHorizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (headerHorizontalAlign !== undefined) result.ГоризонтальноеПоложениеВШапке = headerHorizontalAlign

  const enabled = exportBooleanToEnterprise(context, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const footerPicture = exportPictureToEnterprise(context, data.footerPicture)
  if (footerPicture !== undefined) result.КартинкаПодвала = footerPicture

  const headerPicture = exportPictureToEnterprise(context, data.headerPicture)
  if (headerPicture !== undefined) result.КартинкаШапки = headerPicture

  const contextMenu = exportContextMenuToEnterprise(context, data.contextMenu)
  if (contextMenu !== undefined) result.КонтекстноеМеню = contextMenu

  const typeRestriction = exportTypeDescriptionToEnterprise(context, data.typeRestriction)
  if (typeRestriction !== undefined) result.ОграничениеТипа = typeRestriction

  const showInFooter = exportBooleanToEnterprise(context, data.showInFooter)
  if (showInFooter !== undefined) result.ОтображатьВПодвале = showInFooter

  const showInHeader = exportBooleanToEnterprise(context, data.showInHeader)
  if (showInHeader !== undefined) result.ОтображатьВШапке = showInHeader

  const toolTipRepresentation = exportSystemEnumerationToYAML(
    context,
    data.toolTipRepresentation,
    SE.ToolTipRepresentationToEnterprise
  )
  if (toolTipRepresentation !== undefined) result.ОтображениеПодсказки = toolTipRepresentation

  const warningOnEditRepresentation = exportSystemEnumerationToYAML(
    context,
    data.warningOnEditRepresentation,
    SE.WarningOnEditRepresentationToEnterprise
  )
  if (warningOnEditRepresentation !== undefined)
    result.ОтображениеПредупрежденияПриРедактировании = warningOnEditRepresentation

  const toolTip = exportI8nTextToEnterprise(context, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const titleLocation = exportSystemEnumerationToYAML(context, data.titleLocation, SE.FormItemTitleLocationToEnterprise)
  if (titleLocation !== undefined) result.ПоложениеЗаголовка = titleLocation

  const warningOnEdit = exportI8nTextToEnterprise(context, data.warningOnEdit)
  if (warningOnEdit !== undefined) result.ПредупреждениеПриРедактировании = warningOnEdit

  const skipOnInput = exportBooleanToEnterprise(context, data.skipOnInput)
  if (skipOnInput !== undefined) result.ПропускатьПриВводе = skipOnInput

  if (data.dataPath !== undefined) result.ПутьКДанным = data.dataPath

  if (data.footerDataPath !== undefined) result.ПутьКДаннымПодвала = data.footerDataPath

  const extendedTooltip = exportExtendedTooltipToEnterprise(context, data.extendedTooltip)
  if (extendedTooltip !== undefined) result.РасширеннаяПодсказка = extendedTooltip

  const editMode = exportSystemEnumerationToYAML(context, data.editMode, SE.ColumnEditModeToEnterprise)
  if (editMode !== undefined) result.РежимРедактирования = editMode

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  if (data.table !== undefined) result.Таблица = data.table

  const footerText = exportI8nTextToEnterprise(context, data.footerText)
  if (footerText !== undefined) result.ТекстПодвала = footerText

  const readOnly = exportBooleanToEnterprise(context, data.readOnly)
  if (readOnly !== undefined) result.ТолькоПросмотр = readOnly

  const fixingInTable = exportSystemEnumerationToYAML(context, data.fixingInTable, SE.FixingInTableToEnterprise)
  if (fixingInTable !== undefined) result.ФиксацияВТаблице = fixingInTable

  const titleTextColor = exportColorToEnterprise(context, data.titleTextColor)
  if (titleTextColor !== undefined) result.ЦветТекстаЗаголовка = titleTextColor

  const footerTextColor = exportColorToEnterprise(context, data.footerTextColor)
  if (footerTextColor !== undefined) result.ЦветТекстаПодвала = footerTextColor

  const titleBackColor = exportColorToEnterprise(context, data.titleBackColor)
  if (titleBackColor !== undefined) result.ЦветФонаЗаголовка = titleBackColor

  const footerBackColor = exportColorToEnterprise(context, data.footerBackColor)
  if (footerBackColor !== undefined) result.ЦветФонаПодвала = footerBackColor

  const titleFont = exportFontToEnterprise(context, data.titleFont)
  if (titleFont !== undefined) result.ШрифтЗаголовка = titleFont

  const footerFont = exportFontToEnterprise(context, data.footerFont)
  if (footerFont !== undefined) result.ШрифтПодвала = footerFont

  const checkBoxType = exportSystemEnumerationToYAML(context, data.checkBoxType, SE.CheckBoxTypeToEnterprise)
  if (checkBoxType !== undefined) result.ВидФлажка = checkBoxType

  if (data.itemTitleHeight !== undefined) result.ВысотаЗаголовкаЭлемента = data.itemTitleHeight

  if (data.itemHeight !== undefined) result.ВысотаЭлемента = data.itemHeight

  const equalItemsWidth = exportBooleanToEnterprise(context, data.equalItemsWidth)
  if (equalItemsWidth !== undefined) result.ОдинаковаяШиринаЭлементов = equalItemsWidth

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible, {
    allow: UserVisibleKeysEnterprise.Allow,
    deny: UserVisibleKeysEnterprise.Deny,
  })
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const threeState = exportBooleanToEnterprise(context, data.threeState)
  if (threeState !== undefined) result.ТриСостояния = threeState

  const editFormat = exportI8nTextToEnterprise(context, data.editFormat)
  if (editFormat !== undefined) result.ФорматРедактирования = editFormat

  const borderColor = exportColorToEnterprise(context, data.borderColor)
  if (borderColor !== undefined) result.ЦветРамки = borderColor

  const textColor = exportColorToEnterprise(context, data.textColor)
  if (textColor !== undefined) result.ЦветТекста = textColor

  const backColor = exportColorToEnterprise(context, data.backColor)
  if (backColor !== undefined) result.ЦветФона = backColor

  if (data.itemWidth !== undefined) result.ШиринаЭлемента = data.itemWidth

  const font = exportFontToEnterprise(context, data.font)
  if (font !== undefined) result.Шрифт = font

  const events = exportEventsToEnterprise(context, data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata(
  "ExportPartialToEnterprise",
  "CheckBoxField",
  exportCheckBoxFieldPartialToEnterprise as ExportPartialToEnterpriseFn
)
registerMetadata(
  "ExportTypedToEnterprise",
  "CheckBoxField",
  exportCheckBoxFieldTypedToEnterprise as ExportTypedToEnterpriseFn
)
