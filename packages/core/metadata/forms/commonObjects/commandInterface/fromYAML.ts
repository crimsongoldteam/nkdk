import { importUserVisibleFromYAML } from "~/metadata/commonObjects/userVisible/fromYAML"
import { UserVisibleKeysYAML } from "~/metadata/commonObjects/userVisible/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { StandardCommandsGroupFromYAML } from "~/metadata/systemEnumerations/types"
import type { StandardCommandsGroupYAML } from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../../../context/types"
import { PropertyRule } from "../../elements/calendarField/rules"
import { CommandInterface, CommandInterfaceItem, CommandInterfaceItemYAML, CommandInterfaceYAML } from "./types"

export const importCommandInterfaceFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  data: CommandInterfaceYAML | undefined
): CommandInterface | undefined => {
  if (!data) return undefined

  const result: CommandInterface = {
    NavigationPanel: [],
    CommandBar: [],
    itemType: "CommandInterface",
  }

  if (data.ПанельНавигации && data.ПанельНавигации.length > 0) {
    result.NavigationPanel = data.ПанельНавигации.map((item) => importCommandInterfaceItemFromYAML(context, item))
  }

  if (data.КоманднаяПанель && data.КоманднаяПанель.length > 0) {
    result.CommandBar = data.КоманднаяПанель.map((item) => importCommandInterfaceItemFromYAML(context, item))
  }

  return result
}

const isStandardCommandsGroupYAML = (commandGroup: string): commandGroup is StandardCommandsGroupYAML =>
  commandGroup in StandardCommandsGroupFromYAML

const importCommandGroupFromYAML = (commandGroup: StandardCommandsGroupYAML | string): string => {
  if (isStandardCommandsGroupYAML(commandGroup)) return StandardCommandsGroupFromYAML[commandGroup]

  return commandGroup
}

const importCommandInterfaceItemFromYAML = (
  context: ConfigurationContext,
  item: CommandInterfaceItemYAML
): CommandInterfaceItem => {
  const result: CommandInterfaceItem = {
    command: item.Команда,
    type: item.Тип,
    attribute: item.Реквизит,
    itemType: "CommandInterfaceItem",
  }

  if (item.Автовидимость === "Ложь") {
    result.defaultVisible = false
  }

  if (item.Индекс !== undefined) {
    result.index = item.Индекс
  }

  if (item.ГруппаКоманд) {
    result.commandGroup = importCommandGroupFromYAML(item.ГруппаКоманд)
  }

  const visible = importUserVisibleFromYAML({
    context,
    rule: { type: "UserVisible", yaml: UserVisibleKeysYAML.Allow, yamlDeny: UserVisibleKeysYAML.Deny },
    value: item[UserVisibleKeysYAML.Allow],
    yaml: item,
  })
  if (visible) {
    result.visible = visible
  }

  return result
}

registerTypeRule("CommandInterface", "importFromYAML", importCommandInterfaceFromYAML)
