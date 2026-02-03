import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportI8nTextToEnterprise } from "../../commonObjects/i8nText/exportToEnterprise"
import { exportPictureToEnterprise } from "../../commonObjects/picture/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "../../commonObjects/userVisible/exportToEnterprise"
import { UserVisibleKeysEnterprise } from "../../commonObjects/userVisible/types"
import { ConfigurationContext } from "../../context/types"
import { exportSystemEnumerationToYAML } from "../../systemEnumerations/exportToEnterprise"
import * as SE from "../../systemEnumerations/types"
import { Command, CommandEnterprise, Commands, CommandsEnterprise } from "./types"

const exportCommandToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: Command | undefined
): CommandEnterprise | undefined => {
  if (!data) return undefined

  const result: CommandEnterprise = {}

  const title = exportI8nTextToEnterprise(context, undefined, data.title)
  if (title !== undefined) result.Заголовок = title

  const toolTip = exportI8nTextToEnterprise(context, undefined, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  if (data.shortcut !== undefined) result.СочетаниеКлавиш = data.shortcut

  if (data.action !== undefined) result.Действие = data.action

  if (data.representation !== undefined) result.ОтображениеКнопки = data.representation

  if (data.modifiesSavedData !== undefined) result.ИзменяемыеДанные = data.modifiesSavedData

  if (data.table !== undefined) result.Таблица = data.table

  const picture = exportPictureToEnterprise(context, undefined, data.picture)
  if (picture !== undefined) result.Картинка = picture

  const currentRowUse = exportSystemEnumerationToYAML(
    context,
    undefined,
    undefined,
    data.currentRowUse,
    SE.CurrentRowUseToEnterprise
  )
  if (currentRowUse !== undefined) result.ИспользованиеТекущейСтроки = currentRowUse

  const use = exportUserVisibleToEnterprise(context, undefined, data.use, {
    allow: UserVisibleKeysEnterprise.Allow,
    deny: UserVisibleKeysEnterprise.Deny,
  })
  if (use !== undefined) {
    Object.assign(result, use)
  }

  return Object.keys(result).length > 0 ? result : undefined
}

export const exportCommandsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: Commands | undefined
): CommandsEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  const result: CommandsEnterprise = {}

  for (const command of data) {
    const commandEnterprise = exportCommandToEnterprise(context, undefined, command)
    if (commandEnterprise) {
      result[command.name] = commandEnterprise
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}
