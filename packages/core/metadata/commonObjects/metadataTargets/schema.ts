import { Type, type TSchema } from "@sinclair/typebox"
import { fieldKindToYAML, METADATA_NAME_PATTERN, rootToYAML } from "./roots"
import type { MetadataRootName, MetadataTargetConstraint } from "./types"

export function buildMetadataTargetSchema(constraint: MetadataTargetConstraint): TSchema {
  if (constraint.kind === "object") return objectSchema(constraint.roots)
  if (constraint.kind === "field") return fieldSchema(constraint.roots)
  if (constraint.kind === "value") return valueSchema(constraint)
  if (constraint.kind === "styleItem") {
    return Type.String({
      pattern: `^ЭлементСтиля\\.${METADATA_NAME_PATTERN}$`,
      examples: ["ЭлементСтиля.ОсновнойШрифт"],
      description: "Ссылка на элемент стиля проекта: ЭлементСтиля.<ИмяЭлементаСтиля>.",
    })
  }
  if (constraint.kind === "commonPicture") {
    return Type.String({
      pattern: `^ОбщаяКартинка\\.${METADATA_NAME_PATTERN}$`,
      examples: ["ОбщаяКартинка.Логотип"],
      description: "Ссылка на общую картинку проекта: ОбщаяКартинка.<ИмяОбщейКартинки>.",
    })
  }

  return Type.String({
    description: "Строковое metadata-значение. Подробная проверка выполняется командой validate.",
  })
}

function objectSchema(roots: readonly MetadataRootName[] | undefined): TSchema {
  const yamlRoots = yamlRootGroup(roots)
  return Type.String({
    pattern: `^((${yamlRoots})\\.${METADATA_NAME_PATTERN})$`,
    examples: ["Справочник.Контрагенты", "Документ.ЗаказПокупателя"],
    description: `Ссылка на объект метаданных: ${yamlRoots}.<ИмяОбъекта>. Реальные имена объектов берутся из YAML-проекта и проверяются validate.`,
  })
}

function fieldSchema(roots: readonly MetadataRootName[] | undefined): TSchema {
  const yamlRoots = yamlRootGroup(roots)
  const serviceSegments = Object.values(fieldKindToYAML).join("|")
  return Type.String({
    pattern: `^(${yamlRoots})\\.${METADATA_NAME_PATTERN}\\.(?:${serviceSegments})\\.${METADATA_NAME_PATTERN}(?:\\.(?:${serviceSegments})\\.${METADATA_NAME_PATTERN})*$`,
    examples: [
      "Справочник.Номенклатура.Реквизит.Артикул",
      "Справочник.Номенклатура.ТабличнаяЧасть.Товары.Реквизит.Количество",
    ],
    description:
      "Полный путь поля метаданных: служебные сегменты Реквизит, СтандартныйРеквизит, ТабличнаяЧасть, Измерение и Ресурс обязательны; реальные имена проверяются validate.",
  })
}

function valueSchema(constraint: Extract<MetadataTargetConstraint, { kind: "value" }>): TSchema {
  const yamlRoots = yamlRootGroup(constraint.roots)
  const emptyRef = constraint.allowEmptyRef === true ? "ИлиПустаяСсылка" : ""
  return Type.String({
    pattern: `^(${yamlRoots})\\.${METADATA_NAME_PATTERN}\\.${METADATA_NAME_PATTERN}$`,
    examples: ["Справочник.СтавкиНДС.БезНДС", "Справочник.СтавкиНДС.ПустаяСсылка"],
    description: `Значение ссылки: Справочник.<ИмяСправочника>.<ИмяПредопределенногоЗначения${emptyRef}> или Перечисление.<ИмяПеречисления>.<ИмяЗначения>.`,
  })
}

function yamlRootGroup(roots: readonly MetadataRootName[] | undefined): string {
  const selected = roots ?? (Object.keys(rootToYAML) as MetadataRootName[])
  return selected.map((root) => rootToYAML[root]).join("|")
}
