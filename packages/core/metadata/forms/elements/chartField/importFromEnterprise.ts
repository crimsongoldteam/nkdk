import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { ChartField, ChartFieldEnterprise } from "~/metadata/forms/elements/chartField/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { ImportFromEnterpriseReturn } from "~/metadata/forms/elements/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

const importChartFieldEventsFromEnterprise = (
  data: {
    ПриИзменении?: string
    Выбор?: string
    ОбработкаРасшифровки?: string
    ПриАктивизации?: string
  } | undefined
): {
  onChange?: string
  selection?: string
  detailProcessing?: string
  onActivate?: string
} | undefined => {
  if (!data) return undefined

  const result: {
    onChange?: string
    selection?: string
    detailProcessing?: string
    onActivate?: string
  } = {}

  if (data.ПриИзменении !== undefined) result.onChange = data.ПриИзменении
  if (data.Выбор !== undefined) result.selection = data.Выбор
  if (data.ОбработкаРасшифровки !== undefined) result.detailProcessing = data.ОбработкаРасшифровки
  if (data.ПриАктивизации !== undefined) result.onActivate = data.ПриАктивизации

  return Object.keys(result).length > 0 ? result : undefined
}

export const importChartFieldFromEnterprise = <From extends ChartFieldEnterprise | undefined, Name extends string>(
  context: ConfigurationContext,
  data: From,
  name: Name
): ImportFromEnterpriseReturn<From, ChartField, Name> => {
  if (!data) return undefined as ImportFromEnterpriseReturn<From, ChartField, Name>

  const baseFields = importFormFieldFromEnterprise(context, data, name)!

  const result: ImportFromEnterpriseReturn<From, ChartField, Name> = {
    ...baseFields,
    elementType: FormElementType.ChartField,
  }

  const autoMaxHeight = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  if (data.Высота !== undefined) result.height = data.Высота

  if (data.МаксимальнаяВысота !== undefined) result.maxHeight = data.МаксимальнаяВысота

  if (data.МаксимальнаяШирина !== undefined) result.maxWidth = data.МаксимальнаяШирина

  const userVisibleAllow = importUserVisibleFromEnterprise(
    context,
    data.РазрешитьИспользование,
    "РазрешитьИспользование"
  )
  const userVisibleDeny = importUserVisibleFromEnterprise(context, data.ЗапретитьИспользование, "ЗапретитьИспользование")
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

  const verticalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  if (data.Ширина !== undefined) result.width = data.Ширина

  const events = importChartFieldEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromEnterprise", "ChartField", importChartFieldFromEnterprise)

