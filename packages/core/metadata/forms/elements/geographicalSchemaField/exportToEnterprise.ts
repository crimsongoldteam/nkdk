import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/picture/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "~/metadata/commonObjects/typeDescription/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportContextMenuToEnterprise } from "~/metadata/forms/elements/contextMenu/exportToEnterprise"
import {
  GeographicalSchemaField,
  GeographicalSchemaFieldEnterprise,
  GeographicalSchemaFieldPartialEnterprise,
} from "~/metadata/forms/elements/geographicalSchemaField/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportPartialToEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { PropertyRule } from "../calendarField/rules"
import { exportExtendedTooltipToEnterprise } from "../extendedTooltip/exportToEnterprise"

type GeographicalSchemaFieldCommonFields = Omit<GeographicalSchemaField, "elementType" | "name">

export const exportGeographicalSchemaFieldPartialToEnterprise = <From extends GeographicalSchemaField | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: From
): ToPartialEnterpriseType<From> => {
  if (!data) return undefined as ToPartialEnterpriseType<From>

  const result: GeographicalSchemaFieldPartialEnterprise = {}

  const displayImportance = exportSystemEnumerationToYAML<SE.DisplayImportanceEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "DisplayImportance" },
    data.displayImportance
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const verticalAlign = exportSystemEnumerationToYAML<SE.ItemVerticalAlignEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ItemVerticalAlign" },
    data.verticalAlign
  )
  if (verticalAlign !== undefined) result.ВертикальноеПоложение = verticalAlign

  const verticalAlignInGroup = exportSystemEnumerationToYAML<SE.ItemVerticalAlignEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ItemVerticalAlign" },
    data.verticalAlignInGroup
  )
  if (verticalAlignInGroup !== undefined) result.ВертикальноеПоложениеВГруппе = verticalAlignInGroup

  const autoMaxWidth = exportBooleanToEnterprise(context, undefined, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

  const autoMaxHeight = exportBooleanToEnterprise(context, undefined, data.autoMaxHeight)
  if (autoMaxHeight !== undefined) result.АвтоМаксимальнаяВысота = autoMaxHeight

  const visible = exportBooleanToEnterprise(context, undefined, data.visible)
  if (visible !== undefined) result.Видимость = visible

  const enabled = exportBooleanToEnterprise(context, undefined, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const readOnly = exportBooleanToEnterprise(context, undefined, data.readOnly)
  if (readOnly !== undefined) result.ТолькоПросмотр = readOnly

  const contextMenu = exportContextMenuToEnterprise(context, undefined, data.contextMenu)
  if (contextMenu !== undefined) result.КонтекстноеМеню = contextMenu

  const toolTipRepresentation = exportSystemEnumerationToYAML<SE.ToolTipRepresentationEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ToolTipRepresentation" },
    data.toolTipRepresentation
  )
  if (toolTipRepresentation !== undefined) result.ОтображениеПодсказки = toolTipRepresentation

  const warningOnEditRepresentation = exportSystemEnumerationToYAML<SE.WarningOnEditRepresentationEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "WarningOnEditRepresentation" },
    data.warningOnEditRepresentation
  )
  if (warningOnEditRepresentation !== undefined)
    result.ОтображениеПредупрежденияПриРедактировании = warningOnEditRepresentation

  const toolTip = exportI8nTextToYAML(context, { type: "I8nText" }, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const warningOnEdit = exportI8nTextToYAML(context, { type: "I8nText" }, data.warningOnEdit)
  if (warningOnEdit !== undefined) result.ПредупреждениеПриРедактировании = warningOnEdit

  const extendedToolTip = exportExtendedTooltipToEnterprise(context, undefined, data.extendedTooltip)
  if (extendedToolTip !== undefined) result.РасширеннаяПодсказка = extendedToolTip

  const title = exportI8nTextToYAML(context, { type: "I8nText" }, data.title)
  if (title !== undefined) result.Заголовок = title

  const titleBackColor = exportColorToEnterprise(context, undefined, data.titleBackColor)
  if (titleBackColor !== undefined) result.ЦветФонаЗаголовка = titleBackColor

  const titleTextColor = exportColorToEnterprise(context, undefined, data.titleTextColor)
  if (titleTextColor !== undefined) result.ЦветТекстаЗаголовка = titleTextColor

  const titleFont = exportFontToEnterprise(context, undefined, data.titleFont)
  if (titleFont !== undefined) result.ШрифтЗаголовка = titleFont

  if (data.titleHeight !== undefined) result.ВысотаЗаголовка = data.titleHeight

  const titleLocation = exportSystemEnumerationToYAML<SE.FormItemTitleLocationEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "FormItemTitleLocation" },
    data.titleLocation
  )
  if (titleLocation !== undefined) result.ПоложениеЗаголовка = titleLocation

  const headerPicture = exportPictureToEnterprise(context, undefined, data.headerPicture)
  if (headerPicture !== undefined) result.КартинкаШапки = headerPicture

  const horizontalAlign = exportSystemEnumerationToYAML<SE.ItemHorizontalLocationEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ItemHorizontalLocation" },
    data.horizontalAlign
  )
  if (horizontalAlign !== undefined) result.ГоризонтальноеПоложение = horizontalAlign

  const horizontalAlignInGroup = exportSystemEnumerationToYAML<SE.ItemHorizontalLocationEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ItemHorizontalLocation" },
    data.horizontalAlignInGroup
  )
  if (horizontalAlignInGroup !== undefined) result.ГоризонтальноеПоложениеВГруппе = horizontalAlignInGroup

  const userVisible = exportUserVisibleToEnterprise(context, undefined, data.userVisible, {
    allow: UserVisibleKeysEnterprise.Allow,
    deny: UserVisibleKeysEnterprise.Deny,
  })
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const horizontalStretch = exportBooleanToEnterprise(context, undefined, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  const verticalStretch = exportBooleanToEnterprise(context, undefined, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const autoUpdate = exportBooleanToEnterprise(context, undefined, data.autoUpdate)
  if (autoUpdate !== undefined) result.АвтоОбновление = autoUpdate

  const defaultItem = exportBooleanToEnterprise(context, undefined, data.defaultItem)
  if (defaultItem !== undefined) result.АктивизироватьПоУмолчанию = defaultItem

  const editMode = exportSystemEnumerationToYAML<SE.ColumnEditModeEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ColumnEditMode" },
    data.editMode
  )
  if (editMode !== undefined) result.РежимРедактирования = editMode

  const fixingInTable = exportSystemEnumerationToYAML<SE.FixingInTableEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "FixingInTable" },
    data.fixingInTable
  )
  if (fixingInTable !== undefined) result.ФиксацияВТаблице = fixingInTable

  if (data.dataPath !== undefined) result.ПутьКДанным = data.dataPath

  if (data.table !== undefined) result.Таблица = data.table

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  const skipOnInput = exportBooleanToEnterprise(context, undefined, data.skipOnInput)
  if (skipOnInput !== undefined) result.ПропускатьПриВводе = skipOnInput

  const showInHeader = exportBooleanToEnterprise(context, undefined, data.showInHeader)
  if (showInHeader !== undefined) result.ОтображатьВШапке = showInHeader

  const typeRestriction = exportTypeDescriptionToEnterprise(context, undefined, data.typeRestriction)
  if (typeRestriction !== undefined) result.ОграничениеТипа = typeRestriction

  const typeField = exportSystemEnumerationToYAML<SE.FormFieldTypeEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "FormFieldType" },
    data.type
  )
  if (typeField !== undefined) result.Вид = typeField

  if (data.width !== undefined) result.Ширина = data.width

  if (data.height !== undefined) result.Высота = data.height

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  if (data.maxHeight !== undefined) result.МаксимальнаяВысота = data.maxHeight

  if (Object.keys(result).length === 0) return undefined as ToPartialEnterpriseType<From>

  return result as ToPartialEnterpriseType<From>
}

const exportGeographicalSchemaFieldCommonFieldsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: GeographicalSchemaFieldCommonFields
): GeographicalSchemaFieldEnterprise => {
  const result: GeographicalSchemaFieldEnterprise = {}

  const displayImportance = exportSystemEnumerationToYAML<SE.DisplayImportanceEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "DisplayImportance" },
    data.displayImportance
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const verticalAlign = exportSystemEnumerationToYAML<SE.ItemVerticalAlignEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ItemVerticalAlign" },
    data.verticalAlign
  )
  if (verticalAlign !== undefined) result.ВертикальноеПоложение = verticalAlign

  const autoMaxWidth = exportBooleanToEnterprise(context, undefined, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

  const autoMaxHeight = exportBooleanToEnterprise(context, undefined, data.autoMaxHeight)
  if (autoMaxHeight !== undefined) result.АвтоМаксимальнаяВысота = autoMaxHeight

  const visible = exportBooleanToEnterprise(context, undefined, data.visible)
  if (visible !== undefined) result.Видимость = visible

  const enabled = exportBooleanToEnterprise(context, undefined, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const readOnly = exportBooleanToEnterprise(context, undefined, data.readOnly)
  if (readOnly !== undefined) result.ТолькоПросмотр = readOnly

  const contextMenu = exportContextMenuToEnterprise(context, undefined, data.contextMenu)
  if (contextMenu !== undefined) result.КонтекстноеМеню = contextMenu

  const toolTipRepresentation = exportSystemEnumerationToYAML<SE.ToolTipRepresentationEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ToolTipRepresentation" },
    data.toolTipRepresentation
  )
  if (toolTipRepresentation !== undefined) result.ОтображениеПодсказки = toolTipRepresentation

  const toolTip = exportI8nTextToYAML(context, { type: "I8nText" }, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const extendedToolTip = exportExtendedTooltipToEnterprise(context, undefined, data.extendedTooltip)
  if (extendedToolTip !== undefined) result.РасширеннаяПодсказка = extendedToolTip

  const title = exportI8nTextToYAML(context, { type: "I8nText" }, data.title)
  if (title !== undefined) result.Заголовок = title

  const titleBackColor = exportColorToEnterprise(context, undefined, data.titleBackColor)
  if (titleBackColor !== undefined) result.ЦветФонаЗаголовка = titleBackColor

  const titleTextColor = exportColorToEnterprise(context, undefined, data.titleTextColor)
  if (titleTextColor !== undefined) result.ЦветТекстаЗаголовка = titleTextColor

  const titleFont = exportFontToEnterprise(context, undefined, data.titleFont)
  if (titleFont !== undefined) result.ШрифтЗаголовка = titleFont

  if (data.titleHeight !== undefined) result.ВысотаЗаголовка = data.titleHeight

  const titleLocation = exportSystemEnumerationToYAML<SE.FormItemTitleLocationEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "FormItemTitleLocation" },
    data.titleLocation
  )
  if (titleLocation !== undefined) result.ПоложениеЗаголовка = titleLocation

  const headerPicture = exportPictureToEnterprise(context, undefined, data.headerPicture)
  if (headerPicture !== undefined) result.КартинкаШапки = headerPicture

  const horizontalAlign = exportSystemEnumerationToYAML<SE.ItemHorizontalLocationEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ItemHorizontalLocation" },
    data.horizontalAlign
  )
  if (horizontalAlign !== undefined) result.ГоризонтальноеПоложение = horizontalAlign

  const horizontalAlignInGroup = exportSystemEnumerationToYAML<SE.ItemHorizontalLocationEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ItemHorizontalLocation" },
    data.horizontalAlignInGroup
  )
  if (horizontalAlignInGroup !== undefined) result.ГоризонтальноеПоложениеВГруппе = horizontalAlignInGroup

  const userVisible = exportUserVisibleToEnterprise(context, undefined, data.userVisible, {
    allow: UserVisibleKeysEnterprise.Allow,
    deny: UserVisibleKeysEnterprise.Deny,
  })
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const horizontalStretch = exportBooleanToEnterprise(context, undefined, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  const verticalStretch = exportBooleanToEnterprise(context, undefined, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const autoUpdate = exportBooleanToEnterprise(context, undefined, data.autoUpdate)
  if (autoUpdate !== undefined) result.АвтоОбновление = autoUpdate

  const defaultItem = exportBooleanToEnterprise(context, undefined, data.defaultItem)
  if (defaultItem !== undefined) result.АктивизироватьПоУмолчанию = defaultItem

  const editMode = exportSystemEnumerationToYAML<SE.ColumnEditModeEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ColumnEditMode" },
    data.editMode
  )
  if (editMode !== undefined) result.РежимРедактирования = editMode

  const fixingInTable = exportSystemEnumerationToYAML<SE.FixingInTableEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "FixingInTable" },
    data.fixingInTable
  )
  if (fixingInTable !== undefined) result.ФиксацияВТаблице = fixingInTable

  if (data.dataPath !== undefined) result.ПутьКДанным = data.dataPath

  if (data.table !== undefined) result.Таблица = data.table

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  const skipOnInput = exportBooleanToEnterprise(context, undefined, data.skipOnInput)
  if (skipOnInput !== undefined) result.ПропускатьПриВводе = skipOnInput

  const showInHeader = exportBooleanToEnterprise(context, undefined, data.showInHeader)
  if (showInHeader !== undefined) result.ОтображатьВШапке = showInHeader

  const typeRestriction = exportTypeDescriptionToEnterprise(context, undefined, data.typeRestriction)
  if (typeRestriction !== undefined) result.ОграничениеТипа = typeRestriction

  const typeField = exportSystemEnumerationToYAML<SE.FormFieldTypeEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "FormFieldType" },
    data.type
  )
  if (typeField !== undefined) result.Вид = typeField

  if (data.width !== undefined) result.Ширина = data.width

  if (data.height !== undefined) result.Высота = data.height

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  if (data.maxHeight !== undefined) result.МаксимальнаяВысота = data.maxHeight

  return result
}

registerMetadata(
  "ExportPartialToEnterprise",
  "GeographicalSchemaField",
  exportGeographicalSchemaFieldPartialToEnterprise as ExportPartialToEnterpriseFn
)
