import { matrixObjectNames, rootObjectDeclarations } from "./root-objects"
import type { ScenarioOperation } from "./types"

export type ModuleOperation = ScenarioOperation & {
  readonly moduleKind: "command" | "common" | "form" | "object"
}

const commandPath = `Справочник/${matrixObjectNames.catalog}/Команды/ПроверочнаяКоманда.bsl`
const commandInitial = "&НаКлиенте\nПроцедура ОбработкаКоманды(ПараметрКоманды, ПараметрыВыполненияКоманды)\nКонецПроцедуры\n"
const commandChanged = commandInitial.replace("КонецПроцедуры", "\tСообщить(\"Команда изменена\");\nКонецПроцедуры")
const commonRoot = requireRoot("object:common-module")
const commonChange = commonRoot.changes.find(({ path }) => path.endsWith("/Модуль.bsl"))
if (commonChange === undefined || typeof commonChange.after !== "string") throw new Error("Не найден общий модуль")
const commonChanged = `${commonChange.after}\n// Изменение partial sync\n`
const formPath = `Справочник/${matrixObjectNames.catalog}/Формы/ПроверочнаяФорма/Модуль.bsl`
const formInitial = "&НаКлиенте\nПроцедура ПриОткрытии(Отказ)\nКонецПроцедуры\n"
const formChanged = formInitial.replace("КонецПроцедуры", "\tСообщить(\"Форма изменена\");\nКонецПроцедуры")
const objectPath = `Справочник/${matrixObjectNames.catalog}/МодульОбъекта.bsl`
const objectInitial = "Процедура ПередЗаписью(Отказ)\nКонецПроцедуры\n"
const objectChanged = objectInitial.replace("КонецПроцедуры", "\tКомментарий = \"Изменён\";\nКонецПроцедуры")

export const moduleOperations: readonly ModuleOperation[] = [
  operation("module:command:change", "command", commandPath, commandInitial, commandChanged),
  operation("module:common:change", "common", commonChange.path, commonChange.after, commonChanged),
  operation("module:form:add", "form", formPath, null, formInitial),
  operation("module:object:add", "object", objectPath, null, objectInitial),
]

export const moduleSupplementalOperations: readonly ScenarioOperation[] = [
  operation("module:command:remove", "command", commandPath, commandChanged, null),
  operation("module:command:add", "command", commandPath, null, commandInitial),
  operation("module:form:change", "form", formPath, formInitial, formChanged),
  operation("module:object:change", "object", objectPath, objectInitial, objectChanged),
]

export const moduleRestoreOperations: readonly ScenarioOperation[] = [
  operation("module:object:remove", "object", objectPath, objectChanged, null),
  operation("module:form:remove", "form", formPath, formChanged, null),
  operation("module:common:restore", "common", commonChange.path, commonChanged, commonChange.after),
]

function operation(
  key: string,
  moduleKind: ModuleOperation["moduleKind"],
  path: string,
  before: string | null,
  after: string | null,
): ModuleOperation {
  return { key, kind: after === null ? "remove" : "change", moduleKind, changes: [{ path, before, after }], dependsOn: [] }
}

function requireRoot(key: string) {
  const root = rootObjectDeclarations.find((candidate) => candidate.key === key)
  if (root === undefined) throw new Error(`Не найден корневой объект ${key}`)
  return root
}
