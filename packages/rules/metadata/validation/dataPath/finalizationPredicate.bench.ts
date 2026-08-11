import { bench, describe } from "vitest"
import { requiresDataPathStandardMemberFormatting } from "./finalizationPredicate"
import { standardMemberNamePairs } from "./registry"


const paths = [
  "Объект.ТабличнаяЧасть.LineNumber",
  "Объект.ТабличнаяЧасть.LineNumber[0]",
  "Объект.ТабличнаяЧасть.НомерСтроки",
  "Объект.ТабличнаяЧасть.MyLineNumber",
  "Report.ТабличнаяЧастьВсеСвойства.LineNumber",
  "Объект.ТабличнаяЧасть.Количество",
  "~Объект.ТабличнаяЧасть.LineNumber",
] as const
const internalNames = new Set(
  standardMemberNamePairs()
    .filter(({ internal, yaml }) => internal !== yaml)
    .map(({ internal }) => internal)
)

describe("DataPath standard-member candidate search", () => {
  bench("cached regex", () => {
    void countMatches(requiresDataPathStandardMemberFormatting)
  })

  bench("split + Set", () => {
    void countMatches(requiresFormattingWithSplit)
  })
})

function countMatches(candidate: (value: unknown, direction: "internal-to-yaml") => boolean): number {
  let matches = 0
  for (const path of paths) {
    if (candidate(path, "internal-to-yaml")) matches += 1
  }
  return matches
}

function requiresFormattingWithSplit(value: unknown): boolean {
  if (typeof value !== "string" || value.startsWith("~") || !value.includes(".")) return false
  return value.split(".").some((segment) => internalNames.has(segment.replace(/\[.*$/, "")))
}
