import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { exportTableToEnterprise } from "~/lib/metadata/forms/elements/table/exportToEnterprise"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { UsualGroup, UsualGroupEnterprise } from "~/lib/metadata/forms/elements/usualGroup/types"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportUsualGroupToEnterprise = (data: UsualGroup | undefined): UsualGroupEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToEnterprise(data)!,

    ИспользуемаяТаблица: exportTableToEnterprise(data.associatedTable),
    ЦветФона: exportColorToEnterprise(data.backColor),
    Поведение: exportSystemEnumerationToEnterprise(data.behavior, SE.UsualGroupBehaviorToEnterprise),
    ГоризонтальноеПоложениеПодчиненных: exportSystemEnumerationToEnterprise(
      data.childItemsHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    ВертикальноеПоложениеПодчиненных: exportSystemEnumerationToEnterprise(
      data.childItemsVerticalAlign,
      SE.ItemVerticalAlignToEnterprise
    ),
    ЗаголовокСвернутогоОтображения: data.collapsedRepresentationTitle,
    ОтображениеУправления: exportSystemEnumerationToEnterprise(
      data.controlRepresentation,
      SE.UsualGroupControlRepresentationToEnterprise
    ),
    ИспользованиеТекущейСтроки: exportSystemEnumerationToEnterprise(data.currentRowUse, SE.CurrentRowUseToEnterprise),
    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      data.displayImportance,
      SE.DisplayImportanceToEnterprise
    ),
    Формат: exportI8nTextToEnterprise(data.format),
    Группировка: exportSystemEnumerationToEnterprise(data.group, SE.ChildFormItemsGroupToEnterprise),
    ГоризонтальноеВыравниваниеГруппы: exportSystemEnumerationToEnterprise(
      data.groupHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    ВертикальноеВыравниваниеГруппы: exportSystemEnumerationToEnterprise(
      data.groupVerticalAlign,
      SE.ItemVerticalAlignToEnterprise
    ),
    ЦветФонаЗаголовкаСкрытогоОтображения: exportColorToEnterprise(data.hiddenRepresentationTitleBackColor),
    ГоризонтальныйИнтервал: exportSystemEnumerationToEnterprise(data.horizontalSpacing, SE.FormItemSpacingToEnterprise),
    ВыравниваниеЭлементовИЗаголовков: exportSystemEnumerationToEnterprise(
      data.itemsAndTitlesAlign,
      SE.ItemsAndTitlesAlignVariantToEnterprise
    ),
    Отображение: exportSystemEnumerationToEnterprise(data.representation, SE.UsualGroupRepresentationToEnterprise),
    ОтображатьОтступСлева: exportBooleanToEnterprise(data.showLeftMargin),
    ОтображатьЗаголовок: exportBooleanToEnterprise(data.showTitle),
    ШиринаПодчиненныхЭлементов: exportSystemEnumerationToEnterprise(
      data.slaveItemsWidth,
      SE.ChildFormItemsWidthToEnterprise
    ),
    СквозноеВыравнивание: exportSystemEnumerationToEnterprise(data.throughAlign, SE.ThroughAlignToEnterprise),
    ПутьКДаннымЗаголовка: data.titleDataPath,
    Объединенная: exportBooleanToEnterprise(data.united),
    ВертикальноеПоложение: exportSystemEnumerationToEnterprise(data.verticalAlign, SE.ItemVerticalAlignToEnterprise),
    ВертикальныйИнтервал: exportSystemEnumerationToEnterprise(data.verticalSpacing, SE.FormItemSpacingToEnterprise),
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
  }
}

registerEnterpriseExport(FormElementType.UsualGroup, exportUsualGroupToEnterprise)
