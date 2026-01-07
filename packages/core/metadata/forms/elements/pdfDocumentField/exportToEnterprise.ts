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

  return {
    ...exportFormFieldToEnterprise(context, data),

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(context, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(context, data.autoMaxWidth),
    Вывод: exportSystemEnumerationToEnterprise(context, data.output, SE.UseOutputToEnterprise),
    Высота: data.height,
    ИспользуемоеИмяФайла: data.usedFileName,
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    Масштаб: data.scale,
    НомерТекущейСтраницы: data.currentPageNumber,
    Ориентация: data.orientation,
    ПоложениеСостоянияПросмотра: exportSystemEnumerationToEnterprise(
      context,
      data.viewStatusLocation,
      SE.ViewStatusLocationToEnterprise
    ),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    РастягиватьПоВертикали: exportBooleanToEnterprise(context, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(context, data.horizontalStretch),
    ЦветРамки: exportColorToEnterprise(context, data.borderColor),
    Ширина: data.width,
    События: exportEventsToEnterprise(context, data.events),
  }
}

registerMetadata("ExportToEnterprise", "PdfDocumentField", exportPdfDocumentFieldToEnterprise)
