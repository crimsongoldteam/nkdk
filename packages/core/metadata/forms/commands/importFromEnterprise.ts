import { importI8nTextFromEnterprise } from "../../commonObjects/i8nText/importFromEnterprise"
import { ConfigurationContext } from "../../context/types"
import { Command, CommandEnterprise, Commands, CommandsEnterprise } from "./types"

export const importCommandFromEnterprise = (
  context: ConfigurationContext,
  name: string,
  data: CommandEnterprise | undefined
): Command | undefined => {
  if (!data) return undefined

  const result: Command = {
    name,
  }

  const title = importI8nTextFromEnterprise(context, data.Заголовок)
  if (title !== undefined) result.title = title

  const toolTip = importI8nTextFromEnterprise(context, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  if (data.СочетаниеКлавиш !== undefined) result.shortcut = data.СочетаниеКлавиш

  if (data.Действие !== undefined) result.action = data.Действие

  if (data.ОтображениеКнопки !== undefined) result.representation = data.ОтображениеКнопки

  if (data.ИзменяемыеДанные !== undefined) result.modifiesSavedData = data.ИзменяемыеДанные

  return result
}

export const importCommandsFromEnterprise = (
  context: ConfigurationContext,
  data: CommandsEnterprise | undefined
): Commands => {
  if (!data) return []

  const result: Commands = []

  for (const [name, commandData] of Object.entries(data)) {
    const command = importCommandFromEnterprise(context, name, commandData)
    if (command) {
      result.push(command)
    }
  }

  return result
}
