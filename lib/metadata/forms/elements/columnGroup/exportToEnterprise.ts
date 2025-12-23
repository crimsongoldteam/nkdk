import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { ColumnGroup, ColumnGroupEnterprise } from "~/lib/metadata/forms/elements/columnGroup/types"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportColumnGroupToEnterprise = (
  configurationSettings: ConfigurationSettings, data: ColumnGroup | undefined
): ColumnGroupEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToEnterprise(configurationSettings, data)!,

    ГоризонтальноеПоложениеВШапке: exportSystemEnumerationToEnterprise(configurationSettings, data.headerHorizontalAlign, SE.ItemHorizontalLocationToEnterprise),
    Группировка: exportSystemEnumerationToEnterprise(configurationSettings, data.group, SE.ColumnsGroupToEnterprise),
    КартинкаШапки: exportPictureToEnterprise(configurationSettings, data.headerPicture),
    ОтображатьВШапке: exportBooleanToEnterprise(configurationSettings, data.showInHeader),
    ОтображатьЗаголовок: exportBooleanToEnterprise(configurationSettings, data.showTitle),
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    ПутьКДаннымШапки: data.headerDataPath,
    ФиксацияВТаблице: exportSystemEnumerationToEnterprise(configurationSettings, data.fixingInTable, SE.FixingInTableToEnterprise),
    ФорматШапки: data.headerFormat,
    ЦветФонаЗаголовка: exportColorToEnterprise(configurationSettings, data.titleBackColor),
  })
}

registerMetadata("ExportToEnterprise", "ColumnGroup", exportColumnGroupToEnterprise)
