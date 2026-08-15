import { rootObjectDeclarations } from "./root-objects"
import type { ScenarioOperation, TemplateDeclaration } from "./types"

export const templateLifecycleKinds = [
  "create",
  "change-text",
  "remove-template-only",
  "remove-owner-with-template",
] as const

const templateOwners = [
  { ownerKey: "object:report", name: "ПроверочныйМакет", retained: false },
  { ownerKey: "object:task", name: "ПроверочныйМакетСВладельцем", retained: true },
] as const

export const templateDeclarations = templateOwners.map(({ ownerKey, name, retained }, index): TemplateDeclaration => {
  const root = rootObjectDeclarations.find(({ key }) => key === ownerKey)
  const propertiesPath = root?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.path
  if (propertiesPath === undefined) throw new Error(`Не найден каталог владельца макета ${ownerKey}`)
  const directory = `${propertiesPath.slice(0, -"/Свойства.yaml".length)}/Макеты/${name}`
  return {
    key: `template:${ownerKey.slice("object:".length)}`,
    ownerKey,
    retainedWithOwner: retained,
    changes: [
      { path: `${directory}/Template.xml`, before: null, after: templateXml(name, index + 1) },
      { path: `${directory}/Template.txt`, before: null, after: `\uFEFFТекст макета ${name}` },
    ],
  }
})

const changedTemplate = requireTemplate("object:report")
const textChange = changedTemplate.changes.find(({ path }) => path.endsWith("/Template.txt"))
if (textChange === undefined || typeof textChange.after !== "string") {
  throw new Error("Не найден текст проверочного макета")
}

export const templateChangeOperations: readonly ScenarioOperation[] = [{
  key: "template:change-text",
  kind: "change",
  ownerKey: changedTemplate.ownerKey,
  targetKey: changedTemplate.key,
  changes: [{ path: textChange.path, before: textChange.after, after: "\uFEFFИзменённый текст проверочного макета" }],
  dependsOn: [changedTemplate.key],
}]

export const templateRemovalOperations: readonly ScenarioOperation[] = [{
  key: `remove:${changedTemplate.key}`,
  kind: "remove",
  ownerKey: changedTemplate.ownerKey,
  targetKey: changedTemplate.key,
  changes: changedTemplate.changes.toReversed().map(({ path, before, after }) => ({
    path,
    before: path.endsWith("/Template.txt") ? "\uFEFFИзменённый текст проверочного макета" : after,
    after: before,
  })),
  dependsOn: [],
}]

export const retainedTemplateDeclaration = requireRetainedTemplate()

function requireTemplate(ownerKey: string): TemplateDeclaration {
  const declaration = templateDeclarations.find((template) => template.ownerKey === ownerKey)
  if (declaration === undefined) throw new Error(`Не найден макет владельца ${ownerKey}`)
  return declaration
}

function requireRetainedTemplate(): TemplateDeclaration {
  const declaration = templateDeclarations.find(({ retainedWithOwner }) => retainedWithOwner)
  if (declaration === undefined) throw new Error("Не найден макет, удаляемый с владельцем")
  return declaration
}

function templateXml(name: string, ordinal: number): string {
  const suffix = ordinal.toString(16).padStart(12, "0")
  return `\uFEFF<?xml version="1.0" encoding="UTF-8"?>\n<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" version="2.20">\n\t<Template uuid="20000000-0000-4000-8000-${suffix}">\n\t\t<Properties>\n\t\t\t<Name>${name}</Name>\n\t\t\t<Synonym/>\n\t\t\t<Comment/>\n\t\t\t<TemplateType>TextDocument</TemplateType>\n\t\t</Properties>\n\t</Template>\n</MetaDataObject>`
}
