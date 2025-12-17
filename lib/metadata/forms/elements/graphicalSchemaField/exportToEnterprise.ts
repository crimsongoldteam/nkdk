import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import {
  GraphicalSchemaField,
  GraphicalSchemaFieldEnterprise,
} from "~/lib/metadata/forms/elements/graphicalSchemaField/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportGraphicalSchemaFieldToEnterprise = (
  data: GraphicalSchemaField | undefined
): GraphicalSchemaFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToEnterprise(data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth),
    ЦветРамки: exportColorToEnterprise(data.borderColor),
    Редактирование: exportBooleanToEnterprise(data.edit),
    Высота: data.height,
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    Вывод: exportSystemEnumerationToEnterprise(data.output, SE.UseOutputToEnterprise),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch),
    Ширина: data.width,
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
    Events: exportEventsToEnterprise(data.events),
  }
}

registerEnterpriseExport(FormElementType.GraphicalSchemaField, exportGraphicalSchemaFieldToEnterprise)
