import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importPictureFromEnterprise } from "~/metadata/commonObjects/picture/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { FormCommand, FormCommands, FormCommandsYAML, FormCommandYAML } from "./types"

const importCommandFromEnterprise = (
  context: ConfigurationContext,
  name: string,
  data: FormCommandYAML | undefined
): FormCommand | undefined => {
  if (!data) return undefined

  const result: FormCommand = {
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

  const currentRowUse = importSystemEnumerationFromYAML<SE.CurrentRowUse>(
    context,
    { type: "SystemEnumeration", typeSE: "CurrentRowUse" },
    data.ИспользованиеТекущейСтроки
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
  data: FormCommandsYAML | undefined
): FormCommands => {
  if (!data) return []

  const result: FormCommands = []

  for (const [name, commandData] of Object.entries(data)) {
    const command = importCommandFromEnterprise(context, name, commandData)
    if (command) {
      result.push(command)
    }
  }

  return result
}

registerTypeRule("FormCommands", "importFromEnterprise", importCommandsFromEnterprise)
