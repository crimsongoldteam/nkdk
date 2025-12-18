import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { ColumnGroup, ColumnGroupEnterprise } from "~/lib/metadata/forms/elements/columnGroup/types"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportColumnGroupToEnterprise = (
  data: ColumnGroup | undefined,
  configurationSettings: ConfigurationSettings
): ColumnGroupEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToEnterprise(data, configurationSettings)!,

    ФиксацияВТаблице: exportSystemEnumerationToEnterprise(
      data.fixingInTable,
      SE.FixingInTableToEnterprise,
      configurationSettings
    ),
    Группировка: exportSystemEnumerationToEnterprise(data.group, SE.ColumnsGroupToEnterprise, configurationSettings),
    ПутьКДаннымШапки: data.headerDataPath,
    ФорматШапки: data.headerFormat,
    ГоризонтальноеПоложениеВШапке: exportSystemEnumerationToEnterprise(
      data.headerHorizontalAlign,
      SE.ItemHorizontalLocationToEnterprise,
      configurationSettings
    ),
    КартинкаШапки: exportPictureToEnterprise(data.headerPicture, configurationSettings),
    ОтображатьВШапке: exportBooleanToEnterprise(data.showInHeader, configurationSettings),
    ОтображатьЗаголовок: exportBooleanToEnterprise(data.showTitle, configurationSettings),
    ЦветФонаЗаголовка: exportColorToEnterprise(data.titleBackColor, configurationSettings),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
  }
}

registerMetadata("ExportToEnterprise", "ColumnGroup", exportColumnGroupToEnterprise)
