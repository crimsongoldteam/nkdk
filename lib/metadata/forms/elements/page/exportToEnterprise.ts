import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { Page, PageEnterprise } from "~/lib/metadata/forms/elements/page/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportPageToEnterprise = (
  data: Page | undefined,
  configurationSettings: ConfigurationSettings
): PageEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToEnterprise(data, configurationSettings)!,

    ЦветФона: exportColorToEnterprise(data.backColor, configurationSettings),
    ГоризонтальноеПоложениеПодчиненных: exportSystemEnumerationToEnterprise(
      data.childItemsHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise,
      configurationSettings
    ),
    ВертикальноеПоложениеПодчиненных: exportSystemEnumerationToEnterprise(
      data.childItemsVerticalAlign,
      SE.ItemVerticalAlignToEnterprise,
      configurationSettings
    ),
    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      data.displayImportance,
      SE.DisplayImportanceToEnterprise,
      configurationSettings
    ),
    Формат: exportI8nTextToEnterprise(data.format, configurationSettings),
    Группировка: exportSystemEnumerationToEnterprise(
      data.group,
      SE.ChildFormItemsGroupToEnterprise,
      configurationSettings
    ),
    ГоризонтальныйИнтервал: exportSystemEnumerationToEnterprise(
      data.horizontalSpacing,
      SE.FormItemSpacingToEnterprise,
      configurationSettings
    ),
    ВыравниваниеЭлементовИЗаголовков: exportSystemEnumerationToEnterprise(
      data.itemsAndTitlesAlign,
      SE.ItemsAndTitlesAlignVariantToEnterprise,
      configurationSettings
    ),
    Картинка: exportPictureToEnterprise(data.picture, configurationSettings),
    СкроллПриСжатии: exportBooleanToEnterprise(data.scrollOnCompress, configurationSettings),
    ОтображатьЗаголовок: exportBooleanToEnterprise(data.showTitle, configurationSettings),
    ШиринаПодчиненныхЭлементов: exportSystemEnumerationToEnterprise(
      data.slaveItemsWidth,
      SE.ChildFormItemsWidthToEnterprise,
      configurationSettings
    ),
    ПутьКДаннымЗаголовка: data.titleDataPath,
    ВертикальноеПоложение: exportSystemEnumerationToEnterprise(
      data.verticalAlign,
      SE.ItemVerticalAlignToEnterprise,
      configurationSettings
    ),
    ВертикальнаяПрокруткаПриСжатии: exportBooleanToEnterprise(data.verticalScrollOnReduceSize, configurationSettings),
    ВертикальныйИнтервал: exportSystemEnumerationToEnterprise(
      data.verticalSpacing,
      SE.FormItemSpacingToEnterprise,
      configurationSettings
    ),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
  })
}

registerMetadata("ExportToEnterprise", "Page", exportPageToEnterprise)
