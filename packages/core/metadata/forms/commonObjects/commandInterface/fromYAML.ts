import { importBooleanFromYAML } from "~/metadata/commonObjects/boolean/fromYAML"
import { importUserVisibleFromYAML } from "~/metadata/commonObjects/userVisible/fromYAML"
import { UserVisibleKeysYAML } from "~/metadata/commonObjects/userVisible/types"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { StandardCommandsGroupFromYAML } from "~/metadata/systemEnumerations/types"
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

const importCommandInterfaceItemFromYAML = (
  context: ConfigurationContext,
  item: CommandInterfaceItemYAML
): CommandInterfaceItem => {
  const result: CommandInterfaceItem = {
    command: item.Команда,
    type: item.Тип,
    defaultVisible: importBooleanFromYAML(context, undefined, item.Автовидимость)!,
    itemType: "CommandInterfaceItem",
  }

  if (item.ГруппаКоманд) {
    result.commandGroup = StandardCommandsGroupFromYAML[item.ГруппаКоманд]
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
