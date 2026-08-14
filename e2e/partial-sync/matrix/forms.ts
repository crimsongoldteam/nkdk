import type { FormDeclaration } from "./types"
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
