import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import { PdfDocumentField, PdfDocumentFieldEnterprise } from "~/metadata/forms/elements/pdfDocumentField/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportPdfDocumentFieldToEnterprise = (
  context: ConfigurationContext,
  data: PdfDocumentField | undefined
): PdfDocumentFieldEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportFormFieldToEnterprise(context, data)

  const result: PdfDocumentFieldEnterprise = {
    ...baseFields,
  }

  const autoMaxHeight = exportBooleanToEnterprise(context, data.autoMaxHeight)
  if (autoMaxHeight !== undefined) result.АвтоМаксимальнаяВысота = autoMaxHeight

  const autoMaxWidth = exportBooleanToEnterprise(context, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

  const output = exportSystemEnumerationToEnterprise(context, data.output, SE.UseOutputToEnterprise)
  if (output !== undefined) result.Вывод = output

  if (data.height !== undefined) result.Высота = data.height

  if (data.usedFileName !== undefined) result.ИспользуемоеИмяФайла = data.usedFileName

  if (data.maxHeight !== undefined) result.МаксимальнаяВысота = data.maxHeight

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  if (data.scale !== undefined) result.Масштаб = data.scale

  if (data.currentPageNumber !== undefined) result.НомерТекущейСтраницы = data.currentPageNumber

  if (data.orientation !== undefined) result.Ориентация = data.orientation

  const viewStatusLocation = exportSystemEnumerationToEnterprise(
    context,
    data.viewStatusLocation,
    SE.ViewStatusLocationToEnterprise
  )
  if (viewStatusLocation !== undefined) result.ПоложениеСостоянияПросмотра = viewStatusLocation

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

  if (data.width !== undefined) result.Ширина = data.width

  const events = exportEventsToEnterprise(context, data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata("ExportToEnterprise", "PdfDocumentField", exportPdfDocumentFieldToEnterprise)
