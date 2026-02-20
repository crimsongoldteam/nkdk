import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
import { exportPictureToYAML } from "~/metadata/commonObjects/picture/toYAML"
import { exportUserVisibleToYAMLDeprecated } from "~/metadata/commonObjects/userVisible/toYAML"
import { UserVisibleKeysYAML } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/metadataFactory"
import { exportSystemEnumerationToYAMLDeprecated } from "~/metadata/systemEnumerations/toYAML"
import * as SE from "~/metadata/systemEnumerations/types"
import { FormCommand, FormCommands, FormCommandsYAML, FormCommandYAML } from "./types"

export const exportCommandsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: FormCommands | undefined
): FormCommandsYAML | undefined => {
  if (!data || data.length === 0) return undefined

  const result: FormCommandsYAML = {}

  for (const command of data) {
    const commandYAML = exportCommandToYAML(context, command)
    if (commandYAML) {
      result[command.name] = commandYAML
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}

const exportCommandToYAML = (
  context: ConfigurationContext,
  data: FormCommand | undefined
): FormCommandYAML | undefined => {
  if (!data) return undefined

  const result: FormCommandYAML = {}

  const title = exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: data.title })
  if (title !== undefined) result.Заголовок = title

  const toolTip = exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: data.toolTip })
  if (toolTip !== undefined) result.Подсказка = toolTip

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  if (data.action !== undefined) result.Действие = data.action

  if (data.representation !== undefined) result.ОтображениеКнопки = data.representation

  if (data.modifiesSavedData !== undefined) result.ИзменяемыеДанные = data.modifiesSavedData

  if (data.table !== undefined) result.Таблица = data.table

  const picture = exportPictureToYAML(context, undefined, data.picture)
  if (picture !== undefined) result.Картинка = picture

  const currentRowUse = exportSystemEnumerationToYAMLDeprecated<SE.CurrentRowUseYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "CurrentRowUse" },
    data.currentRowUse
  )
  if (currentRowUse !== undefined) result.ИспользованиеТекущейСтроки = currentRowUse

  const use = exportUserVisibleToYAMLDeprecated(context, undefined, data.use, {
    allow: UserVisibleKeysYAML.Allow,
    deny: UserVisibleKeysYAML.Deny,
  })
  if (use !== undefined) {
    Object.assign(result, use)
  }

  return Object.keys(result).length > 0 ? result : undefined
}

registerTypeRule("FormCommands", "exportToYAML", exportCommandsToYAML)
