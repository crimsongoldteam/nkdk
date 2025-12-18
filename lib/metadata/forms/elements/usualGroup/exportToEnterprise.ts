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
  data: UsualGroup | undefined,
  configurationSettings: ConfigurationSettings
): UsualGroupEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToEnterprise(data, configurationSettings)!,

    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      data.displayImportance,
      SE.DisplayImportanceToEnterprise,
      configurationSettings
    ),
    ВертикальноеВыравниваниеГруппы: exportSystemEnumerationToEnterprise(
      data.groupVerticalAlign,
      SE.ItemVerticalAlignToEnterprise,
      configurationSettings
    ),
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
    ГоризонтальноеВыравниваниеГруппы: exportSystemEnumerationToEnterprise(
      data.groupHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise,
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
    ЗаголовокСвернутогоОтображения: data.collapsedRepresentationTitle,
    ИспользованиеТекущейСтроки: exportSystemEnumerationToEnterprise(
      data.currentRowUse,
      SE.CurrentRowUseToEnterprise,
      configurationSettings
    ),
    ИспользуемаяТаблица: exportTableToEnterprise(data.associatedTable, configurationSettings),
    Объединенная: exportBooleanToEnterprise(data.united, configurationSettings),
    ОтображатьЗаголовок: exportBooleanToEnterprise(data.showTitle, configurationSettings),
    ОтображатьОтступСлева: exportBooleanToEnterprise(data.showLeftMargin, configurationSettings),
    Отображение: exportSystemEnumerationToEnterprise(
      data.representation,
      SE.UsualGroupRepresentationToEnterprise,
      configurationSettings
    ),
    ОтображениеУправления: exportSystemEnumerationToEnterprise(
      data.controlRepresentation,
      SE.UsualGroupControlRepresentationToEnterprise,
      configurationSettings
    ),
    Поведение: exportSystemEnumerationToEnterprise(
      data.behavior,
      SE.UsualGroupBehaviorToEnterprise,
      configurationSettings
    ),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    ПутьКДаннымЗаголовка: data.titleDataPath,
    СквозноеВыравнивание: exportSystemEnumerationToEnterprise(
      data.throughAlign,
      SE.ThroughAlignToEnterprise,
      configurationSettings
    ),
    Формат: exportI8nTextToEnterprise(data.format, configurationSettings),
    ЦветФона: exportColorToEnterprise(data.backColor, configurationSettings),
    ЦветФонаЗаголовкаСкрытогоОтображения: exportColorToEnterprise(
      data.hiddenRepresentationTitleBackColor,
      configurationSettings
    ),
    ШиринаПодчиненныхЭлементов: exportSystemEnumerationToEnterprise(
      data.slaveItemsWidth,
      SE.ChildFormItemsWidthToEnterprise,
      configurationSettings
    ),
  })
}

registerMetadata("ExportToEnterprise", "UsualGroup", exportUsualGroupToEnterprise)
