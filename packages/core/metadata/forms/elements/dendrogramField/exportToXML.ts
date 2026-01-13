import { ConfigurationContext } from "~/metadata/context/types"
import { DendrogramField, DendrogramFieldXML } from "~/metadata/forms/elements/dendrogramField/types"
import { exportFormFieldToXML } from "~/metadata/forms/elements/formField/exportToXML"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ToXMLType } from "~/metadata/metadataFactory/types"
import { ImportExportReturn } from "../types"

export function exportDendrogramFieldToXML<From extends DendrogramField | undefined>(
  context: ConfigurationContext,
  data: From
): ImportExportReturn<From, ToXMLType<From>> {
  if (data === undefined) return undefined

  const baseFields = exportFormFieldToXML(context, data)
  if (!baseFields) return undefined

  const result: DendrogramFieldXML = {
    ...baseFields,
  }

  if (data.autoMaxHeight !== undefined) result.AutoMaxHeight = data.autoMaxHeight

  if (data.autoMaxWidth !== undefined) result.AutoMaxWidth = data.autoMaxWidth

  if (data.height !== undefined) result.Height = data.height

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.maxHeight !== undefined) result.MaxHeight = data.maxHeight

  if (data.maxWidth !== undefined) result.MaxWidth = data.maxWidth

  if (data.verticalStretch !== undefined) result.VerticalStretch = data.verticalStretch

  if (data.width !== undefined) result.Width = data.width

  return sortObject(result) as ImportExportReturn<From, ToXMLType<From>>
}

registerMetadata("ExportToXML", "DendrogramField", exportDendrogramFieldToXML)
