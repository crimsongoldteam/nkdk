import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importUserVisibleFromYAML } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { StandardCommandsGroupFromEnterprise } from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../../../context/types"
import { PropertyRule } from "../../elements/calendarField/rules"
import {
  CommandInterface,
  CommandInterfaceEnterprise,
  CommandInterfaceItem,
  CommandInterfaceItemEnterprise,
} from "./types"

export const importCommandInterfaceFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: CommandInterfaceEnterprise | undefined
): CommandInterface | undefined => {
  if (!data) return undefined

  const result: CommandInterface = {
    NavigationPanel: [],
    CommandBar: [],
    itemType: "CommandInterface",
  }

  if (data.ПанельНавигации && data.ПанельНавигации.length > 0) {
    result.NavigationPanel = data.ПанельНавигации.map((item) => importCommandInterfaceItemFromEnterprise(context, item))
  }

  if (data.КоманднаяПанель && data.КоманднаяПанель.length > 0) {
    result.CommandBar = data.КоманднаяПанель.map((item) => importCommandInterfaceItemFromEnterprise(context, item))
  }

  return result
}

const importCommandInterfaceItemFromEnterprise = (
  context: ConfigurationContext,
  item: CommandInterfaceItemEnterprise
): CommandInterfaceItem => {
  const result: CommandInterfaceItem = {
    command: item.Команда,
    type: item.Тип,
    defaultVisible: importBooleanFromEnterprise(context, undefined, item.Автовидимость)!,
    itemType: "CommandInterfaceItem",
  }

  if (item.ГруппаКоманд) {
    result.commandGroup = StandardCommandsGroupFromEnterprise[item.ГруппаКоманд]
  }

  const visible = importUserVisibleFromYAML<CommandInterfaceItem>({
    context,
    rule: { type: "UserVisible", yaml: UserVisibleKeysEnterprise.Allow, yamlDeny: UserVisibleKeysEnterprise.Deny },
    value: item[UserVisibleKeysEnterprise.Allow],
    yaml: item,
  })
  if (visible) {
    result.visible = visible
  }

  return result
}

registerTypeRule("CommandInterface", "importFromEnterprise", importCommandInterfaceFromEnterprise)
