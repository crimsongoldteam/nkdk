import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
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
import { exportExtendedTooltipToEnterprise } from "~/metadata/forms/elements/extendedTooltip/exportToEnterprise"
import { Popup, PopupPartialEnterprise, PopupTypedEnterprise } from "~/metadata/forms/elements/popup/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  ExportPartialToEnterpriseFn,
  ExportTypedToEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportTypedChildItemsToEnterprise } from "../../collections/childItems/exportToEnterprise"
import { PropertyRule } from "../calendarField/rules"

export const exportPopupTypedToEnterprise = <From extends Popup | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToTypedEnterpriseType<From> => {
  if (data === undefined) return undefined as ToTypedEnterpriseType<From>

  const props = exportPopupPropsToEnterprise(context, undefined, data)

  const result: PopupTypedEnterprise = {
    Тип: "Подменю",
    ...props,
  }

  const title = exportI8nTextToYAML(context, undefined, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToTypedEnterpriseType<From>
}

export const exportPopupPartialToEnterprise = <From extends Popup | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToPartialEnterpriseType<From> => {
  if (data === undefined) return undefined as ToPartialEnterpriseType<From>

  const props = exportPopupPropsToEnterprise(context, undefined, data)

  const result: PopupPartialEnterprise = {
    ...props,
  }

  const title = exportI8nTextOtherToEnterprise(context, undefined, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToPartialEnterpriseType<From>
}

const exportPopupPropsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: Popup
): PopupPartialEnterprise => {
  const result: PopupPartialEnterprise = {}

  const verticalAlignInGroup = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.verticalAlignInGroup,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.ВертикальноеПоложениеВГруппе = verticalAlignInGroup

  const type = exportSystemEnumerationToEnterprise(context, undefined, data.type, SE.FormGroupTypeToEnterprise)
  if (type !== undefined) result.Вид = type

  const visible = exportBooleanToEnterprise(context, undefined, data.visible)
  if (visible !== undefined) result.Видимость = visible

  if (data.height !== undefined) result.Высота = data.height

  const horizontalAlignInGroup = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.horizontalAlignInGroup,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.ГоризонтальноеПоложениеВГруппе = horizontalAlignInGroup

  const enabled = exportBooleanToEnterprise(context, undefined, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const toolTipRepresentation = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.toolTipRepresentation,
    SE.ToolTipRepresentationToEnterprise
  )
  if (toolTipRepresentation !== undefined) result.ОтображениеПодсказки = toolTipRepresentation

  const toolTip = exportI8nTextToYAML(context, undefined, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const userVisible = exportUserVisibleToEnterprise(context, undefined, data.userVisible, {
    allow: UserVisibleKeysEnterprise.Allow,
    deny: UserVisibleKeysEnterprise.Deny,
  })
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const enableContentChange = exportBooleanToEnterprise(context, undefined, data.enableContentChange)
  if (enableContentChange !== undefined) result.РазрешитьИзменениеСостава = enableContentChange

  const verticalStretch = exportBooleanToEnterprise(context, undefined, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, undefined, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  const readOnly = exportBooleanToEnterprise(context, undefined, data.readOnly)
  if (readOnly !== undefined) result.ТолькоПросмотр = readOnly

  const titleTextColor = exportColorToEnterprise(context, undefined, data.titleTextColor)
  if (titleTextColor !== undefined) result.ЦветТекстаЗаголовка = titleTextColor

  if (data.width !== undefined) result.Ширина = data.width

  const titleFont = exportFontToEnterprise(context, undefined, data.titleFont)
  if (titleFont !== undefined) result.ШрифтЗаголовка = titleFont

  const extendedTooltip = exportExtendedTooltipToEnterprise(context, undefined, data.extendedTooltip)
  if (extendedTooltip !== undefined) result.РасширеннаяПодсказка = extendedTooltip

  const picture = exportPictureToEnterprise(context, undefined, data.picture)
  if (picture !== undefined) result.Картинка = picture

  const representation = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.representation,
    SE.ButtonRepresentationToEnterprise
  )
  if (representation !== undefined) result.Отображение = representation

  const shapeRepresentation = exportSystemEnumerationToEnterprise(
    context,
    undefined,
    data.shapeRepresentation,
    SE.ButtonShapeRepresentationToEnterprise
  )
  if (shapeRepresentation !== undefined) result.ОтображениеФигуры = shapeRepresentation

  const shape = exportSystemEnumerationToEnterprise(context, undefined, data.shape, SE.ButtonShapeToEnterprise)
  if (shape !== undefined) result.Фигура = shape

  const borderColor = exportColorToEnterprise(context, undefined, data.borderColor)
  if (borderColor !== undefined) result.ЦветРамки = borderColor

  const backColor = exportColorToEnterprise(context, undefined, data.backColor)
  if (backColor !== undefined) result.ЦветФона = backColor

  const childItems = exportTypedChildItemsToEnterprise(context, undefined, data.childItems)
  if (childItems !== undefined) result.ПодчиненныеЭлементы = childItems

  return result
}

registerMetadata("ExportPartialToEnterprise", "Popup", exportPopupPartialToEnterprise as ExportPartialToEnterpriseFn)
registerMetadata("ExportTypedToEnterprise", "Popup", exportPopupTypedToEnterprise as ExportTypedToEnterpriseFn)
