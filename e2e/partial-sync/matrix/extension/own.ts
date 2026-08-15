import type { ScenarioFileChange, ScenarioFileContents, ScenarioOperation } from "../types"

export const ownExtensionOperationKinds = [
  "create-owner", "change-owner", "add-attribute", "change-attribute",
  "add-tabular-section", "change-tabular-section", "add-command", "change-command",
  "add-form", "change-form", "add-template", "change-template", "add-module", "change-module",
  "remove-form-only", "remove-template-only", "remove-owner", "remove-owner-with-children",
] as const

const firstName = "ПроверкаЧастичнойСинхронизацииРасширениеСправочник"
const secondName = "ПроверкаЧастичнойСинхронизацииРасширениеСправочникСДетьми"
const firstDirectory = `Справочник/${firstName}`
const secondDirectory = `Справочник/${secondName}`
const baseProperties = "Комментарий: До изменения\nДлинаКода: 9\nДлинаНаименования: 25\nТипКода: Строка\n"
const objectChanged = baseProperties.replace("До изменения", "После изменения")
const withAttribute = `${objectChanged}Реквизиты:\n  ПроверочныйРеквизит:\n    Тип: Строка(10)\n`
const attributeChanged = withAttribute.replace("Тип: Строка(10)", "Тип: Строка(20)")
const withTabular = `${attributeChanged}ТабличныеЧасти:\n  ПроверочнаяТабличнаяЧасть:\n    Синоним: \"\"\n`
const tabularChanged = withTabular.replace("Синоним: \"\"", "Синоним: Проверочная табличная часть")
const withCommand = `${tabularChanged}Команды:\n  ПроверочнаяКоманда:\n    Группа: ПанельДействийСоздать\n`
const commandChanged = withCommand.replace("Группа: ПанельДействийСоздать", "Группа: ПанельДействийСервис")
const formInitial = "Синоним: \"\"\nНазначенияИспользования: ПлатформаИМобильноеПриложение"
const formChanged = formInitial.replace("Синоним: \"\"", "Синоним: Форма расширения")
const templateInitial = "\uFEFFТекст макета расширения"
const templateChanged = "\uFEFFИзменённый текст макета расширения"
const moduleInitial = "Процедура ПередЗаписью(Отказ)\nКонецПроцедуры\n"
const moduleChanged = moduleInitial.replace("КонецПроцедуры", "\tКомментарий = \"Расширение\";\nКонецПроцедуры")
const commandModule = "&НаКлиенте\nПроцедура ОбработкаКоманды(ПараметрКоманды, ПараметрыВыполненияКоманды)\nКонецПроцедуры\n"

const firstPropertiesPath = `${firstDirectory}/Свойства.yaml`
const firstFormPath = `${firstDirectory}/Формы/ПроверочнаяФорма/Форма.yaml`
const firstTemplateXmlPath = `${firstDirectory}/Шаблоны/ПроверочныйМакет/Template.xml`
const firstTemplateTextPath = `${firstDirectory}/Шаблоны/ПроверочныйМакет/Template.txt`
const firstModulePath = `${firstDirectory}/МодульОбъекта.bsl`
const firstCommandPath = `${firstDirectory}/Команды/ПроверочнаяКоманда.bsl`

export const ownExtensionOperations: readonly ScenarioOperation[] = [
  operation("extension:own:create-owner", "create-object", [file(firstPropertiesPath, null, baseProperties)]),
  operation("extension:own:change-owner", "change", [file(firstPropertiesPath, baseProperties, objectChanged)]),
  operation("extension:own:add-attribute", "add-child", [file(firstPropertiesPath, objectChanged, withAttribute)]),
  operation("extension:own:change-attribute", "change", [file(firstPropertiesPath, withAttribute, attributeChanged)]),
  operation("extension:own:add-tabular-section", "add-child", [file(firstPropertiesPath, attributeChanged, withTabular)]),
  operation("extension:own:change-tabular-section", "change", [file(firstPropertiesPath, withTabular, tabularChanged)]),
  operation("extension:own:add-command", "add-child", [file(firstPropertiesPath, tabularChanged, withCommand), file(firstCommandPath, null, commandModule)]),
  operation("extension:own:change-command", "change", [file(firstPropertiesPath, withCommand, commandChanged)]),
  operation("extension:own:add-form", "add-form", [file(firstFormPath, null, formInitial)]),
  operation("extension:own:change-form", "change", [file(firstFormPath, formInitial, formChanged)]),
  operation("extension:own:add-template", "add-child", [file(firstTemplateXmlPath, null, templateXml("ПроверочныйМакет", "301")), file(firstTemplateTextPath, null, templateInitial)]),
  operation("extension:own:change-template", "change", [file(firstTemplateTextPath, templateInitial, templateChanged)]),
  operation("extension:own:add-module", "change", [file(firstModulePath, null, moduleInitial)]),
  operation("extension:own:change-module", "change", [file(firstModulePath, moduleInitial, moduleChanged)]),
  operation("extension:own:remove-form-only", "remove", [file(firstFormPath, formChanged, null)]),
  operation("extension:own:remove-template-only", "remove", [file(firstTemplateTextPath, templateChanged, null), file(firstTemplateXmlPath, templateXml("ПроверочныйМакет", "301"), null)]),
  operation("extension:own:remove-owner", "remove", [file(firstCommandPath, commandModule, null), file(firstModulePath, moduleChanged, null), file(firstPropertiesPath, commandChanged, null)]),
  operation("extension:own:create-owner-with-children", "create-object", secondOwnerCreation()),
  operation("extension:own:remove-owner-with-children", "remove", secondOwnerCreation().toReversed().map(({ path, after }) => file(path, after, null))),
]

function secondOwnerCreation(): ScenarioFileChange[] {
  return [
    file(`${secondDirectory}/Свойства.yaml`, null, baseProperties),
    file(`${secondDirectory}/Формы/ПроверочнаяФорма/Форма.yaml`, null, formInitial),
    file(`${secondDirectory}/Шаблоны/ПроверочныйМакет/Template.xml`, null, templateXml("ПроверочныйМакет", "302")),
    file(`${secondDirectory}/Шаблоны/ПроверочныйМакет/Template.txt`, null, templateInitial),
  ]
}

function operation(key: string, kind: ScenarioOperation["kind"], changes: readonly ScenarioFileChange[]): ScenarioOperation {
  return { key, kind, changes, dependsOn: [] }
}

function file(path: string, before: ScenarioFileContents | null, after: ScenarioFileContents | null): ScenarioFileChange {
  return { path, before, after }
}

function templateXml(name: string, suffix: string): string {
  return `\uFEFF<?xml version="1.0" encoding="UTF-8"?>\n<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" version="2.20">\n\t<Template uuid="30000000-0000-4000-8000-000000000${suffix}">\n\t\t<Properties>\n\t\t\t<Name>${name}</Name>\n\t\t\t<Synonym/>\n\t\t\t<Comment/>\n\t\t\t<TemplateType>TextDocument</TemplateType>\n\t\t</Properties>\n\t</Template>\n</MetaDataObject>`
}
