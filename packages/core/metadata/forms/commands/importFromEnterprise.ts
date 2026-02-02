import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { importI8nTextFromEnterprise } from "../../commonObjects/i8nText/importFromEnterprise"
import { importPictureFromEnterprise } from "../../commonObjects/picture/importFromEnterprise"
import { ConfigurationContext } from "../../context/types"
import { importSystemEnumerationFromYAML } from "../../systemEnumerations/importFromEnterprise"
import * as SE from "../../systemEnumerations/types"
import { Command, CommandEnterprise, Commands, CommandsEnterprise } from "./types"

const importCommandFromEnterprise = (
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

  if (data.Таблица !== undefined) result.table = data.Таблица

  const picture = importPictureFromEnterprise(context, data.Картинка)
  if (picture !== undefined) result.picture = picture

  const currentRowUse = importSystemEnumerationFromYAML<SE.CurrentRowUse>(
    context,
    data.ИспользованиеТекущейСтроки,
    SE.CurrentRowUseFromEnterprise
  )
  if (currentRowUse !== undefined) result.currentRowUse = currentRowUse

  const use = importUserVisibleFromEnterprise(context, data.РазрешитьИспользование, data.ЗапретитьИспользование)
  if (use !== undefined) result.use = use

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
