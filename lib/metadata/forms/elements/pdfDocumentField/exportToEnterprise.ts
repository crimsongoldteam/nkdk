import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { PdfDocumentField, PdfDocumentFieldEnterprise } from "~/lib/metadata/forms/elements/pdfDocumentField/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportPdfDocumentFieldToEnterprise = (
  data: PdfDocumentField | undefined
): PdfDocumentFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToEnterprise(data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth),
    ЦветРамки: exportColorToEnterprise(data.borderColor),
    НомерТекущейСтраницы: data.currentPageNumber,
    Высота: data.height,
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    Ориентация: data.orientation,
    Вывод: exportSystemEnumerationToEnterprise(data.output, SE.UseOutputToEnterprise),
    Масштаб: data.scale,
    ИспользуемоеИмяФайла: data.usedFileName,
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch),
    ПоложениеСостоянияПросмотра: exportSystemEnumerationToEnterprise(
      data.viewStatusLocation,
      SE.ViewStatusLocationToEnterprise
    ),
    Ширина: data.width,
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
    Events: exportEventsToEnterprise(data.events),
  }
}

registerEnterpriseExport(FormElementType.PdfDocumentField, exportPdfDocumentFieldToEnterprise)
