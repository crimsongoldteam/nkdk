import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { Page, PageEnterprise } from "~/lib/metadata/forms/elements/page/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportPageToEnterprise = (data: Page | undefined): PageEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToEnterprise(data)!,

    ЦветФона: exportColorToEnterprise(data.backColor),
    ГоризонтальноеПоложениеПодчиненных: exportSystemEnumerationToEnterprise(
      data.childItemsHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    ВертикальноеПоложениеПодчиненных: exportSystemEnumerationToEnterprise(
      data.childItemsVerticalAlign,
      SE.ItemVerticalAlignToEnterprise
    ),
    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      data.displayImportance,
      SE.DisplayImportanceToEnterprise
    ),
    Формат: exportI8nTextToEnterprise(data.format),
    Группировка: exportSystemEnumerationToEnterprise(data.group, SE.ChildFormItemsGroupToEnterprise),
    ГоризонтальныйИнтервал: exportSystemEnumerationToEnterprise(data.horizontalSpacing, SE.FormItemSpacingToEnterprise),
    ВыравниваниеЭлементовИЗаголовков: exportSystemEnumerationToEnterprise(
      data.itemsAndTitlesAlign,
      SE.ItemsAndTitlesAlignVariantToEnterprise
    ),
    Картинка: exportPictureToEnterprise(data.picture),
    СкроллПриСжатии: exportBooleanToEnterprise(data.scrollOnCompress),
    ОтображатьЗаголовок: exportBooleanToEnterprise(data.showTitle),
    ШиринаПодчиненныхЭлементов: exportSystemEnumerationToEnterprise(
      data.slaveItemsWidth,
      SE.ChildFormItemsWidthToEnterprise
    ),
    ПутьКДаннымЗаголовка: data.titleDataPath,
    ВертикальноеПоложение: exportSystemEnumerationToEnterprise(data.verticalAlign, SE.ItemVerticalAlignToEnterprise),
    ВертикальнаяПрокруткаПриСжатии: exportBooleanToEnterprise(data.verticalScrollOnReduceSize),
    ВертикальныйИнтервал: exportSystemEnumerationToEnterprise(data.verticalSpacing, SE.FormItemSpacingToEnterprise),
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
  }
}

registerEnterpriseExport(FormElementType.Page, exportPageToEnterprise)
