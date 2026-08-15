import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { replaceText, replaceYamlLine } from "./change-builders"
import type { ScenarioOperation } from "./types"

const path = "Конфигурация.yaml"
const initialContents = readFileSync(
  resolve(import.meta.dirname, "../../fixtures/nkdk/cf/Конфигурация.yaml"),
  "utf8",
)
const commentChange = replaceYamlLine({
  path,
  contents: initialContents,
  key: "Комментарий",
  value: "Проверка частичной синхронизации",
})
if (typeof commentChange.after !== "string") {
  throw new Error("Комментарий конфигурации должен оставаться текстовым")
}
const commandInterfaceChange = replaceText({
  path,
  contents: commentChange.after,
  before: [
    "    - Команда: Перечисление.ПеречислениеВсеСвойства.Команда.Команда1",
    "      Общее: Ложь",
  ].join("\n"),
  after: [
    "    - Команда: Перечисление.ПеречислениеВсеСвойства.Команда.Команда1",
    "      Общее: Истина",
  ].join("\n"),
})

export const configurationOperations = [
  {
    key: "configuration:comment",
    kind: "change",
    targetKey: "configuration",
    changes: [commentChange],
    dependsOn: [],
  },
  {
    key: "configuration:command-interface",
    kind: "change",
    targetKey: "configuration",
    changes: [commandInterfaceChange],
    dependsOn: ["configuration:comment"],
  },
] as const satisfies readonly ScenarioOperation[]
