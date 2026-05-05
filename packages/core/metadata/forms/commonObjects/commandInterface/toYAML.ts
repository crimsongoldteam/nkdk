import { exportBooleanToYAML } from "~/metadata/commonObjects/boolean/toYAML"
import { exportUserVisibleToYAMLDeprecated } from "~/metadata/commonObjects/userVisible/toYAML"
import { UserVisibleKeysYAML } from "~/metadata/commonObjects/userVisible/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { StandardCommandsGroupToYAML } from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../../../context/types"
import { PropertyRule } from "../../elements/calendarField/rules"
import { CommandInterface, CommandInterfaceItem, CommandInterfaceItemYAML, CommandInterfaceYAML } from "./types"

export const exportCommandInterfaceToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  data: CommandInterface | undefined
): CommandInterfaceYAML | undefined => {
  if (!data) return undefined

  const result: CommandInterfaceYAML = {}

  if (data.NavigationPanel && data.NavigationPanel.length > 0) {
    result.ПанельНавигации = data.NavigationPanel.map((item) => exportCommandInterfaceItemToYAML(context, item))
  }

  if (data.CommandBar && data.CommandBar.length > 0) {
    result.КоманднаяПанель = data.CommandBar.map((item) => exportCommandInterfaceItemToYAML(context, item))
  }

  if (Object.keys(result).length === 0) return undefined

  return result
}

const exportCommandInterfaceItemToYAML = (
  context: ConfigurationContext,
  item: CommandInterfaceItem
): CommandInterfaceItemYAML => {
  const result: CommandInterfaceItemYAML = {
    Команда: item.command,
    Тип: item.type,
    Автовидимость: exportBooleanToYAML(context, undefined, item.defaultVisible)!,
  }

  if (item.commandGroup) {
    result.ГруппаКоманд = StandardCommandsGroupToYAML[item.commandGroup]
  }

  if (item.visible && item.visible.values.length > 0) {
    const visibleYAML = exportUserVisibleToYAMLDeprecated(context, undefined, item.visible, {
      allow: UserVisibleKeysYAML.Allow,
      deny: UserVisibleKeysYAML.Deny,
    })
    if (visibleYAML) {
      Object.assign(result, visibleYAML)
    }
  }

  return result
}

registerTypeRule("CommandInterface", "exportToYAML", exportCommandInterfaceToYAML)
