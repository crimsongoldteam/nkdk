import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importPictureFromEnterprise } from "~/metadata/commonObjects/picture/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { ColumnGroup, ColumnGroupEnterprise } from "~/metadata/forms/elements/columnGroup/types"
import { importFormGroupFromEnterprise } from "~/metadata/forms/elements/formGroup/importFromEnterprise"
import { ImportFromEnterpriseReturn } from "~/metadata/forms/elements/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const importColumnGroupFromEnterprise = <From extends ColumnGroupEnterprise | undefined, Name extends string>(
  context: ConfigurationContext,
  data: From,
  name: Name
): ImportFromEnterpriseReturn<From, ColumnGroup, Name> => {
  if (!data) return undefined as ImportFromEnterpriseReturn<From, ColumnGroup, Name>

  const baseFields = importFormGroupFromEnterprise(context, data, name)!

  const result: ImportFromEnterpriseReturn<From, ColumnGroup, Name> = {
    ...baseFields,
    elementType: FormElementType.ColumnGroup,
  }

  const headerHorizontalAlign = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложениеВШапке,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (headerHorizontalAlign !== undefined) result.headerHorizontalAlign = headerHorizontalAlign

  const group = importSystemEnumerationFromEnterprise<SE.ColumnsGroup>(
    context,
    data.Группировка,
    SE.ColumnsGroupFromEnterprise
  )
  if (group !== undefined) result.group = group

  const headerPicture = importPictureFromEnterprise(context, data.КартинкаШапки)
  if (headerPicture !== undefined) result.headerPicture = headerPicture

  const showInHeader = importBooleanFromEnterprise(context, data.ОтображатьВШапке)
  if (showInHeader !== undefined) result.showInHeader = showInHeader

  const showTitle = importBooleanFromEnterprise(context, data.ОтображатьЗаголовок)
  if (showTitle !== undefined) result.showTitle = showTitle

  const userVisibleAllow = importUserVisibleFromEnterprise(
    context,
    data.РазрешитьИспользование,
    "РазрешитьИспользование"
  )
  const userVisibleDeny = importUserVisibleFromEnterprise(
    context,
    data.ЗапретитьИспользование,
    "ЗапретитьИспользование"
  )
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

  if (data.ПутьКДаннымШапки !== undefined) result.headerDataPath = data.ПутьКДаннымШапки

  const fixingInTable = importSystemEnumerationFromEnterprise<SE.FixingInTable>(
    context,
    data.ФиксацияВТаблице,
    SE.FixingInTableFromEnterprise
  )
  if (fixingInTable !== undefined) result.fixingInTable = fixingInTable

  if (data.ФорматШапки !== undefined) result.headerFormat = data.ФорматШапки

  const titleBackColor = importColorFromEnterprise(context, data.ЦветФонаЗаголовка)
  if (titleBackColor !== undefined) result.titleBackColor = titleBackColor

  return result
}

registerMetadata("ImportFromEnterprise", "ColumnGroup", importColumnGroupFromEnterprise)
