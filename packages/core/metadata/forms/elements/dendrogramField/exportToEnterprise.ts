import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { DendrogramField, DendrogramFieldEnterprise } from "~/metadata/forms/elements/dendrogramField/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

const exportDendrogramFieldEventsToEnterprise = (
  data:
    | {
        onChange?: string
        selection?: string
        detailProcessing?: string
      }
    | undefined
):
  | {
      ПриИзменении?: string
      Выбор?: string
      ОбработкаРасшифровки?: string
    }
  | undefined => {
  if (!data) return undefined

  const result: {
    ПриИзменении?: string
    Выбор?: string
    ОбработкаРасшифровки?: string
  } = {}

  if (data.onChange !== undefined) result.ПриИзменении = data.onChange
  if (data.selection !== undefined) result.Выбор = data.selection
  if (data.detailProcessing !== undefined) result.ОбработкаРасшифровки = data.detailProcessing

  return Object.keys(result).length > 0 ? result : undefined
}

export const exportDendrogramFieldToEnterprise = (
  context: ConfigurationContext,
  data: DendrogramField | undefined
): DendrogramFieldEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportFormFieldToEnterprise(context, data)

  const result: DendrogramFieldEnterprise = {
    ...baseFields,
  }

  const autoMaxHeight = exportBooleanToEnterprise(context, data.autoMaxHeight)
  if (autoMaxHeight !== undefined) result.АвтоМаксимальнаяВысота = autoMaxHeight

  const autoMaxWidth = exportBooleanToEnterprise(context, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

  if (data.height !== undefined) result.Высота = data.height

  if (data.maxHeight !== undefined) result.МаксимальнаяВысота = data.maxHeight

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const verticalStretch = exportBooleanToEnterprise(context, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  if (data.width !== undefined) result.Ширина = data.width

  const events = exportDendrogramFieldEventsToEnterprise(data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata("ExportPartialToEnterprise", "DendrogramField", exportDendrogramFieldToEnterprise)
