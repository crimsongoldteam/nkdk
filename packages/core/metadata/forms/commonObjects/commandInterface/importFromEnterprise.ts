import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
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
  _rule: PropertyRule | undefined,
  data: CommandInterfaceEnterprise | undefined
): CommandInterface | undefined => {
  if (!data) return undefined

  const result: CommandInterface = {
    NavigationPanel: [],
    CommandBar: [],
  }

  if (data.ПанельНавигации && data.ПанельНавигации.length > 0) {
    result.NavigationPanel = data.ПанельНавигации.map((item) =>
      importCommandInterfaceItemFromEnterprise(context, undefined, item)
    )
  }

  if (data.КоманднаяПанель && data.КоманднаяПанель.length > 0) {
    result.CommandBar = data.КоманднаяПанель.map((item) =>
      importCommandInterfaceItemFromEnterprise(context, undefined, item)
    )
  }

  return result
}

const importCommandInterfaceItemFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  item: CommandInterfaceItemEnterprise
): CommandInterfaceItem => {
  const result: CommandInterfaceItem = {
    command: item.Команда,
    type: item.Тип,
    defaultVisible: importBooleanFromEnterprise(context, undefined, item.Автовидимость)!,
  }

  if (item.ГруппаКоманд) {
    result.commandGroup = StandardCommandsGroupFromEnterprise[item.ГруппаКоманд]
  }

  const visible = importUserVisibleFromEnterprise(
    context,
    undefined,
    item[UserVisibleKeysEnterprise.Allow],
    item[UserVisibleKeysEnterprise.Deny]
  )
  if (visible) {
    result.visible = visible
  }

  return result
}
