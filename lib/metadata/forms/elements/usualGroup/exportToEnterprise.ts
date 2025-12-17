import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { exportTableToEnterprise } from "~/lib/metadata/forms/elements/table/exportToEnterprise"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { UsualGroup, UsualGroupEnterprise } from "~/lib/metadata/forms/elements/usualGroup/types"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportUsualGroupToEnterprise = (
  data: UsualGroup | undefined,
  configurationSettings: ConfigurationSettings
): UsualGroupEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToEnterprise(data, configurationSettings)!,

    ИспользуемаяТаблица: exportTableToEnterprise(data.associatedTable, configurationSettings),
    ЦветФона: exportColorToEnterprise(data.backColor, configurationSettings),
    Поведение: exportSystemEnumerationToEnterprise(
      data.behavior,
      SE.UsualGroupBehaviorToEnterprise,
      configurationSettings
    ),
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
    ЗаголовокСвернутогоОтображения: data.collapsedRepresentationTitle,
    ОтображениеУправления: exportSystemEnumerationToEnterprise(
      data.controlRepresentation,
      SE.UsualGroupControlRepresentationToEnterprise,
      configurationSettings
    ),
    ИспользованиеТекущейСтроки: exportSystemEnumerationToEnterprise(
      data.currentRowUse,
      SE.CurrentRowUseToEnterprise,
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
    ГоризонтальноеВыравниваниеГруппы: exportSystemEnumerationToEnterprise(
      data.groupHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise,
      configurationSettings
    ),
    ВертикальноеВыравниваниеГруппы: exportSystemEnumerationToEnterprise(
      data.groupVerticalAlign,
      SE.ItemVerticalAlignToEnterprise,
      configurationSettings
    ),
    ЦветФонаЗаголовкаСкрытогоОтображения: exportColorToEnterprise(
      data.hiddenRepresentationTitleBackColor,
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
    Отображение: exportSystemEnumerationToEnterprise(
      data.representation,
      SE.UsualGroupRepresentationToEnterprise,
      configurationSettings
    ),
    ОтображатьОтступСлева: exportBooleanToEnterprise(data.showLeftMargin, configurationSettings),
    ОтображатьЗаголовок: exportBooleanToEnterprise(data.showTitle, configurationSettings),
    ШиринаПодчиненныхЭлементов: exportSystemEnumerationToEnterprise(
      data.slaveItemsWidth,
      SE.ChildFormItemsWidthToEnterprise,
      configurationSettings
    ),
    СквозноеВыравнивание: exportSystemEnumerationToEnterprise(
      data.throughAlign,
      SE.ThroughAlignToEnterprise,
      configurationSettings
    ),
    ПутьКДаннымЗаголовка: data.titleDataPath,
    Объединенная: exportBooleanToEnterprise(data.united, configurationSettings),
    ВертикальноеПоложение: exportSystemEnumerationToEnterprise(
      data.verticalAlign,
      SE.ItemVerticalAlignToEnterprise,
      configurationSettings
    ),
    ВертикальныйИнтервал: exportSystemEnumerationToEnterprise(
      data.verticalSpacing,
      SE.FormItemSpacingToEnterprise,
      configurationSettings
    ),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
  }
}

registerEnterpriseExport(FormElementType.UsualGroup, exportUsualGroupToEnterprise)
