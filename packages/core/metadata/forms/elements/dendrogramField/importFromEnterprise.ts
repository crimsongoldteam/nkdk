import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  DendrogramField,
  DendrogramFieldPartialEnterprise,
  DendrogramFieldTypedEnterprise,
} from "~/metadata/forms/elements/dendrogramField/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { importEventsFromEnterprise } from "~/metadata/forms/events/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { importFormElementTypeFromEnterprise } from "~/metadata/metadataFactory/types"

export const importDendrogramFieldTypedFromEnterprise = (
  context: ConfigurationContext,
  data: DendrogramFieldTypedEnterprise | undefined,
  name: string
): DendrogramField | undefined => {
  if (data === undefined) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, name)!

  const props = importDendrogramFieldPropsFromEnterprise(context, data)

  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: DendrogramField = {
    ...baseFields,
    ...props,
    elementType,
  }

  return result
}

export const importDendrogramFieldPartialFromEnterprise = (
  context: ConfigurationContext,
  source: DendrogramField | undefined,
  data: DendrogramFieldPartialEnterprise | undefined
): DendrogramField | undefined => {
  if (source === undefined) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, source.name)!

  const props = importDendrogramFieldPropsFromEnterprise(context, data)
  const result: DendrogramField = {
    ...source,
    ...baseFields,
    ...props,
    elementType: source.elementType, // Сохраняем elementType из source
  }

  return result
}

const importDendrogramFieldPropsFromEnterprise = (
  context: ConfigurationContext,
  data: DendrogramFieldTypedEnterprise | DendrogramFieldPartialEnterprise | undefined
): Omit<Partial<DendrogramField>, "elementType" | "name"> => {
  const result: Omit<Partial<DendrogramField>, "elementType" | "name"> = {}

  if (data === undefined) return result

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
  const userVisibleDeny = importUserVisibleFromEnterprise(
    context,
    data.ЗапретитьИспользование,
    "ЗапретитьИспользование"
  )
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

  const verticalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  if (data.Ширина !== undefined) result.width = data.Ширина

  const events = importEventsFromEnterprise(context, data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportPartialFromEnterprise", "DendrogramField", importDendrogramFieldPropsFromEnterprise)
