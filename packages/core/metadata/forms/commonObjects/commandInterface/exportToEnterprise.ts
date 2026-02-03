import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { StandardCommandsGroupToEnterprise } from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../../../context/types"
import {
  CommandInterface,
  CommandInterfaceEnterprise,
  CommandInterfaceItem,
  CommandInterfaceItemEnterprise,
} from "./types"
import { PropertyRule } from "../../elements/calendarField/rules"

export const exportCommandInterfaceToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: CommandInterface | undefined
): CommandInterfaceEnterprise | undefined => {
  if (!data) return undefined

  const result: CommandInterfaceEnterprise = {}

  if (data.NavigationPanel && data.NavigationPanel.length > 0) {
    result.ПанельНавигации = data.NavigationPanel.map((item) =>
      exportCommandInterfaceItemToEnterprise(context, undefined, item)
    )
  }

  if (data.CommandBar && data.CommandBar.length > 0) {
    result.КоманднаяПанель = data.CommandBar.map((item) =>
      exportCommandInterfaceItemToEnterprise(context, undefined, item)
    )
  }

  if (Object.keys(result).length === 0) return undefined

  return result
}

const exportCommandInterfaceItemToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  item: CommandInterfaceItem
): CommandInterfaceItemEnterprise => {
  const result: CommandInterfaceItemEnterprise = {
    Команда: item.command,
    Тип: item.type,
    Автовидимость: exportBooleanToEnterprise(context, undefined, item.defaultVisible)!,
  }

  if (item.commandGroup) {
    result.ГруппаКоманд = StandardCommandsGroupToEnterprise[item.commandGroup]
  }

  if (item.visible && item.visible.values.length > 0) {
    const visibleEnterprise = exportUserVisibleToEnterprise(context, undefined, item.visible, {
      allow: UserVisibleKeysEnterprise.Allow,
      deny: UserVisibleKeysEnterprise.Deny,
    })
    if (visibleEnterprise) {
      Object.assign(result, visibleEnterprise)
    }
  }

  return result
}
