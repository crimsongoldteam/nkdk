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
  configurationSettings: Context,
  data: PdfDocumentField | undefined
): PdfDocumentFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(configurationSettings, data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(configurationSettings, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(configurationSettings, data.autoMaxWidth),
    Вывод: exportSystemEnumerationToEnterprise(configurationSettings, data.output, SE.UseOutputToEnterprise),
    Высота: data.height,
    ИспользуемоеИмяФайла: data.usedFileName,
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    Масштаб: data.scale,
    НомерТекущейСтраницы: data.currentPageNumber,
    Ориентация: data.orientation,
    ПоложениеСостоянияПросмотра: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.viewStatusLocation,
      SE.ViewStatusLocationToEnterprise
    ),
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    РастягиватьПоВертикали: exportBooleanToEnterprise(configurationSettings, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(configurationSettings, data.horizontalStretch),
    ЦветРамки: exportColorToEnterprise(configurationSettings, data.borderColor),
    Ширина: data.width,
    События: exportEventsToEnterprise(configurationSettings, data.events),
  })
}

registerMetadata("ExportToEnterprise", "PdfDocumentField", exportPdfDocumentFieldToEnterprise)
