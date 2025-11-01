import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { exportCommandBarToXML } from "../commandBar/exportToXML"
import { exportChildItemsToXML } from "../childItems/exportToXML"
import { exportBaseElementToXML } from "../baseElement/exportToXML"
import { TFormItemAdditionXML, TFormItemAddition } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportFormItemAdditionToXML = (data: TFormItemAddition | undefined): TFormItemAdditionXML | undefined => {
  if (!data) return undefined

  const base = exportBaseElementToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    ContextMenu: exportCommandBarToXML(data.contextMenu),
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
  }
}

registerExport(ZElementType.enum.FormItemAddition, exportFormItemAdditionToXML)