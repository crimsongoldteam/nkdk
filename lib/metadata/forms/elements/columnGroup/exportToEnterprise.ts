import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ColumnGroup, ColumnGroupEnterprise } from "~/lib/metadata/forms/elements/columnGroup/types"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportColumnGroupToEnterprise = (data: ColumnGroup | undefined): ColumnGroupEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToEnterprise(data)!,

    ФиксацияВТаблице: exportSystemEnumerationToEnterprise(data.fixingInTable, SE.FixingInTableToEnterprise),
    Группировка: exportSystemEnumerationToEnterprise(data.group, SE.ColumnsGroupToEnterprise),
    ПутьКДаннымШапки: data.headerDataPath,
    ФорматШапки: data.headerFormat,
    ГоризонтальноеПоложениеВШапке: exportSystemEnumerationToEnterprise(
      data.headerHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    КартинкаШапки: exportPictureToEnterprise(data.headerPicture),
    ОтображатьВШапке: exportBooleanToEnterprise(data.showInHeader),
    ОтображатьЗаголовок: exportBooleanToEnterprise(data.showTitle),
    ЦветФонаЗаголовка: exportColorToEnterprise(data.titleBackColor),
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
  }
}

registerEnterpriseExport(FormElementType.ColumnGroup, exportColumnGroupToEnterprise)
