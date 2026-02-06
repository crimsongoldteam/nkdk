import { ConfigurationContext } from "~/metadata/context/types"
import { ContextMenu, ContextMenuXML } from "~/metadata/forms/elements/contextMenu/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerTypeRule } from "~/metadata/metadataFactory"
import { exportChildItemsToXML } from "../../collections/childItems/exportToXML"
import { exportElementPropsToXML } from "../baseElement/exportToXML"
import { PropertyRule } from "../calendarField/rules"
import { getDefaultContextMenu } from "./defaults"
import { getContextMenuName } from "./helper"

/** @deprecated */
export function exportContextMenuDeprecatedToXML(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ContextMenu | undefined,
  parentElement: { name: string }
): ContextMenuXML {
  const contextMenu = data ?? getDefaultContextMenu()
  const name = getContextMenuName(parentElement)
  const baseFields = exportElementPropsToXML(context, undefined, { name })
  const result: ContextMenuXML = { ...baseFields }

  if (contextMenu.displayImportance !== undefined) result._DisplayImportance = contextMenu.displayImportance

  if (contextMenu.autofill !== undefined) result.Autofill = contextMenu.autofill

  const childItems = exportChildItemsToXML(context, undefined, contextMenu.childItems)
  if (childItems !== undefined) result.ChildItems = childItems

  return sortObject(result)
}

export function exportContextMenuToXML(
  context: Required<ConfigurationContext>,
  rule: PropertyRule,
  data: ContextMenu | undefined
): ContextMenuXML {
  const parentElement = context.elementContext
  return exportContextMenuDeprecatedToXML(context, rule, data, parentElement)
}

registerTypeRule("ContextMenu", "exportToXML", exportContextMenuToXML as any)
