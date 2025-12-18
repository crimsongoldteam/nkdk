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

    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      data.displayImportance,
      SE.DisplayImportanceToEnterprise,
      configurationSettings
    ),
    ВертикальнаяПрокруткаПриСжатии: exportBooleanToEnterprise(data.verticalScrollOnReduceSize, configurationSettings),
    ВертикальноеПоложение: exportSystemEnumerationToEnterprise(
      data.verticalAlign,
      SE.ItemVerticalAlignToEnterprise,
      configurationSettings
    ),
    ВертикальноеПоложениеПодчиненных: exportSystemEnumerationToEnterprise(
      data.childItemsVerticalAlign,
      SE.ItemVerticalAlignToEnterprise,
      configurationSettings
    ),
    ВертикальныйИнтервал: exportSystemEnumerationToEnterprise(
      data.verticalSpacing,
      SE.FormItemSpacingToEnterprise,
      configurationSettings
    ),
    ВыравниваниеЭлементовИЗаголовков: exportSystemEnumerationToEnterprise(
      data.itemsAndTitlesAlign,
      SE.ItemsAndTitlesAlignVariantToEnterprise,
      configurationSettings
    ),
    ГоризонтальноеПоложениеПодчиненных: exportSystemEnumerationToEnterprise(
      data.childItemsHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise,
      configurationSettings
    ),
    ГоризонтальныйИнтервал: exportSystemEnumerationToEnterprise(
      data.horizontalSpacing,
      SE.FormItemSpacingToEnterprise,
      configurationSettings
    ),
    Группировка: exportSystemEnumerationToEnterprise(
      data.group,
      SE.ChildFormItemsGroupToEnterprise,
      configurationSettings
    ),
    Картинка: exportPictureToEnterprise(data.picture, configurationSettings),
    ОтображатьЗаголовок: exportBooleanToEnterprise(data.showTitle, configurationSettings),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    ПутьКДаннымЗаголовка: data.titleDataPath,
    СкроллПриСжатии: exportBooleanToEnterprise(data.scrollOnCompress, configurationSettings),
    Формат: exportI8nTextToEnterprise(data.format, configurationSettings),
    ЦветФона: exportColorToEnterprise(data.backColor, configurationSettings),
    ШиринаПодчиненныхЭлементов: exportSystemEnumerationToEnterprise(
      data.slaveItemsWidth,
      SE.ChildFormItemsWidthToEnterprise,
      configurationSettings
    ),
  })
}

registerMetadata("ExportToEnterprise", "Page", exportPageToEnterprise)
