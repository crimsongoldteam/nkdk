import type { MetadataReport, MetadataReportYAML } from "../types"

export const minimal: MetadataReport = {
  itemType: "MetadataReport",
  name: "ОтчетПоУмолчанию",
  synonym: { items: { ru: "Отчет по умолчанию" } },
}

export const minimalYAML: MetadataReportYAML = {
  Синоним: "Отчет по умолчанию",
}
