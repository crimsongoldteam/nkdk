import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import {
  exportI8nTextOtherToEnterprise,
  exportI8nTextToYAML,
} from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/picture/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  PictureDecoration,
  PictureDecorationPartialEnterprise,
  PictureDecorationTypedEnterprise,
} from "~/metadata/forms/elements/pictureDecoration/types"
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
import { PropertyRule } from "../calendarField/rules"
import { exportContextMenuToEnterprise } from "../contextMenu/exportToEnterprise"
import { exportExtendedTooltipToEnterprise } from "../extendedTooltip/exportToEnterprise"

export const exportPictureDecorationTypedToEnterprise = <From extends PictureDecoration | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: From
): ToTypedEnterpriseType<From> => {
  if (data === undefined) return undefined as ToTypedEnterpriseType<From>

  const props = exportPictureDecorationPropsToEnterprise(context, undefined, data)

  const result: PictureDecorationTypedEnterprise = {
    Тип: "Рисунок",
    ...props,
  }

  const title = exportI8nTextToYAML(context, undefined, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToTypedEnterpriseType<From>
}

export const exportPictureDecorationPartialToEnterprise = <From extends PictureDecoration | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: From
): ToPartialEnterpriseType<From> => {
  if (data === undefined) return undefined as ToPartialEnterpriseType<From>

  const props = exportPictureDecorationPropsToEnterprise(context, undefined, data)

  const result: PictureDecorationPartialEnterprise = {
    ...props,
  }

  const title = exportI8nTextOtherToEnterprise(context, undefined, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToPartialEnterpriseType<From>
}

const exportPictureDecorationPropsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: PictureDecoration
): PictureDecorationPartialEnterprise => {
  const result: PictureDecorationPartialEnterprise = {}

  const autoMaxHeight = exportBooleanToEnterprise(context, undefined, data.autoMaxHeight)
  if (autoMaxHeight !== undefined) result.АвтоМаксимальнаяВысота = autoMaxHeight

  const autoMaxWidth = exportBooleanToEnterprise(context, undefined, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

  const displayImportance = exportSystemEnumerationToYAML<SE.DisplayImportanceEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "DisplayImportance" },
    data.displayImportance
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const verticalAlignInGroup = exportSystemEnumerationToYAML<SE.ItemVerticalAlignEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ItemVerticalAlign" },
    data.verticalAlignInGroup
  )
  if (verticalAlignInGroup !== undefined) result.ВертикальноеПоложениеВГруппе = verticalAlignInGroup

  const type = exportSystemEnumerationToYAML<SE.FormDecorationTypeEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "FormDecorationType" },
    data.type
  )
  if (type !== undefined) result.Вид = type

  const visible = exportBooleanToEnterprise(context, undefined, data.visible)
  if (visible !== undefined) result.Видимость = visible

  if (data.height !== undefined) result.Высота = data.height

  const horizontalAlignInGroup = exportSystemEnumerationToYAML<SE.ItemHorizontalLocationEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ItemHorizontalLocation" },
    data.horizontalAlignInGroup
  )
  if (horizontalAlignInGroup !== undefined) result.ГоризонтальноеПоложениеВГруппе = horizontalAlignInGroup

  const enabled = exportBooleanToEnterprise(context, undefined, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const contextMenu = exportContextMenuToEnterprise(context, undefined, data.contextMenu)
  if (contextMenu !== undefined) result.КонтекстноеМеню = contextMenu

  if (data.maxHeight !== undefined) result.МаксимальнаяВысота = data.maxHeight

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  const toolTipRepresentation = exportSystemEnumerationToYAML<SE.ToolTipRepresentationEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "ToolTipRepresentation" },
    data.toolTipRepresentation
  )
  if (toolTipRepresentation !== undefined) result.ОтображениеПодсказки = toolTipRepresentation

  const toolTip = exportI8nTextToYAML(context, undefined, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const skipOnInput = exportBooleanToEnterprise(context, undefined, data.skipOnInput)
  if (skipOnInput !== undefined) result.ПропускатьПриВводе = skipOnInput

  const verticalStretch = exportBooleanToEnterprise(context, undefined, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, undefined, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  const extendedTooltip = exportExtendedTooltipToEnterprise(context, undefined, data.extendedTooltip)
  if (extendedTooltip !== undefined) result.РасширеннаяПодсказка = extendedTooltip

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  const textColor = exportColorToEnterprise(context, undefined, data.textColor)
  if (textColor !== undefined) result.ЦветТекста = textColor

  if (data.width !== undefined) result.Ширина = data.width

  const font = exportFontToEnterprise(context, undefined, data.font)
  if (font !== undefined) result.Шрифт = font

  const hyperlink = exportBooleanToEnterprise(context, undefined, data.hyperlink)
  if (hyperlink !== undefined) result.Гиперссылка = hyperlink

  const picture = exportPictureToEnterprise(context, undefined, data.picture)
  if (picture !== undefined) result.Картинка = picture

  if (data.scale !== undefined) result.Масштаб = data.scale

  const zoomable = exportBooleanToEnterprise(context, undefined, data.zoomable)
  if (zoomable !== undefined) result.Масштабировать = zoomable

  const userVisible = exportUserVisibleToEnterprise(context, undefined, data.userVisible, {
    allow: UserVisibleKeysEnterprise.Allow,
    deny: UserVisibleKeysEnterprise.Deny,
  })
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const pictureSize = exportSystemEnumerationToYAML<SE.PictureSizeEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "PictureSize" },
    data.pictureSize
  )
  if (pictureSize !== undefined) result.РазмерКартинки = pictureSize

  const enableStartDrag = exportBooleanToEnterprise(context, undefined, data.enableStartDrag)
  if (enableStartDrag !== undefined) result.РазрешитьНачалоПеретаскивания = enableStartDrag

  const enableDrag = exportBooleanToEnterprise(context, undefined, data.enableDrag)
  if (enableDrag !== undefined) result.РазрешитьПеретаскивание = enableDrag

  const border = exportBorderToEnterprise(context, undefined, data.border)
  if (border !== undefined) result.Рамка = border

  const fileDragMode = exportSystemEnumerationToYAML<SE.FileDragModeEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "FileDragMode" },
    data.fileDragMode
  )
  if (fileDragMode !== undefined) result.СпособПеретаскиванияФайлов = fileDragMode

  if (data.nonselectedPictureText !== undefined) result.ТекстНевыбраннойКартинки = data.nonselectedPictureText

  const borderColor = exportColorToEnterprise(context, undefined, data.borderColor)
  if (borderColor !== undefined) result.ЦветРамки = borderColor

  const events = exportEventsToEnterprise(context, undefined, data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata(
  "ExportPartialToEnterprise",
  "PictureDecoration",
  exportPictureDecorationPartialToEnterprise as ExportPartialToEnterpriseFn
)

registerMetadata(
  "ExportTypedToEnterprise",
  "PictureDecoration",
  exportPictureDecorationTypedToEnterprise as ExportTypedToEnterpriseFn
)
