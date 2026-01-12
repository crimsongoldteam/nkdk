import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportBaseElementToEnterprise } from "~/metadata/forms/elements/baseElement/exportToEnterprise"
import { FormGroup, FormGroupPropsEnterprise } from "~/metadata/forms/elements/formGroup/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportExtendedTooltipToEnterprise } from "../extendedTooltip/exportToEnterprise"

export const exportFormGroupToEnterprise = (
  context: ConfigurationContext,
  data: FormGroup | undefined
): FormGroupPropsEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportBaseElementToEnterprise(context, data)

  const result: FormGroupPropsEnterprise = {
    ...baseFields,
  }

  const verticalAlignInGroup = exportSystemEnumerationToEnterprise(
    context,
    data.verticalAlignInGroup,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.ВертикальноеПоложениеВГруппе = verticalAlignInGroup

  const type = exportSystemEnumerationToEnterprise(context, data.type, SE.FormGroupTypeToEnterprise)
  if (type !== undefined) result.Вид = type

  const visible = exportBooleanToEnterprise(context, data.visible)
  if (visible !== undefined) result.Видимость = visible

  if (data.height !== undefined) result.Высота = data.height

  const horizontalAlignInGroup = exportSystemEnumerationToEnterprise(
    context,
    data.horizontalAlignInGroup,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.ГоризонтальноеПоложениеВГруппе = horizontalAlignInGroup

  const enabled = exportBooleanToEnterprise(context, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const title = exportI8nTextToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  const toolTipRepresentation = exportSystemEnumerationToEnterprise(
    context,
    data.toolTipRepresentation,
    SE.ToolTipRepresentationToEnterprise
  )
  if (toolTipRepresentation !== undefined) result.ОтображениеПодсказки = toolTipRepresentation

  const toolTip = exportI8nTextToEnterprise(context, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  // const childItems = exportChildItemsToEnterprise(context, data.childItems)
  // if (childItems !== undefined) result.ПодчиненныеЭлементы = childItems

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const enableContentChange = exportBooleanToEnterprise(context, data.enableContentChange)
  if (enableContentChange !== undefined) result.РазрешитьИзменениеСостава = enableContentChange

  const verticalStretch = exportBooleanToEnterprise(context, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  const extendedTooltip = exportExtendedTooltipToEnterprise(context, data.extendedTooltip)
  if (extendedTooltip !== undefined) result.РасширеннаяПодсказка = extendedTooltip

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  const readOnly = exportBooleanToEnterprise(context, data.readOnly)
  if (readOnly !== undefined) result.ТолькоПросмотр = readOnly

  const titleTextColor = exportColorToEnterprise(context, data.titleTextColor)
  if (titleTextColor !== undefined) result.ЦветТекстаЗаголовка = titleTextColor

  if (data.width !== undefined) result.Ширина = data.width

  const titleFont = exportFontToEnterprise(context, data.titleFont)
  if (titleFont !== undefined) result.ШрифтЗаголовка = titleFont

  return result
}

registerMetadata("ExportToEnterprise", "FormGroup", exportFormGroupToEnterprise)
