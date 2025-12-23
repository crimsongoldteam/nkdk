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
  configurationSettings: ConfigurationSettings,
  data: Page | undefined
): PageEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToEnterprise(configurationSettings, data)!,

    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(configurationSettings, data.displayImportance, SE.DisplayImportanceToEnterprise),
    ВертикальнаяПрокруткаПриСжатии: exportBooleanToEnterprise(configurationSettings, data.verticalScrollOnReduceSize),
    ВертикальноеПоложение: exportSystemEnumerationToEnterprise(configurationSettings, data.verticalAlign, SE.ItemVerticalAlignToEnterprise),
    ВертикальноеПоложениеПодчиненных: exportSystemEnumerationToEnterprise(configurationSettings, data.childItemsVerticalAlign, SE.ItemVerticalAlignToEnterprise),
    ВертикальныйИнтервал: exportSystemEnumerationToEnterprise(configurationSettings, data.verticalSpacing, SE.FormItemSpacingToEnterprise),
    ВыравниваниеЭлементовИЗаголовков: exportSystemEnumerationToEnterprise(configurationSettings, data.itemsAndTitlesAlign, SE.ItemsAndTitlesAlignVariantToEnterprise),
    ГоризонтальноеПоложениеПодчиненных: exportSystemEnumerationToEnterprise(configurationSettings, data.childItemsHorizontalAlign, SE.ItemHorizontalLocationToEnterprise),
    ГоризонтальныйИнтервал: exportSystemEnumerationToEnterprise(configurationSettings, data.horizontalSpacing, SE.FormItemSpacingToEnterprise),
    Группировка: exportSystemEnumerationToEnterprise(configurationSettings, data.group, SE.ChildFormItemsGroupToEnterprise),
    Картинка: exportPictureToEnterprise(configurationSettings, data.picture),
    ОтображатьЗаголовок: exportBooleanToEnterprise(configurationSettings, data.showTitle),
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    ПутьКДаннымЗаголовка: data.titleDataPath,
    СкроллПриСжатии: exportBooleanToEnterprise(configurationSettings, data.scrollOnCompress),
    Формат: exportI8nTextToEnterprise(configurationSettings, data.format),
    ЦветФона: exportColorToEnterprise(configurationSettings, data.backColor),
    ШиринаПодчиненныхЭлементов: exportSystemEnumerationToEnterprise(configurationSettings, data.slaveItemsWidth, SE.ChildFormItemsWidthToEnterprise),
  })
}

registerMetadata("ExportToEnterprise", "Page", exportPageToEnterprise)
