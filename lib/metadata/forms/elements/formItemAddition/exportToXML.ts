import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { exportCommandBarToXML } from "../commandBar/exportToXML"
import { exportChildItemsToXML } from "../childItems/exportToXML"
import { exportBaseElementToXML } from "../baseElement/exportToXML"
import { TFormItemAdditionXML, TFormItemAddition } from "./types"

export const exportFormItemAdditionToXML = (data: TFormItemAddition | undefined): TFormItemAdditionXML | undefined => {
  if (!data) return undefined

  const base = exportBaseElementToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    DisplayImportance: data.displayImportance,
    VerticalAlignInGroup: data.verticalAlignInGroup,
    Type: data.type,
    Visible: data.visible,
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    Enabled: data.enabled,
    Title: exportI8nTextToXML(data.title),
    ContextMenu: exportCommandBarToXML(data.contextMenu),
    ToolTipRepresentation: data.toolTipRepresentation,
    ToolTip: exportI8nTextToXML(data.toolTip),
    ChildItems: exportChildItemsToXML(data.childItems),
    ExtendedToolTip: exportFormDecorationToXML(data.extendedToolTip),
  }
}