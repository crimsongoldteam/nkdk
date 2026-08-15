import { terminalOwnerYaml } from "./children"
import type { ScenarioFileChange, ScenarioOperation } from "./types"

export type OrderOperation = ScenarioOperation & {
  readonly collectionKind: "attributes" | "register-fields" | "commands" | "values"
}

type OrderSpec = {
  readonly collectionKind: OrderOperation["collectionKind"]
  readonly ownerKey: string
  readonly section: string
  readonly existingName: string
  readonly addedName: string
  readonly addedModulePath?: string
}

const specs: readonly OrderSpec[] = [
  { collectionKind: "attributes", ownerKey: "object:catalog", section: "Реквизиты", existingName: "ПроверочныйРеквизит", addedName: "ПроверочныйРеквизитДляПорядка" },
  { collectionKind: "register-fields", ownerKey: "object:information-register", section: "Измерения", existingName: "ПроверочноеИзмерение", addedName: "ПроверочноеИзмерениеДляПорядка" },
  {
    collectionKind: "commands",
    ownerKey: "object:catalog",
    section: "Команды",
    existingName: "ПроверочнаяКоманда",
    addedName: "ПроверочнаяКомандаДляПорядка",
    addedModulePath: "Справочник/ПроверкаЧастичнойСинхронизацииСправочник/Команды/ПроверочнаяКомандаДляПорядка.bsl",
  },
  { collectionKind: "values", ownerKey: "object:enumeration", section: "Значения", existingName: "ПроверочноеЗначение", addedName: "ПроверочноеЗначениеДляПорядка" },
]

const currentByOwner = new Map(specs.map(({ ownerKey }) => {
  const owner = terminalOwnerYaml(ownerKey)
  return [ownerKey, { path: owner.path, contents: owner.contents }] as const
}))

export const orderSetupOperations = specs.map((spec): ScenarioOperation => {
  const owner = requireOwner(spec.ownerKey)
  const existing = findItemBlock(owner.contents, spec.section, spec.existingName)
  const added = renameItem(existing.contents, spec.existingName, spec.addedName)
  const after = `${owner.contents.slice(0, existing.end)}${added}${owner.contents.slice(existing.end)}`
  const changes: ScenarioFileChange[] = [{ path: owner.path, before: owner.contents, after }]
  if (spec.addedModulePath !== undefined) {
    changes.push({
      path: spec.addedModulePath,
      before: null,
      after: "&НаКлиенте\nПроцедура ОбработкаКоманды(ПараметрКоманды, ПараметрыВыполненияКоманды)\nКонецПроцедуры\n",
    })
  }
  currentByOwner.set(spec.ownerKey, { path: owner.path, contents: after })
  return {
    key: `order-setup:${spec.collectionKind}`,
    kind: "add-child",
    ownerKey: spec.ownerKey,
    targetKey: spec.addedName,
    changes,
    dependsOn: [spec.ownerKey],
  }
})

export const orderOperations = specs.map((spec): OrderOperation => {
  const owner = requireOwner(spec.ownerKey)
  const first = findItemBlock(owner.contents, spec.section, spec.existingName)
  const second = findItemBlock(owner.contents, spec.section, spec.addedName)
  if (first.end !== second.start) {
    throw new Error(`Элементы проверки порядка ${spec.collectionKind} перестали быть соседними`)
  }
  const after = `${owner.contents.slice(0, first.start)}${second.contents}${first.contents}${owner.contents.slice(second.end)}`
  currentByOwner.set(spec.ownerKey, { path: owner.path, contents: after })
  return {
    key: `order:${spec.collectionKind}`,
    kind: "change",
    ownerKey: spec.ownerKey,
    targetKey: spec.addedName,
    collectionKind: spec.collectionKind,
    changes: [{ path: owner.path, before: owner.contents, after }],
    dependsOn: [`order-setup:${spec.collectionKind}`],
  }
})

function requireOwner(ownerKey: string): { readonly path: string, readonly contents: string } {
  const owner = currentByOwner.get(ownerKey)
  if (owner === undefined) throw new Error(`Не найден владелец проверки порядка ${ownerKey}`)
  return owner
}

function findItemBlock(source: string, section: string, name: string): {
  readonly start: number
  readonly end: number
  readonly contents: string
} {
  const lines = source.match(/.*(?:\n|$)/gu) ?? []
  const sectionIndex = lines.findIndex((line) => line === `${section}:\n`)
  if (sectionIndex < 0) throw new Error(`Не найдена коллекция ${section}`)
  const relativeIndex = lines.slice(sectionIndex + 1).findIndex((line) => line === `  ${name}:\n`)
  if (relativeIndex < 0) throw new Error(`Не найден элемент ${section}.${name}`)
  const itemIndex = sectionIndex + 1 + relativeIndex
  let endIndex = lines.length
  for (let index = itemIndex + 1; index < lines.length; index += 1) {
    const line = lines[index] ?? ""
    if (line.trim() === "") continue
    const indentation = line.length - line.trimStart().length
    if (indentation <= 2) {
      endIndex = index
      break
    }
  }
  const start = lines.slice(0, itemIndex).join("").length
  const contents = lines.slice(itemIndex, endIndex).join("")
  return { start, end: start + contents.length, contents }
}

function renameItem(source: string, before: string, after: string): string {
  const header = `  ${before}:\n`
  if (!source.startsWith(header)) throw new Error(`Не найден заголовок ${before}`)
  return `  ${after}:\n${source.slice(header.length)}`
}
