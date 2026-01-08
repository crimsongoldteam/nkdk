import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/picture/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { ColumnGroup, ColumnGroupEnterprise } from "~/metadata/forms/elements/columnGroup/types"
import { exportFormGroupToEnterprise } from "~/metadata/forms/elements/formGroup/exportToEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportColumnGroupToEnterprise = (
  context: ConfigurationContext,
  data: ColumnGroup | undefined
): ColumnGroupEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportFormGroupToEnterprise(context, data)
  if (!baseFields) return undefined

  const result: ColumnGroupEnterprise = {
    ...baseFields,
  }

  const headerHorizontalAlign = exportSystemEnumerationToEnterprise<SE.ItemHorizontalLocationEnterprise>(
    context,
    data.headerHorizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (headerHorizontalAlign !== undefined) result.ГоризонтальноеПоложениеВШапке = headerHorizontalAlign

  const group = exportSystemEnumerationToEnterprise<SE.ColumnsGroupEnterprise>(context, data.group, SE.ColumnsGroupToEnterprise)
  if (group !== undefined) result.Группировка = group

  const headerPicture = exportPictureToEnterprise(context, data.headerPicture)
  if (headerPicture !== undefined) result.КартинкаШапки = headerPicture

  const showInHeader = exportBooleanToEnterprise(context, data.showInHeader)
  if (showInHeader !== undefined) result.ОтображатьВШапке = showInHeader

  const showTitle = exportBooleanToEnterprise(context, data.showTitle)
  if (showTitle !== undefined) result.ОтображатьЗаголовок = showTitle

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  if (data.headerDataPath !== undefined) result.ПутьКДаннымШапки = data.headerDataPath

  const fixingInTable = exportSystemEnumerationToEnterprise<SE.FixingInTableEnterprise>(
    context,
    data.fixingInTable,
    SE.FixingInTableToEnterprise
  )
  if (fixingInTable !== undefined) result.ФиксацияВТаблице = fixingInTable

  if (data.headerFormat !== undefined) result.ФорматШапки = data.headerFormat

  const titleBackColor = exportColorToEnterprise(context, data.titleBackColor)
  if (titleBackColor !== undefined) result.ЦветФонаЗаголовка = titleBackColor

  return result
}

registerMetadata("ExportToEnterprise", "ColumnGroup", exportColumnGroupToEnterprise)
