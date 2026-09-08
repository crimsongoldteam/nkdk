import { importUserVisibleFromYAML } from "../../../commonObjects/userVisible/fromYAML"
import { UserVisibleKeysYAML } from "../../../commonObjects/userVisible/types"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { StandardCommandsGroupFromYAML } from "../../../systemEnumerations/types"
import type { StandardCommandsGroupYAML } from "../../../systemEnumerations/types"
import { ConfigurationContext, type XmlAnomalyAnnotations } from "@nkdk/runtime"
import type { ImportFromYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { PropertyRule } from "../../elements/calendarField/rules"
import { CommandInterface, CommandInterfaceItem, CommandInterfaceItemYAML, CommandInterfaceYAML } from "./types"

export const importCommandInterfaceFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  data: CommandInterfaceYAML | undefined,
  annotations?: XmlAnomalyAnnotations,
): CommandInterface | undefined => {
  if (!data) return undefined

  const result: CommandInterface = {
    NavigationPanel: [],
    CommandBar: [],
    itemType: "CommandInterface",
  }

  if (data.ПанельНавигации && data.ПанельНавигации.length > 0) {
    result.NavigationPanel = data.ПанельНавигации.map((item) => importCommandInterfaceItemFromYAML(context, item, annotations))
  }

  if (data.КоманднаяПанель && data.КоманднаяПанель.length > 0) {
    result.CommandBar = data.КоманднаяПанель.map((item) => importCommandInterfaceItemFromYAML(context, item, annotations))
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
  item: CommandInterfaceItemYAML,
  annotations?: XmlAnomalyAnnotations,
): CommandInterfaceItem => {
  const result: CommandInterfaceItem = {
    command: item.Команда,
    type: item.Тип,
    itemType: "CommandInterfaceItem",
  }

  if (item.Реквизит !== undefined) {
    result.attribute = item.Реквизит
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
    rule: { type: "UserVisible", yaml: UserVisibleKeysYAML.Value },
    value: item[UserVisibleKeysYAML.Value],
    yaml: item,
    annotations,
  })
  if (visible) {
    result.visible = visible
  }

  return result
}

const importAnnotatedCommandInterfaceFromYAML: ImportFromYAMLFunctionNew = ({ context, rule, value, annotations }) =>
  importCommandInterfaceFromYAML(context, rule, value, annotations)

export const metadataPropertyRule000 = definePropertyTypeRule("CommandInterface", "importFromYAML", importAnnotatedCommandInterfaceFromYAML)
