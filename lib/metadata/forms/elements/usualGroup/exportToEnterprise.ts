import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { exportTableToEnterprise } from "~/lib/metadata/forms/elements/table/exportToEnterprise"
import { UsualGroup, UsualGroupEnterprise } from "~/lib/metadata/forms/elements/usualGroup/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportUsualGroupToEnterprise = (
  configurationSettings: ConfigurationSettings, data: UsualGroup | undefined
): UsualGroupEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToEnterprise(configurationSettings, data)!,

    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(configurationSettings, data.displayImportance, SE.DisplayImportanceToEnterprise),
    ВертикальноеВыравниваниеГруппы: exportSystemEnumerationToEnterprise(configurationSettings, data.groupVerticalAlign, SE.ItemVerticalAlignToEnterprise),
    ВертикальноеПоложение: exportSystemEnumerationToEnterprise(configurationSettings, data.verticalAlign, SE.ItemVerticalAlignToEnterprise),
    ВертикальноеПоложениеПодчиненных: exportSystemEnumerationToEnterprise(configurationSettings, data.childItemsVerticalAlign, SE.ItemVerticalAlignToEnterprise),
    ВертикальныйИнтервал: exportSystemEnumerationToEnterprise(configurationSettings, data.verticalSpacing, SE.FormItemSpacingToEnterprise),
    ВыравниваниеЭлементовИЗаголовков: exportSystemEnumerationToEnterprise(configurationSettings, data.itemsAndTitlesAlign, SE.ItemsAndTitlesAlignVariantToEnterprise),
    ГоризонтальноеВыравниваниеГруппы: exportSystemEnumerationToEnterprise(configurationSettings, data.groupHorizontalAlign, SE.ItemHorizontalLocationToEnterprise),
    ГоризонтальноеПоложениеПодчиненных: exportSystemEnumerationToEnterprise(configurationSettings, data.childItemsHorizontalAlign, SE.ItemHorizontalLocationToEnterprise),
    ГоризонтальныйИнтервал: exportSystemEnumerationToEnterprise(configurationSettings, data.horizontalSpacing, SE.FormItemSpacingToEnterprise),
    Группировка: exportSystemEnumerationToEnterprise(configurationSettings, data.group, SE.ChildFormItemsGroupToEnterprise),
    ЗаголовокСвернутогоОтображения: data.collapsedRepresentationTitle,
    ИспользованиеТекущейСтроки: exportSystemEnumerationToEnterprise(configurationSettings, data.currentRowUse, SE.CurrentRowUseToEnterprise),
    ИспользуемаяТаблица: exportTableToEnterprise(configurationSettings, data.associatedTable),
    Объединенная: exportBooleanToEnterprise(configurationSettings, data.united),
    ОтображатьЗаголовок: exportBooleanToEnterprise(configurationSettings, data.showTitle),
    ОтображатьОтступСлева: exportBooleanToEnterprise(configurationSettings, data.showLeftMargin),
    Отображение: exportSystemEnumerationToEnterprise(configurationSettings, data.representation, SE.UsualGroupRepresentationToEnterprise),
    ОтображениеУправления: exportSystemEnumerationToEnterprise(configurationSettings, data.controlRepresentation, SE.UsualGroupControlRepresentationToEnterprise),
    Поведение: exportSystemEnumerationToEnterprise(configurationSettings, data.behavior, SE.UsualGroupBehaviorToEnterprise),
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    ПутьКДаннымЗаголовка: data.titleDataPath,
    СквозноеВыравнивание: exportSystemEnumerationToEnterprise(configurationSettings, data.throughAlign, SE.ThroughAlignToEnterprise),
    Формат: exportI8nTextToEnterprise(configurationSettings, data.format),
    ЦветФона: exportColorToEnterprise(configurationSettings, data.backColor),
    ЦветФонаЗаголовкаСкрытогоОтображения: exportColorToEnterprise(configurationSettings, data.hiddenRepresentationTitleBackColor),
    ШиринаПодчиненныхЭлементов: exportSystemEnumerationToEnterprise(configurationSettings, data.slaveItemsWidth, SE.ChildFormItemsWidthToEnterprise),
  })
}

registerMetadata("ExportToEnterprise", "UsualGroup", exportUsualGroupToEnterprise)
