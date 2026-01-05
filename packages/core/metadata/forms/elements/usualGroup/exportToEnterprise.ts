import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/metadata/context/types"
import { exportFormGroupToEnterprise } from "~/metadata/forms/elements/formGroup/exportToEnterprise"
import { exportTableToEnterprise } from "~/metadata/forms/elements/table/exportToEnterprise"
import { UsualGroup, UsualGroupEnterprise } from "~/metadata/forms/elements/usualGroup/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportUsualGroupToEnterprise = (
  context: Context,
  data: UsualGroup | undefined
): UsualGroupEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToEnterprise(context, data)!,

    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      context,
      data.displayImportance,
      SE.DisplayImportanceToEnterprise
    ),
    ВертикальноеВыравниваниеГруппы: exportSystemEnumerationToEnterprise(
      context,
      data.groupVerticalAlign,
      SE.ItemVerticalAlignToEnterprise
    ),
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
    ГоризонтальноеВыравниваниеГруппы: exportSystemEnumerationToEnterprise(
      context,
      data.groupHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
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
    ЗаголовокСвернутогоОтображения: data.collapsedRepresentationTitle,
    ИспользованиеТекущейСтроки: exportSystemEnumerationToEnterprise(
      context,
      data.currentRowUse,
      SE.CurrentRowUseToEnterprise
    ),
    ИспользуемаяТаблица: exportTableToEnterprise(context, data.associatedTable),
    Объединенная: exportBooleanToEnterprise(context, data.united),
    ОтображатьЗаголовок: exportBooleanToEnterprise(context, data.showTitle),
    ОтображатьОтступСлева: exportBooleanToEnterprise(context, data.showLeftMargin),
    Отображение: exportSystemEnumerationToEnterprise(
      context,
      data.representation,
      SE.UsualGroupRepresentationToEnterprise
    ),
    ОтображениеУправления: exportSystemEnumerationToEnterprise(
      context,
      data.controlRepresentation,
      SE.UsualGroupControlRepresentationToEnterprise
    ),
    Поведение: exportSystemEnumerationToEnterprise(context, data.behavior, SE.UsualGroupBehaviorToEnterprise),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    ПутьКДаннымЗаголовка: data.titleDataPath,
    СквозноеВыравнивание: exportSystemEnumerationToEnterprise(context, data.throughAlign, SE.ThroughAlignToEnterprise),
    Формат: exportI8nTextToEnterprise(context, data.format),
    ЦветФона: exportColorToEnterprise(context, data.backColor),
    ЦветФонаЗаголовкаСкрытогоОтображения: exportColorToEnterprise(context, data.hiddenRepresentationTitleBackColor),
    ШиринаПодчиненныхЭлементов: exportSystemEnumerationToEnterprise(
      context,
      data.slaveItemsWidth,
      SE.ChildFormItemsWidthToEnterprise
    ),
  })
}

registerMetadata("ExportToEnterprise", "UsualGroup", exportUsualGroupToEnterprise)
