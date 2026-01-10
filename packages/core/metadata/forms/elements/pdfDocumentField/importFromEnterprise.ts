import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { PdfDocumentField, PdfDocumentFieldEnterprise } from "~/metadata/forms/elements/pdfDocumentField/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { ImportFromEnterpriseReturn } from "~/metadata/forms/elements/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

const importPdfDocumentFieldEventsFromEnterprise = (
  data: {
    ПриИзменении?: string
    НажатиеНаНавигационнойСсылке?: string
  } | undefined
): {
  onChange?: string
  uRLClick?: string
} | undefined => {
  if (!data) return undefined

  const result: {
    onChange?: string
    uRLClick?: string
  } = {}

  if (data.ПриИзменении !== undefined) result.onChange = data.ПриИзменении
  if (data.НажатиеНаНавигационнойСсылке !== undefined) result.uRLClick = data.НажатиеНаНавигационнойСсылке

  return Object.keys(result).length > 0 ? result : undefined
}

export const importPdfDocumentFieldFromEnterprise = <
  From extends PdfDocumentFieldEnterprise | undefined,
  Name extends string,
>(
  context: ConfigurationContext,
  data: From,
  name: Name
): ImportFromEnterpriseReturn<From, PdfDocumentField, Name> => {
  if (!data) return undefined as ImportFromEnterpriseReturn<From, PdfDocumentField, Name>

  const baseFields = importFormFieldFromEnterprise(context, data, name)!

  const result: ImportFromEnterpriseReturn<From, PdfDocumentField, Name> = {
    ...baseFields,
    elementType: FormElementType.PdfDocumentField,
  }

  const autoMaxHeight = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  const output = importSystemEnumerationFromEnterprise<SE.UseOutput>(
    context,
    data.Вывод,
    SE.UseOutputFromEnterprise
  )
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
  const userVisibleDeny = importUserVisibleFromEnterprise(context, data.ЗапретитьИспользование, "ЗапретитьИспользование")
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

  const events = importPdfDocumentFieldEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromEnterprise", "PdfDocumentField", importPdfDocumentFieldFromEnterprise)
