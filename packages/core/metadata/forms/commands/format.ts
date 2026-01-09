import { stringify } from "yaml"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportI8nTextToEnterprise } from "../../commonObjects/i8nText/exportToEnterprise"
import { ConfigurationContext } from "../../context/types"
import { exportSystemEnumerationToEnterprise } from "../../systemEnumerations/exportToEnterprise"
import { Command, CommandEnterprise } from "./types"

export const formatCommands = (context: ConfigurationContext, commands: Command[]): string[] => {
  const commandsEnterprise = commands.map((command) => formatCommand(context, command))

  return commandsEnterprise.map((command) =>
    stringify(command, {
      indent: 2,
      lineWidth: 0,
    }).trim()
  )
}

const formatCommand = (context: ConfigurationContext, command: Command): CommandEnterprise => {
  let result: CommandEnterprise = {}

  return {
    Заголовок: exportI8nTextToEnterprise(context, command.title),
    Подсказка: exportI8nTextToEnterprise(context, command.toolTip),
    СочетаниеКлавиш: command.shortcut,
    Действие: command.action,
    ОтображениеКнопки: command.representation,
    ИспользованиеТекущейСтроки: exportSystemEnumerationToEnterprise(
      context,
      command.currentRowUse,
      SE.CurrentRowUseToEnterprise
    ),
    ИзменяемыеДанные: command.modifiesSavedData,
  }

  return result
}
