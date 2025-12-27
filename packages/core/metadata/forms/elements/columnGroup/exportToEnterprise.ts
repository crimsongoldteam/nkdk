import { exportBooleanToEnterprise } from "~/packages/core/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/packages/core/metadata/commonObjects/color/exportToEnterprise"
import { exportPictureToEnterprise } from "~/packages/core/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/packages/core/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/packages/core/metadata/context/types"
import { ColumnGroup, ColumnGroupEnterprise } from "~/packages/core/metadata/forms/elements/columnGroup/types"
import { exportFormGroupToEnterprise } from "~/packages/core/metadata/forms/elements/formGroup/exportToEnterprise"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/packages/core/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/packages/core/metadata/systemEnumerations/types"

export const exportColumnGroupToEnterprise = (
  context: Context,
  data: ColumnGroup | undefined
): ColumnGroupEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToEnterprise(context, data)!,

    ГоризонтальноеПоложениеВШапке: exportSystemEnumerationToEnterprise(
      context,
      data.headerHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    Группировка: exportSystemEnumerationToEnterprise(context, data.group, SE.ColumnsGroupToEnterprise),
    КартинкаШапки: exportPictureToEnterprise(context, data.headerPicture),
    ОтображатьВШапке: exportBooleanToEnterprise(context, data.showInHeader),
    ОтображатьЗаголовок: exportBooleanToEnterprise(context, data.showTitle),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    ПутьКДаннымШапки: data.headerDataPath,
    ФиксацияВТаблице: exportSystemEnumerationToEnterprise(context, data.fixingInTable, SE.FixingInTableToEnterprise),
    ФорматШапки: data.headerFormat,
    ЦветФонаЗаголовка: exportColorToEnterprise(context, data.titleBackColor),
  })
}

registerMetadata("ExportToEnterprise", "ColumnGroup", exportColumnGroupToEnterprise)
