import { exportUserVisibleToYAML } from "../../../commonObjects/userVisible/toYAML"
import { UserVisibleKeysYAML } from "../../../commonObjects/userVisible/types"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { StandardCommandsGroupToYAML } from "../../../systemEnumerations/types"
import type { StandardCommandsGroup } from "../../../systemEnumerations/types"
import { ConfigurationContext, type XmlAnomalyAnnotations } from "@nkdk/runtime"
import type { ExportToYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { PropertyRule } from "../../elements/calendarField/rules"
import { CommandInterface, CommandInterfaceItem, CommandInterfaceItemYAML, CommandInterfaceYAML } from "./types"

export const exportCommandInterfaceToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  data: CommandInterface | undefined,
  annotations?: XmlAnomalyAnnotations,
): CommandInterfaceYAML | undefined => {
  if (!data) return undefined

  const result: CommandInterfaceYAML = {}

  if (data.NavigationPanel && data.NavigationPanel.length > 0) {
    result.ПанельНавигации = data.NavigationPanel.map((item) => exportCommandInterfaceItemToYAML(context, item, annotations))
  }

  if (data.CommandBar && data.CommandBar.length > 0) {
    result.КоманднаяПанель = data.CommandBar.map((item) => exportCommandInterfaceItemToYAML(context, item, annotations))
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
  item: CommandInterfaceItem,
  annotations?: XmlAnomalyAnnotations,
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
      item.visible,
      annotations,
    )
    if (visibleYAML) {
      Object.assign(result, visibleYAML)
    }
  }

  return result
}

const exportAnnotatedCommandInterfaceToYAML: ExportToYAMLFunctionNew = ({ context, rule, value, annotations }) =>
  exportCommandInterfaceToYAML(context, rule, value, annotations)

export const metadataPropertyRule000 = definePropertyTypeRule("CommandInterface", "exportToYAML", exportAnnotatedCommandInterfaceToYAML)
