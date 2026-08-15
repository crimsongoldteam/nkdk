import { matrixObjectNames } from "../root-objects"
import type { ScenarioFileChange, ScenarioOperation } from "../types"

export const borrowedOperationKinds = [
  "borrow-owner",
  "change-property-state",
  "change-reference",
  "add-own-attribute",
  "add-own-command",
  "extend-borrowed-form",
  "add-own-form",
  "add-own-template",
  "remove-extension-additions",
  "remove-borrowed-owner",
] as const

const catalogDirectory = `Справочник/${matrixObjectNames.catalog}`
const documentDirectory = `Документ/${matrixObjectNames.document}`
const propertiesPath = `${catalogDirectory}/Свойства.yaml`
const borrowed = "ДлинаКода: 9\n"
const changedState = "ДлинаКода: !изменять 9\n"
const changedReference = `${changedState}ВводитсяНаОсновании:\n  - Документ.${matrixObjectNames.document}\n`
const withAttribute = `${changedReference}Реквизиты:\n  РеквизитРасширения:\n    Тип: Строка(10)\n`
const withCommand = `${withAttribute}Команды:\n  КомандаРасширения:\n    Группа: ПанельДействийСервис\n`
const commandPath = `${catalogDirectory}/Команды/КомандаРасширения.bsl`
const commandModule = "&НаКлиенте\nПроцедура ОбработкаКоманды(ПараметрКоманды, ПараметрыВыполненияКоманды)\nКонецПроцедуры\n"
const borrowedFormDirectory = `${catalogDirectory}/Формы/ПроверочнаяФорма`
const borrowedBaseForm = "Синоним: Заимствованная форма\nИзменять:\n  - ФормаСиноним"
const extendedForm = [
  "Синоним: \"\"",
  "Команды:",
  "  КомандаРасширенияФормы:",
  "    Заголовок: Проверить",
  "Реквизиты:",
  "  РеквизитРасширенияФормы:",
  "    Тип: Строка(10)",
  "Элементы:",
  "  ПолеРасширения:",
  "    Вид: Поле",
  "    ПутьКДанным: РеквизитРасширенияФормы",
  "    ВидПоля: ПолеВвода",
].join("\n")
const formModule = "&НаКлиенте\nПроцедура КомандаРасширенияФормы(Команда)\nКонецПроцедуры\n"
const ownFormPath = `${catalogDirectory}/Формы/ФормаРасширения/Форма.yaml`
const ownForm = "Синоним: Форма расширения\nНазначенияИспользования: ПлатформаИМобильноеПриложение"
const templateXmlPath = `${catalogDirectory}/Макеты/МакетРасширения/Template.xml`
const templateTextPath = `${catalogDirectory}/Макеты/МакетРасширения/Template.txt`
const templateText = "\uFEFFМакет заимствованного объекта"

const catalogRemovalChanges: ScenarioFileChange[] = [
  file(ownFormPath, ownForm, null),
  file(templateTextPath, templateText, null),
  file(templateXmlPath, templateXml("МакетРасширения", "401"), null),
]
const borrowedFormChanges: ScenarioFileChange[] = [
  file(`${borrowedFormDirectory}/БазоваяФорма.yaml`, null, borrowedBaseForm),
  file(`${borrowedFormDirectory}/Форма.yaml`, null, extendedForm),
  file(`${borrowedFormDirectory}/Модуль.bsl`, null, formModule),
]

export const borrowedExtensionOperations: readonly ScenarioOperation[] = [
  operation("extension:borrowed:borrow-owner", "create-object", [file(propertiesPath, null, borrowed)]),
  operation("extension:borrowed:change-property-state", "change", [file(propertiesPath, borrowed, changedState)]),
  operation("extension:borrowed:change-reference", "change", [file(propertiesPath, changedState, changedReference)]),
  operation("extension:borrowed:add-own-attribute", "add-child", [file(propertiesPath, changedReference, withAttribute)]),
  operation("extension:borrowed:add-own-command", "add-child", [file(propertiesPath, withAttribute, withCommand), file(commandPath, null, commandModule)]),
  operation("extension:borrowed:extend-borrowed-form", "add-form", borrowedFormChanges),
  operation("extension:borrowed:add-own-form", "add-form", [file(ownFormPath, null, ownForm)]),
  operation("extension:borrowed:add-own-template", "add-child", [file(templateXmlPath, null, templateXml("МакетРасширения", "401")), file(templateTextPath, null, templateText)]),
  operation("extension:borrowed:remove-extension-additions", "remove", catalogRemovalChanges),
  operation("extension:borrowed:remove-borrowed-owner", "remove", [
    ...borrowedFormChanges.toReversed().map(({ path, after }) => file(path, after, null)),
    file(commandPath, commandModule, null),
    file(propertiesPath, withCommand, null),
  ]),
  operation("extension:borrowed:borrow-owner-with-children", "create-object", documentCreation()),
  operation("extension:borrowed:remove-owner-with-children", "remove", documentCreation().toReversed().map(({ path, after }) => file(path, after, null))),
]

function documentCreation(): ScenarioFileChange[] {
  return [
    file(`${documentDirectory}/Свойства.yaml`, null, `ДлинаНомера: !изменять 11\n`),
    file(`${documentDirectory}/Формы/ФормаРасширения/Форма.yaml`, null, ownForm),
    file(`${documentDirectory}/Макеты/МакетРасширения/Template.xml`, null, templateXml("МакетРасширения", "402")),
    file(`${documentDirectory}/Макеты/МакетРасширения/Template.txt`, null, templateText),
  ]
}

function operation(key: string, kind: ScenarioOperation["kind"], changes: readonly ScenarioFileChange[]): ScenarioOperation {
  return { key, kind, changes, dependsOn: [] }
}

function file(path: string, before: ScenarioFileChange["before"], after: ScenarioFileChange["after"]): ScenarioFileChange {
  return { path, before, after }
}

function templateXml(name: string, suffix: string): string {
  return `\uFEFF<?xml version="1.0" encoding="UTF-8"?>\n<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" version="2.20">\n\t<Template uuid="40000000-0000-4000-8000-000000000${suffix}">\n\t\t<Properties>\n\t\t\t<Name>${name}</Name>\n\t\t\t<Synonym/>\n\t\t\t<Comment/>\n\t\t\t<TemplateType>TextDocument</TemplateType>\n\t\t</Properties>\n\t</Template>\n</MetaDataObject>`
}
