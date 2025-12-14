import { stringify } from "yaml"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { formatI8nText } from "../../commonObjects/i8nText/format"
import { TConfigurationSettings } from "../../configurationSettings/types"
import { formatSystemEnumeration } from "../../systemEnumerations/format"
import { Command, CommandEnterprise } from "./types"

export const formatCommands = (commands: Command[], configurationSettings: TConfigurationSettings): string[] => {
  const commandsEnterprise = commands.map((command) => formatCommand(command, configurationSettings))

  return commandsEnterprise.map((command) =>
    stringify(command, {
      indent: 2,
      lineWidth: 0,
    }).trim()
  )
}

const formatCommand = (command: Command, configurationSettings: TConfigurationSettings): CommandEnterprise => {
  const result: CommandEnterprise = {}

  result[command.name] = {
    Заголовок: formatI8nText(command.title, configurationSettings),
    Подсказка: formatI8nText(command.toolTip, configurationSettings),
    СочетаниеКлавиш: command.shortcut,
    Действие: command.action,
    ОтображениеКнопки: command.representation,
    ИспользованиеТекущейСтроки: formatSystemEnumeration(command.currentRowUse, SE.CurrentRowUseToEnterprise),
    ИзменяемыеДанные: command.modifiesSavedData,
  }

  return result
}
