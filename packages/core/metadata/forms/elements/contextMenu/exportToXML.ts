import { ConfigurationContext } from "~/metadata/context/types"
import { ContextMenu, ContextMenuXML } from "~/metadata/forms/elements/contextMenu/types"
import { exportFormGroupToXML } from "~/metadata/forms/elements/formGroup/exportToXML"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { BaseElement } from "../baseElement/types"
import { getContextMenuName } from "./helper"

export const exportContextMenuToXML = (
  context: ConfigurationContext,
  data: ContextMenu | undefined,
  parentElement: BaseElement
): ContextMenuXML => {
  const contextMenu = data ?? getDefaultContextMenu(parentElement)
  return exportFormGroupToXML(context, contextMenu)!
}

const getDefaultContextMenu = (parentElement: BaseElement): ContextMenu => {
  return { name: getContextMenuName(parentElement), elementType: FormElementType.FormGroup }
}
