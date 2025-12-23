import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { ColumnGroup, ColumnGroupEnterprise } from "~/lib/metadata/forms/elements/columnGroup/types"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

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
