import type { FormDeclaration, ScenarioOperation } from "./types"
import { rootObjectDeclarations } from "./root-objects"

const formOwnerKeys = [
  "object:catalog",
  "object:document",
  "object:data-processor",
  "object:report",
  "object:document-journal",
  "object:information-register",
  "object:accumulation-register",
  "object:exchange-plan",
  "object:enumeration",
  "object:filter-criterion",
  "object:accounting-register",
  "object:settings-storage",
  "object:business-process",
  "object:calculation-register",
  "object:chart-of-accounts",
  "object:chart-of-calculation-types",
  "object:chart-of-characteristic-types",
  "object:task",
] as const

const rootsByKey = new Map(rootObjectDeclarations.map((root) => [root.key, root]))

export const formDeclarations = formOwnerKeys.map((ownerKey): FormDeclaration => {
  const root = rootsByKey.get(ownerKey)
  const propertiesPath = root?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.path
  if (propertiesPath === undefined) throw new Error(`Не найден каталог владельца формы ${ownerKey}`)
  const ownerDirectory = propertiesPath.slice(0, -"/Свойства.yaml".length)
  return {
    key: `form:${ownerKey.slice("object:".length)}`,
    ownerKey,
    changes: [{
      path: `${ownerDirectory}/Формы/ПроверочнаяФорма/Форма.yaml`,
      before: null,
      after: "Синоним: \"\"\nНазначенияИспользования: ПлатформаИМобильноеПриложение",
    }],
  }
})

export const formLifecycleKinds = [
  "create",
  "add-attribute",
  "add-command",
  "add-elements",
  "change-properties",
  "change-module",
  "remove-content",
  "remove-form-only",
  "remove-owner-with-form",
] as const

const representative = requireForm("object:catalog")
const formChange = representative.changes[0]
if (formChange === undefined || typeof formChange.after !== "string") {
  throw new Error("Не найдено начальное состояние проверочной формы")
}
const formPath = formChange.path
const formDirectory = formPath.slice(0, -"/Форма.yaml".length)
const minimalForm = formChange.after
const withAttribute = [
  minimalForm,
  "Реквизиты:",
  "  ПроверочныйРеквизитФормы:",
  "    Тип: Строка(10)",
].join("\n")
const withCommand = [
  withAttribute,
  "Команды:",
  "  ПроверочнаяКомандаФормы:",
  "    Заголовок: Проверить",
].join("\n")
const withElements = [
  withCommand,
  "Элементы:",
  "  ПроверочноеПоле:",
  "    Вид: Поле",
  "    ПутьКДанным: ПроверочныйРеквизитФормы",
  "    ВидПоля: ПолеВвода",
  "  ПроверочнаяГруппа:",
  "    Вид: Группа",
  "    Группировка: Вертикальная",
  "  ПроверочнаяТаблица:",
  "    Вид: Таблица",
].join("\n")
const withChangedProperties = withElements
  .replace("Синоним: \"\"", "Синоним: Проверочная форма")
  .replace(
    "  ПроверочноеПоле:\n    Вид: Поле\n    ПутьКДанным: ПроверочныйРеквизитФормы\n    ВидПоля: ПолеВвода\n  ПроверочнаяГруппа:\n    Вид: Группа\n    Группировка: Вертикальная\n",
    "  ПроверочнаяГруппа:\n    Вид: Группа\n    Группировка: Вертикальная\n  ПроверочноеПоле:\n    Вид: Поле\n    ПутьКДанным: ПроверочныйРеквизитФормы\n    ВидПоля: ПолеВвода\n",
  )
const initialModule = "&НаКлиенте\nПроцедура ПроверочнаяКомандаФормы(Команда)\nКонецПроцедуры\n"
const changedModule = "&НаКлиенте\nПроцедура ПроверочнаяКомандаФормы(Команда)\n\tСообщить(\"Проверка partial sync\");\nКонецПроцедуры\n"

export const formLifecycleOperations: readonly ScenarioOperation[] = [
  change("form-content:add-attribute", withAttribute, minimalForm),
  {
    ...change("form-content:add-command", withCommand, withAttribute),
    changes: [
      { path: formPath, before: withAttribute, after: withCommand },
      { path: `${formDirectory}/Модуль.bsl`, before: null, after: initialModule },
    ],
  },
  change("form-content:add-elements", withElements, withCommand),
  change("form-content:change-properties", withChangedProperties, withElements),
  {
    key: "form-content:change-module",
    kind: "change",
    ownerKey: representative.ownerKey,
    targetKey: representative.key,
    changes: [{ path: `${formDirectory}/Модуль.bsl`, before: initialModule, after: changedModule }],
    dependsOn: [representative.key],
  },
  {
    key: "form-content:remove-content",
    kind: "remove",
    ownerKey: representative.ownerKey,
    targetKey: representative.key,
    changes: [
      { path: formPath, before: withChangedProperties, after: minimalForm },
      { path: `${formDirectory}/Модуль.bsl`, before: changedModule, after: null },
    ],
    dependsOn: [representative.key],
  },
]

export const retainedFormOwnerKey = "object:task"

export const formRemovalOperations = formDeclarations
  .filter(({ ownerKey }) => ownerKey !== retainedFormOwnerKey)
  .toReversed()
  .map((declaration): ScenarioOperation => ({
    key: `remove:${declaration.key}`,
    kind: "remove",
    ownerKey: declaration.ownerKey,
    targetKey: declaration.key,
    changes: declaration.changes.map(({ path, before, after }) => ({ path, before: after, after: before })),
    dependsOn: [],
  }))

export const retainedFormDeclaration = requireForm(retainedFormOwnerKey)

function change(key: string, after: string, before: string): ScenarioOperation {
  return {
    key,
    kind: "change",
    ownerKey: representative.ownerKey,
    targetKey: representative.key,
    changes: [{ path: formPath, before, after }],
    dependsOn: [representative.key],
  }
}

function requireForm(ownerKey: string): FormDeclaration {
  const declaration = formDeclarations.find((form) => form.ownerKey === ownerKey)
  if (declaration === undefined) throw new Error(`Не найдена форма владельца ${ownerKey}`)
  return declaration
}
