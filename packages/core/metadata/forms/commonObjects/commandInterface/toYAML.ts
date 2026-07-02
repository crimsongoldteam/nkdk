import { exportUserVisibleToYAML } from "../../../commonObjects/userVisible/toYAML"
import { UserVisibleKeysYAML } from "../../../commonObjects/userVisible/types"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import { StandardCommandsGroupToYAML } from "../../../systemEnumerations/types"
import type { StandardCommandsGroup } from "../../../systemEnumerations/types"
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

const isStandardCommandsGroup = (commandGroup: string): commandGroup is StandardCommandsGroup =>
  commandGroup in StandardCommandsGroupToYAML

const exportCommandGroupToYAML = (commandGroup: StandardCommandsGroup | string): string => {
  if (isStandardCommandsGroup(commandGroup)) return StandardCommandsGroupToYAML[commandGroup]

  return commandGroup
}

const exportCommandInterfaceItemToYAML = (
  context: ConfigurationContext,
  item: CommandInterfaceItem
): CommandInterfaceItemYAML => {
  const result: CommandInterfaceItemYAML = {
    Команда: item.command,
    Тип: item.type,
  }

  if (item.attribute !== undefined) {
    result.Реквизит = item.attribute
  }

  if (item.defaultVisible === false) {
    result.Автовидимость = "Ложь"
  }

  if (item.index !== undefined) {
    result.Индекс = item.index
  }

  if (item.commandGroup) {
    result.ГруппаКоманд = exportCommandGroupToYAML(item.commandGroup)
  }

  if (item.visible) {
    const visibleYAML = exportUserVisibleToYAML(
      context,
      { type: "UserVisible", yaml: UserVisibleKeysYAML.Value },
      item.visible
    )
    if (visibleYAML) {
      Object.assign(result, visibleYAML)
    }
  }

  return result
}

registerTypeRule("CommandInterface", "exportToYAML", exportCommandInterfaceToYAML)
