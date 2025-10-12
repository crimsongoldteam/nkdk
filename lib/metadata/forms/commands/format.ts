import { TCommand, TCommandEnterprise } from "./types"
import { formatI8nText } from "../../i8nText/formatI8nText"
import * as yaml from "js-yaml"

export function formatCommands(commands: TCommand[]): string[] {
  const commandsEnterprise = commands.map((command) => formatCommand(command))

  return commandsEnterprise.map((command) =>
    yaml.dump(command, { indent: 2, lineWidth: -1, noRefs: true, sortKeys: false }).trim()
  )
}

function formatCommand(command: TCommand): TCommandEnterprise {
  const result: TCommandEnterprise = {}

  result[command.name] = {
    Заголовок: formatI8nText(command.title),
    Подсказка: formatI8nText(command.toolTip),
    СочетаниеКлавиш: command.shortcut,
    Действие: command.action,
    ОтображениеКнопки: command.representation,
    ИспользованиеТекущейСтроки: command.currentRowUse
      ? command.currentRowUse === "Use"
        ? "Использовать"
        : "НеИспользует"
      : undefined,
    ИзменяемыеДанные: command.modifiesSavedData,
  }

  return result
}
