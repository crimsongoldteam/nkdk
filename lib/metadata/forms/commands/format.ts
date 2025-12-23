import { stringify } from "yaml"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { exportI8nTextToEnterprise } from "../../commonObjects/i8nText/exportToEnterprise"
import { ConfigurationSettings } from "../../configurationSettings/types"
import { exportSystemEnumerationToEnterprise } from "../../systemEnumerations/exportToEnterprise"
import { Command, CommandEnterprise } from "./types"

export const formatCommands = (commands: Command[], configurationSettings: ConfigurationSettings): string[] => {
  const commandsEnterprise = commands.map((command) => formatCommand(command, configurationSettings))

  return commandsEnterprise.map((command) =>
    stringify(command, {
      indent: 2,
      lineWidth: 0,
    }).trim()
  )
}

const formatCommand = (command: Command, configurationSettings: ConfigurationSettings): CommandEnterprise => {
  let result: CommandEnterprise = {}

  return {
    Заголовок: exportI8nTextToEnterprise(configurationSettings, command.title),
    Подсказка: exportI8nTextToEnterprise(configurationSettings, command.toolTip),
    СочетаниеКлавиш: command.shortcut,
    Действие: command.action,
    ОтображениеКнопки: command.representation,
    ИспользованиеТекущейСтроки: exportSystemEnumerationToEnterprise(configurationSettings, command.currentRowUse, SE.CurrentRowUseToEnterprise),
    ИзменяемыеДанные: command.modifiesSavedData,
  }

  return result
}
