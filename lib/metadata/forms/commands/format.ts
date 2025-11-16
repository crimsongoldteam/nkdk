import { TCommand, TCommandEnterprise } from "./types"
import { formatI8nText } from "../../commonObjects/i8nText/format"
import * as yaml from "js-yaml"
import { formatSystemEnumeration } from "../../systemEnumerations/format"
import { TElementRule } from "~/lib/rulesManager/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

const ZCurrentRowUseRule: TElementRule = {
  nameEnterprise: "ИспользованиеТекущейСтроки",
  get type() {
    return SE.ZCurrentRowUse
  },
  get typeEnterprise() {
    return SE.ZCurrentRowUseEnterprise
  },
  inProperties: () => true,
}

export const formatCommands = (commands: TCommand[]): string[] => {
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

const formatCommand = (command: TCommand): TCommandEnterprise => {
  const result: TCommandEnterprise = {}

  result[command.name] = {
    Заголовок: formatI8nText(command.title),
    Подсказка: formatI8nText(command.toolTip),
    СочетаниеКлавиш: command.shortcut,
    Действие: command.action,
    ОтображениеКнопки: command.representation,
    ИспользованиеТекущейСтроки: formatSystemEnumeration(
      command.currentRowUse,
      ZCurrentRowUseRule
    ) as SE.TCurrentRowUseEnterprise | undefined,
    ИзменяемыеДанные: command.modifiesSavedData,
  }

  return result
}
