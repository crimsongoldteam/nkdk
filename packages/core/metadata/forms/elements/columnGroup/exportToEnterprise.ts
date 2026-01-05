import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/picture/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/metadata/context/types"
import { ColumnGroup, ColumnGroupEnterprise } from "~/metadata/forms/elements/columnGroup/types"
import { exportFormGroupToEnterprise } from "~/metadata/forms/elements/formGroup/exportToEnterprise"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

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
