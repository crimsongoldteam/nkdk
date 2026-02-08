import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { importI8nTextFromEnterprise } from "../../commonObjects/i8nText/importFromEnterprise"
import { importPictureFromEnterprise } from "../../commonObjects/picture/importFromEnterprise"
import { ConfigurationContext } from "../../context/types"
import { importSystemEnumerationFromEnterprise } from "../../systemEnumerations/importFromEnterprise"
import * as SE from "../../systemEnumerations/types"
import { Command, CommandEnterprise, Commands, CommandsEnterprise } from "./types"

const importCommandFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  name: string,
  data: CommandEnterprise | undefined
): Command | undefined => {
  if (!data) return undefined

  const result: Command = {
    name,
  }

  const title = importI8nTextFromEnterprise(context, { type: "I8nText" }, data.Заголовок)
  if (title !== undefined) result.title = title

  const toolTip = importI8nTextFromEnterprise(context, { type: "I8nText" }, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  if (data.СочетаниеКлавиш !== undefined) result.shortcut = data.СочетаниеКлавиш

  if (data.Действие !== undefined) result.action = data.Действие

  if (data.ОтображениеКнопки !== undefined) result.representation = data.ОтображениеКнопки

  if (data.ИзменяемыеДанные !== undefined) result.modifiesSavedData = data.ИзменяемыеДанные

  if (data.Таблица !== undefined) result.table = data.Таблица

  const picture = importPictureFromEnterprise(context, undefined, data.Картинка)
  if (picture !== undefined) result.picture = picture

  const currentRowUse = importSystemEnumerationFromEnterprise<SE.CurrentRowUse>(
    context,
    undefined,
    data.ИспользованиеТекущейСтроки,
    SE.CurrentRowUseFromEnterprise
  )
  if (currentRowUse !== undefined) result.currentRowUse = currentRowUse

  const use = importUserVisibleFromEnterprise(
    context,
    undefined,
    data.РазрешитьИспользование,
    data.ЗапретитьИспользование
  )
  if (use !== undefined) result.use = use

  return result
}

export const importCommandsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: CommandsEnterprise | undefined
): Commands => {
  if (!data) return []

  const result: Commands = []

  for (const [name, commandData] of Object.entries(data)) {
    const command = importCommandFromEnterprise(context, undefined, name, commandData)
    if (command) {
      result.push(command)
    }
  }

  return result
}
