import { importI8nTextFromYAML } from "~/metadata/commonObjects/i8nText/fromYAML"
import { importPictureFromYAML } from "~/metadata/commonObjects/picture/fromYAML"
import { UserVisibleKeysYAML } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { importSystemEnumerationFromYAMLDeprecated } from "~/metadata/systemEnumerations/fromYAML"
import * as SE from "~/metadata/systemEnumerations/types"
import { FormCommand, FormCommands, FormCommandsYAML, FormCommandYAML } from "./types"
import { importUserVisibleFromYAML } from "~/metadata/commonObjects/userVisible/fromYAML"

const importCommandFromYAML = (
  context: ConfigurationContext,
  name: string,
  data: FormCommandYAML | undefined
): FormCommand | undefined => {
  if (!data) return undefined

  const result: FormCommand = {
    itemType: "FormCommand",
    name,
  }

  const title = importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value: data.Заголовок })
  if (title !== undefined) result.title = title

  const toolTip = importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value: data.Подсказка })
  if (toolTip !== undefined) result.toolTip = toolTip

  if (data.СочетаниеКлавиш !== undefined) result.shortcut = data.СочетаниеКлавиш

  if (data.Действие !== undefined) result.action = data.Действие

  if (data.ОтображениеКнопки !== undefined) result.representation = data.ОтображениеКнопки

  if (data.ИзменяемыеДанные !== undefined) result.modifiesSavedData = data.ИзменяемыеДанные

  if (data.Таблица !== undefined) result.table = data.Таблица

  const picture = importPictureFromYAML(context, undefined, data.Картинка)
  if (picture !== undefined) result.picture = picture

  const currentRowUse = importSystemEnumerationFromYAMLDeprecated<SE.CurrentRowUse>(
    context,
    { type: "SystemEnumeration", typeSE: "CurrentRowUse" },
    data.ИспользованиеТекущейСтроки
  )
  if (currentRowUse !== undefined) result.currentRowUse = currentRowUse

  const use = importUserVisibleFromYAML({
    context,
    rule: { type: "UserVisible", yaml: UserVisibleKeysYAML.Allow, yamlDeny: UserVisibleKeysYAML.Deny },
    value: data.РазрешитьИспользование,
    yaml: data,
  })
  if (use !== undefined) result.use = use

  return result
}

export const importCommandsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: FormCommandsYAML | undefined
): FormCommands => {
  if (!data) return []

  const result: FormCommands = []

  for (const [name, commandData] of Object.entries(data)) {
    const command = importCommandFromYAML(context, name, commandData)
    if (command) {
      result.push(command)
    }
  }

  return result
}

registerTypeRule("FormCommands", "importFromYAML", importCommandsFromYAML)
