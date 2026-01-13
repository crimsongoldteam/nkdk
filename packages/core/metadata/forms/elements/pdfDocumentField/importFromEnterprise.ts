import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import {
  PdfDocumentField,
  PdfDocumentFieldPartialEnterprise,
  PdfDocumentFieldTypedEnterprise,
} from "~/metadata/forms/elements/pdfDocumentField/types"
import { importEventsFromEnterprise } from "~/metadata/forms/events/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { importFormElementTypeFromEnterprise } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const importPdfDocumentFieldTypedFromEnterprise = (
  context: ConfigurationContext,
  data: PdfDocumentFieldTypedEnterprise | undefined,
  name: string
): PdfDocumentField | undefined => {
  if (data === undefined) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, name)!

  const props = importPdfDocumentFieldPropsFromEnterprise(context, data)

  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: PdfDocumentField = {
    ...baseFields,
    ...props,
    elementType,
  }

  return result
}

export const importPdfDocumentFieldPartialFromEnterprise = (
  context: ConfigurationContext,
  source: PdfDocumentField | undefined,
  data: PdfDocumentFieldPartialEnterprise | undefined
): PdfDocumentField | undefined => {
  if (source === undefined) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, source.name)!

  const props = importPdfDocumentFieldPropsFromEnterprise(context, data)
  const result: PdfDocumentField = {
    ...source,
    ...baseFields,
    ...props,
    elementType: source.elementType, // Сохраняем elementType из source
  }

  return result
}

const importPdfDocumentFieldPropsFromEnterprise = (
  context: ConfigurationContext,
  data: PdfDocumentFieldTypedEnterprise | PdfDocumentFieldPartialEnterprise | undefined
): Omit<Partial<PdfDocumentField>, "elementType" | "name"> => {
  const result: Omit<Partial<PdfDocumentField>, "elementType" | "name"> = {}

  if (data === undefined) return result

  const autoMaxHeight = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  const output = importSystemEnumerationFromEnterprise<SE.UseOutput>(context, data.Вывод, SE.UseOutputFromEnterprise)
  if (output !== undefined) result.output = output

  if (data.Высота !== undefined) result.height = data.Высота

  if (data.ИспользуемоеИмяФайла !== undefined) result.usedFileName = data.ИспользуемоеИмяФайла

  if (data.МаксимальнаяВысота !== undefined) result.maxHeight = data.МаксимальнаяВысота

  if (data.МаксимальнаяШирина !== undefined) result.maxWidth = data.МаксимальнаяШирина

  if (data.Масштаб !== undefined) result.scale = data.Масштаб

  if (data.НомерТекущейСтраницы !== undefined) result.currentPageNumber = data.НомерТекущейСтраницы

  if (data.Ориентация !== undefined) result.orientation = data.Ориентация

  const viewStatusLocation = importSystemEnumerationFromEnterprise<SE.ViewStatusLocation>(
    context,
    data.ПоложениеСостоянияПросмотра,
    SE.ViewStatusLocationFromEnterprise
  )
  if (viewStatusLocation !== undefined) result.viewStatusLocation = viewStatusLocation

  const userVisibleAllow = importUserVisibleFromEnterprise(
    context,
    data.РазрешитьИспользование,
    "РазрешитьИспользование"
  )
  const userVisibleDeny = importUserVisibleFromEnterprise(
    context,
    data.ЗапретитьИспользование,
    "ЗапретитьИспользование"
  )
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

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

registerMetadata("ImportPartialFromEnterprise", "PdfDocumentField", importPdfDocumentFieldPropsFromEnterprise)
