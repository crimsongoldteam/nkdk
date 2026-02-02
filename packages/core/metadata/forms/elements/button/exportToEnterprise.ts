import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import {
  exportI8nTextOtherToEnterprise,
  exportI8nTextToEnterprise,
} from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/picture/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
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
import { Button, ButtonPartialEnterprise, ButtonTypedEnterprise } from "./types"

export const exportButtonTypedToEnterprise = <From extends Button | undefined>(
  context: ConfigurationContext,
  data: From
): ToTypedEnterpriseType<From> => {
  if (data === undefined) return undefined as ToTypedEnterpriseType<From>

  const props = exportButtonPropsToEnterprise(context, data)

  const result: ButtonTypedEnterprise = {
    Тип: "Кнопка",
    ...props,
  }

  const title = exportI8nTextToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToTypedEnterpriseType<From>
}

export const exportButtonPartialToEnterprise = <From extends Button | undefined>(
  context: ConfigurationContext,
  data: From
): ToPartialEnterpriseType<From> => {
  if (data === undefined) return undefined as ToPartialEnterpriseType<From>

  const result = exportButtonPropsToEnterprise(context, data)

  const title = exportI8nTextOtherToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToPartialEnterpriseType<From>
}

const exportButtonPropsToEnterprise = (context: ConfigurationContext, data: Button): ButtonPartialEnterprise => {
  const result: ButtonPartialEnterprise = {}

  const autoMaxHeight = exportBooleanToEnterprise(context, data.autoMaxHeight)
  if (autoMaxHeight !== undefined) result.АвтоМаксимальнаяВысота = autoMaxHeight

  const autoMaxWidth = exportBooleanToEnterprise(context, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

  const defaultItem = exportBooleanToEnterprise(context, data.defaultItem)
  if (defaultItem !== undefined) result.АктивизироватьПоУмолчанию = defaultItem

  const displayImportance = exportSystemEnumerationToYAML(
    context,
    data.displayImportance,
    SE.DisplayImportanceToEnterprise
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const verticalAlignInGroup = exportSystemEnumerationToYAML(
    context,
    data.verticalAlignInGroup,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.ВертикальноеПоложениеВГруппе = verticalAlignInGroup

  const type = exportSystemEnumerationToYAML(context, data.type, SE.FormButtonTypeToEnterprise)
  if (type !== undefined) result.Вид = type

  const visible = exportBooleanToEnterprise(context, data.visible)
  if (visible !== undefined) result.Видимость = visible

  if (data.height !== undefined) result.Высота = data.height

  if (data.titleHeight !== undefined) result.ВысотаЗаголовка = data.titleHeight

  const horizontalAlignInGroup = exportSystemEnumerationToYAML(
    context,
    data.horizontalAlignInGroup,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.ГоризонтальноеПоложениеВГруппе = horizontalAlignInGroup

  const enabled = exportBooleanToEnterprise(context, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  if (data.commandName !== undefined) result.ИмяКоманды = data.commandName

  const picture = exportPictureToEnterprise(context, data.picture)
  if (picture !== undefined) result.Картинка = picture

  const defaultButton = exportBooleanToEnterprise(context, data.defaultButton)
  if (defaultButton !== undefined) result.КнопкаПоУмолчанию = defaultButton

  if (data.maxHeight !== undefined) result.МаксимальнаяВысота = data.maxHeight

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  const representation = exportSystemEnumerationToYAML(
    context,
    data.representation,
    SE.ButtonRepresentationToEnterprise
  )
  if (representation !== undefined) result.Отображение = representation

  const toolTipRepresentation = exportSystemEnumerationToYAML(
    context,
    data.toolTipRepresentation,
    SE.ToolTipRepresentationToEnterprise
  )
  if (toolTipRepresentation !== undefined) result.ОтображениеПодсказки = toolTipRepresentation

  const shapeRepresentation = exportSystemEnumerationToYAML(
    context,
    data.shapeRepresentation,
    SE.ButtonShapeRepresentationToEnterprise
  )
  if (shapeRepresentation !== undefined) result.ОтображениеФигуры = shapeRepresentation

  const locationInCommandBar = exportSystemEnumerationToYAML(
    context,
    data.locationInCommandBar,
    SE.ButtonLocationInCommandBarToEnterprise
  )
  if (locationInCommandBar !== undefined) result.ПоложениеВКоманднойПанели = locationInCommandBar

  const pictureLocation = exportSystemEnumerationToYAML(
    context,
    data.pictureLocation,
    SE.FormButtonPictureLocationToEnterprise
  )
  if (pictureLocation !== undefined) result.ПоложениеКартинки = pictureLocation

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible, {
    allow: UserVisibleKeysEnterprise.Allow,
    deny: UserVisibleKeysEnterprise.Deny,
  })
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const skipOnInput = exportBooleanToEnterprise(context, data.skipOnInput)
  if (skipOnInput !== undefined) result.ПропускатьПриВводе = skipOnInput

  if (data.dataPath !== undefined) result.ПутьКДанным = data.dataPath

  const verticalStretch = exportBooleanToEnterprise(context, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  const extendedTooltip = exportExtendedTooltipToEnterprise(context, data.extendedTooltip)
  if (extendedTooltip !== undefined) result.РасширеннаяПодсказка = extendedTooltip

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  const onlyInAllActions = exportBooleanToEnterprise(context, data.onlyInAllActions)
  if (onlyInAllActions !== undefined) result.ТолькоВоВсехДействиях = onlyInAllActions

  const commandUniqueness = exportBooleanToEnterprise(context, data.commandUniqueness)
  if (commandUniqueness !== undefined) result.УникальностьКоманды = commandUniqueness

  const shape = exportSystemEnumerationToYAML(context, data.shape, SE.ButtonShapeToEnterprise)
  if (shape !== undefined) result.Фигура = shape

  const borderColor = exportColorToEnterprise(context, data.borderColor)
  if (borderColor !== undefined) result.ЦветРамки = borderColor

  const textColor = exportColorToEnterprise(context, data.textColor)
  if (textColor !== undefined) result.ЦветТекста = textColor

  const backColor = exportColorToEnterprise(context, data.backColor)
  if (backColor !== undefined) result.ЦветФона = backColor

  if (data.width !== undefined) result.Ширина = data.width

  const font = exportFontToEnterprise(context, data.font)
  if (font !== undefined) result.Шрифт = font

  return result
}

registerMetadata("ExportPartialToEnterprise", "Button", exportButtonPartialToEnterprise as ExportPartialToEnterpriseFn)
registerMetadata("ExportTypedToEnterprise", "Button", exportButtonTypedToEnterprise as ExportTypedToEnterpriseFn)
