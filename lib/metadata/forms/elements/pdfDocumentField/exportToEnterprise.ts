import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { PdfDocumentField, PdfDocumentFieldEnterprise } from "~/lib/metadata/forms/elements/pdfDocumentField/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportPdfDocumentFieldToEnterprise = (
  context: Context,
  data: PdfDocumentField | undefined
): PdfDocumentFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(context, data)!,

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
  })
}

registerMetadata("ExportToEnterprise", "PdfDocumentField", exportPdfDocumentFieldToEnterprise)
