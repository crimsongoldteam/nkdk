import { TCommand, TCommandEnterprise } from "./types"
import { formatI8nText } from "../../commonObjects/i8nText/format"
import { stringify } from "yaml"
import { formatSystemEnumeration } from "../../systemEnumerations/format"
import { TElementRule } from "~/lib/rulesManager/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { TConfigurationSettings } from "../../configurationSettings/types"

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

export const formatCommands = (
  commands: TCommand[],
  configurationSettings: TConfigurationSettings
): string[] => {
  const commandsEnterprise = commands.map((command) =>
    formatCommand(command, configurationSettings)
  )

  return commandsEnterprise.map((command) =>
    stringify(command, {
      indent: 2,
      lineWidth: 0,
      sortKeys: false,
    }).trim()
  )
}

const formatCommand = (
  command: TCommand,
  configurationSettings: TConfigurationSettings
): TCommandEnterprise => {
  const result: TCommandEnterprise = {}

  result[command.name] = {
    Заголовок: formatI8nText(command.title, configurationSettings),
    Подсказка: formatI8nText(command.toolTip, configurationSettings),
    СочетаниеКлавиш: command.shortcut,
    Действие: command.action,
    ОтображениеКнопки: command.representation,
    ИспользованиеТекущейСтроки: formatSystemEnumeration(
      command.currentRowUse,
      configurationSettings,
      ZCurrentRowUseRule
    ) as SE.TCurrentRowUseEnterprise | undefined,
    ИзменяемыеДанные: command.modifiesSavedData,
  }

  return result
}
