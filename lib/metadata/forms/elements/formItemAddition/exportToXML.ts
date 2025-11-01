import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { exportFormGroupToXML } from "../formGroup/exportToXML"
import { exportChildItemsToXML } from "../childItems/exportToXML"
import { exportBaseElementToXML } from "../baseElement/exportToXML"
import { TFormItemAdditionXML, TFormItemAddition } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"
import { sortObjectByKeys } from "~/lib/xml/export/sortObjectKeys"

const ORDER: string[] = []

export const exportFormItemAdditionToXML = (data: TFormItemAddition | undefined): TFormItemAdditionXML | undefined => {
  if (!data) return undefined

  const base = exportBaseElementToXML(data)
  if (!base) return undefined
   
  return sortObjectByKeys<TFormItemAdditionXML>( {
    ...base,
    ContextMenu: exportFormGroupToXML(data.contextMenu),
    DisplayImportance: data.displayImportance,
    Enabled: data.enabled,
    ExtendedToolTip: exportFormDecorationToXML(data.extendedToolTip),
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    Title: exportI8nTextToXML(data.title),
    ToolTip: exportI8nTextToXML(data.toolTip),
    ToolTipRepresentation: data.toolTipRepresentation,
    Type: data.type,
    VerticalAlignInGroup: data.verticalAlignInGroup,
    Visible: data.visible,
    ChildItems: exportChildItemsToXML(data.childItems),
  }, ORDER)
}

registerExport(ZElementType.enum.FormItemAddition, exportFormItemAdditionToXML)