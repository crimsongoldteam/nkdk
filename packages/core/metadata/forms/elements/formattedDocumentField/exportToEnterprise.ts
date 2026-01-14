import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import {
  FormattedDocumentField,
  FormattedDocumentFieldPartialEnterprise,
  FormattedDocumentFieldTypedEnterprise,
} from "~/metadata/forms/elements/formattedDocumentField/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ToPartialEnterpriseType, ToTypedEnterpriseType } from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"


export function exportFormattedDocumentFieldTypedToEnterprise<From extends FormattedDocumentField | undefined>(
  context: ConfigurationContext,
  data: From
): ToTypedEnterpriseType<From> {
  if (data === undefined) return undefined as ToTypedEnterpriseType<From>

  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportFormattedDocumentFieldPropsToEnterprise(context, data)

  const result: FormattedDocumentFieldTypedEnterprise = {
    Тип: "ПолеФорматированногоДокумента",
    ...baseFields,
    ...props,
  }

  return sortObject(result) as ToTypedEnterpriseType<From>
}

export function exportFormattedDocumentFieldPartialToEnterprise<From extends FormattedDocumentField | undefined>(
  context: ConfigurationContext,
  data: From
): ToPartialEnterpriseType<From> {
  if (data === undefined) return undefined as ToPartialEnterpriseType<From>

  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportFormattedDocumentFieldPropsToEnterprise(context, data)

  const result: FormattedDocumentFieldPartialEnterprise = {
    ...baseFields,
    ...props,
  }

  return sortObject(result) as ToPartialEnterpriseType<From>
}

const exportFormattedDocumentFieldPropsToEnterprise = (
  context: ConfigurationContext,
  data: FormattedDocumentField
): FormattedDocumentFieldPartialEnterprise => {
  const result: FormattedDocumentFieldPartialEnterprise = {}

  const autoMaxHeight = exportBooleanToEnterprise(context, data.autoMaxHeight)
  if (autoMaxHeight !== undefined) result.АвтоМаксимальнаяВысота = autoMaxHeight

  const autoMaxWidth = exportBooleanToEnterprise(context, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

  const output = exportSystemEnumerationToEnterprise(context, data.output, SE.UseOutputToEnterprise)
  if (output !== undefined) result.Вывод = output

  if (data.selectedText !== undefined) result.ВыделенныйТекст = data.selectedText

  if (data.height !== undefined) result.Высота = data.height

  if (data.maxHeight !== undefined) result.МаксимальнаяВысота = data.maxHeight

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const verticalStretch = exportBooleanToEnterprise(context, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  const borderColor = exportColorToEnterprise(context, data.borderColor)
  if (borderColor !== undefined) result.ЦветРамки = borderColor

  const textColor = exportColorToEnterprise(context, data.textColor)
  if (textColor !== undefined) result.ЦветТекста = textColor

  const backColor = exportColorToEnterprise(context, data.backColor)
  if (backColor !== undefined) result.ЦветФона = backColor

  if (data.width !== undefined) result.Ширина = data.width

  const font = exportFontToEnterprise(context, data.font)
  if (font !== undefined) result.Шрифт = font

  const events = exportEventsToEnterprise(context, data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata("ExportPartialToEnterprise", "FormattedDocumentField", exportFormattedDocumentFieldPartialToEnterprise)
registerMetadata("ExportTypedToEnterprise", "FormattedDocumentField", exportFormattedDocumentFieldTypedToEnterprise)
