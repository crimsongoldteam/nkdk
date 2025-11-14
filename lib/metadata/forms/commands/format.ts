import { TCommand, TCommandEnterprise } from "./types"
import { formatI8nText } from "../../commonObjects/i8nText/format"
import {
  ZCurrentRowUse,
  ZCurrentRowUseEnterprise,
} from "../../systemEnumerations/types"
import * as yaml from "js-yaml"
import { formatSystemEnumeration } from "../../systemEnumerations/format"

export function formatCommands(commands: TCommand[]): string[] {
  const commandsEnterprise = commands.map((command) => formatCommand(command))

  return commandsEnterprise.map((command) =>
    yaml
      .dump(command, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
      })
      .trim()
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
    ИспользованиеТекущейСтроки: formatSystemEnumeration(
      command.currentRowUse,
      ZCurrentRowUse,
      ZCurrentRowUseEnterprise
    ),
    ИзменяемыеДанные: command.modifiesSavedData,
  }

  return result
}
