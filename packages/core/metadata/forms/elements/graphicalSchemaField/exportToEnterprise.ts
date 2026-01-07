import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import {
  GraphicalSchemaField,
  GraphicalSchemaFieldEnterprise,
} from "~/metadata/forms/elements/graphicalSchemaField/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportGraphicalSchemaFieldToEnterprise = (
  context: ConfigurationContext,
  data: GraphicalSchemaField | undefined
): GraphicalSchemaFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    const baseFields = exportFormFieldToEnterprise(context, data)
  if (!baseFields) return undefined

  return {
    ...baseFields,,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(context, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(context, data.autoMaxWidth),
    Вывод: exportSystemEnumerationToEnterprise(context, data.output, SE.UseOutputToEnterprise),
    Высота: data.height,
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    РастягиватьПоВертикали: exportBooleanToEnterprise(context, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(context, data.horizontalStretch),
    Редактирование: exportBooleanToEnterprise(context, data.edit),
    ЦветРамки: exportColorToEnterprise(context, data.borderColor),
    Ширина: data.width,
    События: exportEventsToEnterprise(context, data.events),  }
}

registerMetadata("ExportToEnterprise", "GraphicalSchemaField", exportGraphicalSchemaFieldToEnterprise)
