import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { CommandBar, CommandBarPartialEnterprise } from "~/metadata/forms/elements/commandBar/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportPartialToEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportBaseElementToEnterprise } from "../baseElement/exportToEnterprise"
import { PropertyRule } from "../calendarField/rules"

// export const exportCommandBarTypedToEnterprise = <From extends CommandBar | undefined>(
//   context: ConfigurationContext,
//_rule: PropertyRule | undefined,
//   data: From
// ): ToTypedEnterpriseType<From> => {
//   if (data === undefined) return undefined as ToTypedEnterpriseType<From>

//   const props = exportCommandBarPropsToEnterprise(context, undefined, data)

//   const result: CommandBarTypedEnterprise = {
//     Тип: "КоманднаяПанель",
//     ...props,
//   }

//   const title = exportI8nTextToEnterprise(context, undefined, data.title)
//   if (title !== undefined) result.Заголовок = title

//   return sortObject(result) as ToTypedEnterpriseType<From>
// }

export const exportCommandBarPartialToEnterprise = <From extends CommandBar | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToPartialEnterpriseType<From> => {
  if (data === undefined) return undefined as ToPartialEnterpriseType<From>

  const props = exportCommandBarPropsToEnterprise(context, undefined, data)

  const result: CommandBarPartialEnterprise = {
    ...props,
  }

  const title = exportI8nTextToEnterprise(context, undefined, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result) as ToPartialEnterpriseType<From>
}

const exportCommandBarPropsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: CommandBar
): CommandBarPartialEnterprise => {
  const baseFields = exportBaseElementToEnterprise(context, undefined, data)

  const result: CommandBarPartialEnterprise = {
    ...baseFields,
  }

  const verticalAlignInGroup = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.verticalAlignInGroup,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.ВертикальноеПоложениеВГруппе = verticalAlignInGroup

  const type = exportSystemEnumerationToYAML(context, undefined, data.type, SE.FormGroupTypeToEnterprise)
  if (type !== undefined) result.Вид = type

  const visible = exportBooleanToEnterprise(context, undefined, data.visible)
  if (visible !== undefined) result.Видимость = visible

  if (data.height !== undefined) result.Высота = data.height

  const horizontalAlignInGroup = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.horizontalAlignInGroup,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.ГоризонтальноеПоложениеВГруппе = horizontalAlignInGroup

  const enabled = exportBooleanToEnterprise(context, undefined, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const toolTipRepresentation = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.toolTipRepresentation,
    SE.ToolTipRepresentationToEnterprise
  )
  if (toolTipRepresentation !== undefined) result.ОтображениеПодсказки = toolTipRepresentation

  const toolTip = exportI8nTextToEnterprise(context, undefined, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

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

  if (data.commandSource !== undefined) result.ИсточникКоманд = data.commandSource

  const titleFont = exportFontToEnterprise(context, undefined, data.titleFont)
  if (titleFont !== undefined) result.ШрифтЗаголовка = titleFont

  const autofill = exportBooleanToEnterprise(context, undefined, data.autofill)
  if (autofill !== undefined) result.Автозаполнение = autofill

  const displayImportance = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.displayImportance,
    SE.DisplayImportanceToEnterprise
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const horizontalAlign = exportSystemEnumerationToYAML(
    context,
    undefined,
    data.horizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlign !== undefined) result.ГоризонтальноеПоложение = horizontalAlign

  const userVisible = exportUserVisibleToEnterprise(context, undefined, data.userVisible, {
    allow: UserVisibleKeysEnterprise.Allow,
    deny: UserVisibleKeysEnterprise.Deny,
  })
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  // const childItems = exportButtonGroupChildItemsToEnterprise(context, undefined, data.childItems)
  // if (childItems !== undefined) result.ПодчиненныеЭлементы = childItems

  return result
}

registerMetadata(
  "ExportPartialToEnterprise",
  "CommandBar",
  exportCommandBarPartialToEnterprise as ExportPartialToEnterpriseFn
)

// registerMetadata(
//   "ExportTypedToEnterprise",
//   "CommandBar",
//   exportCommandBarTypedToEnterprise as ExportTypedToEnterpriseFn
// )
