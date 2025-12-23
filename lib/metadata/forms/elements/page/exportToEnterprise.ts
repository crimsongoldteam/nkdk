import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { Page, PageEnterprise } from "~/lib/metadata/forms/elements/page/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportPageToEnterprise = (context: Context, data: Page | undefined): PageEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToEnterprise(context, data)!,

    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      context,
      data.displayImportance,
      SE.DisplayImportanceToEnterprise
    ),
    ВертикальнаяПрокруткаПриСжатии: exportBooleanToEnterprise(context, data.verticalScrollOnReduceSize),
    ВертикальноеПоложение: exportSystemEnumerationToEnterprise(
      context,
      data.verticalAlign,
      SE.ItemVerticalAlignToEnterprise
    ),
    ВертикальноеПоложениеПодчиненных: exportSystemEnumerationToEnterprise(
      context,
      data.childItemsVerticalAlign,
      SE.ItemVerticalAlignToEnterprise
    ),
    ВертикальныйИнтервал: exportSystemEnumerationToEnterprise(
      context,
      data.verticalSpacing,
      SE.FormItemSpacingToEnterprise
    ),
    ВыравниваниеЭлементовИЗаголовков: exportSystemEnumerationToEnterprise(
      context,
      data.itemsAndTitlesAlign,
      SE.ItemsAndTitlesAlignVariantToEnterprise
    ),
    ГоризонтальноеПоложениеПодчиненных: exportSystemEnumerationToEnterprise(
      context,
      data.childItemsHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    ГоризонтальныйИнтервал: exportSystemEnumerationToEnterprise(
      context,
      data.horizontalSpacing,
      SE.FormItemSpacingToEnterprise
    ),
    Группировка: exportSystemEnumerationToEnterprise(context, data.group, SE.ChildFormItemsGroupToEnterprise),
    Картинка: exportPictureToEnterprise(context, data.picture),
    ОтображатьЗаголовок: exportBooleanToEnterprise(context, data.showTitle),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    ПутьКДаннымЗаголовка: data.titleDataPath,
    СкроллПриСжатии: exportBooleanToEnterprise(context, data.scrollOnCompress),
    Формат: exportI8nTextToEnterprise(context, data.format),
    ЦветФона: exportColorToEnterprise(context, data.backColor),
    ШиринаПодчиненныхЭлементов: exportSystemEnumerationToEnterprise(
      context,
      data.slaveItemsWidth,
      SE.ChildFormItemsWidthToEnterprise
    ),
  })
}

registerMetadata("ExportToEnterprise", "Page", exportPageToEnterprise)
