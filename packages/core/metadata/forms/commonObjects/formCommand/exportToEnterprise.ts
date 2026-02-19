import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/picture/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { UserVisibleKeysEnterprise } from "~/metadata/commonObjects/userVisible/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/metadataFactory"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { FormCommand, FormCommands, FormCommandsYAML, FormCommandYAML } from "./types"

export const exportCommandsToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: FormCommands | undefined
): FormCommandsYAML | undefined => {
  if (!data || data.length === 0) return undefined

  const result: FormCommandsYAML = {}

  for (const command of data) {
    const commandEnterprise = exportCommandToEnterprise(context, command)
    if (commandEnterprise) {
      result[command.name] = commandEnterprise
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}

const exportCommandToEnterprise = (
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

  const picture = exportPictureToEnterprise(context, undefined, data.picture)
  if (picture !== undefined) result.Картинка = picture

  const currentRowUse = exportSystemEnumerationToYAML<SE.CurrentRowUseEnterprise>(
    context,
    { type: "SystemEnumeration", typeSE: "CurrentRowUse" },
    data.currentRowUse
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
