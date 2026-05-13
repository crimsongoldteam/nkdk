import type { StructuralKind } from "./types"

export interface ParsedMigrationPath {
  kind: StructuralKind
  segments: string[]
  localName: string
  ownerPath: string
  levelPath: string
}

const TOP_LEVEL_PREFIXES = new Set([
  "Справочник",
  "Документ",
  "Нумератор",
  "Последовательность",
  "ОпределяемыйТип",
  "ПараметрСеанса",
  "ПодпискаНаСобытие",
  "КритерийОтбора",
  "ПараметрФункциональныхОпций",
  "ХранилищеНастроек",
  "ЭлементСтиля",
  "ОбщийРеквизит",
  "Бот",
  "WSСсылка",
])
const OBJECT_WITH_CHILDREN_PREFIXES = new Set(["Справочник", "Документ"])

export function parseMigrationPath(path: string): ParsedMigrationPath {
  const segments = path.split(".")
  if (segments.some((segment) => segment.length === 0)) throwUnsupportedPath(path)

  if (segments.length === 2 && TOP_LEVEL_PREFIXES.has(segments[0]!)) {
    return {
      kind: "object",
      segments,
      localName: segments[1]!,
      ownerPath: segments[0]!,
      levelPath: segments[0]!,
    }
  }

  if (segments.length === 4 && OBJECT_WITH_CHILDREN_PREFIXES.has(segments[0]!) && segments[2] === "Реквизит") {
    return {
      kind: "attribute",
      segments,
      localName: segments[3]!,
      ownerPath: `${segments[0]}.${segments[1]}`,
      levelPath: `${segments[0]}.${segments[1]}.Реквизит`,
    }
  }

  if (segments.length === 4 && OBJECT_WITH_CHILDREN_PREFIXES.has(segments[0]!) && segments[2] === "ТабличнаяЧасть") {
    return {
      kind: "tabularSection",
      segments,
      localName: segments[3]!,
      ownerPath: `${segments[0]}.${segments[1]}`,
      levelPath: `${segments[0]}.${segments[1]}.ТабличнаяЧасть`,
    }
  }

  if (
    segments.length === 6 &&
    OBJECT_WITH_CHILDREN_PREFIXES.has(segments[0]!) &&
    segments[2] === "ТабличнаяЧасть" &&
    segments[4] === "Реквизит"
  ) {
    return {
      kind: "attribute",
      segments,
      localName: segments[5]!,
      ownerPath: `${segments[0]}.${segments[1]}.ТабличнаяЧасть.${segments[3]}`,
      levelPath: `${segments[0]}.${segments[1]}.ТабличнаяЧасть.${segments[3]}.Реквизит`,
    }
  }

  if (segments.length === 4 && segments[0] === "Последовательность" && segments[2] === "Измерение") {
    return {
      kind: "dimension",
      segments,
      localName: segments[3]!,
      ownerPath: `${segments[0]}.${segments[1]}`,
      levelPath: `${segments[0]}.${segments[1]}.Измерение`,
    }
  }

  throwUnsupportedPath(path)
}

export function buildRenameTargetPath(path: string, newLocalName: string): string {
  if (newLocalName.length === 0) throw new Error("Новое имя не должно быть пустым")
  if (newLocalName.includes(".")) throw new Error("Новое имя не должно содержать точку")
  const parsed = parseMigrationPath(path)
  if (parsed.localName === newLocalName) throw new Error("Переименование в то же имя запрещено")
  return [...parsed.segments.slice(0, -1), newLocalName].join(".")
}

function throwUnsupportedPath(path: string): never {
  throw new Error(`Неподдерживаемый путь миграции "${path}"`)
}
