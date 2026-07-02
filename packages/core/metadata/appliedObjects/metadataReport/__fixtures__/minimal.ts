import type { MetadataReport, MetadataReportYAML } from "../types"

export const minimal: MetadataReport = {
  itemType: "MetadataReport",
  name: "ОтчетПоУмолчанию",
  synonym: { items: { ru: "Отчет по умолчанию" } },
  comment: "",
  useStandardCommands: true,
  defaultForm: "",
  auxiliaryForm: "",
  mainDataCompositionSchema: "",
  defaultSettingsForm: "",
  auxiliarySettingsForm: "",
  defaultVariantForm: "",
  variantsStorage: "",
  settingsStorage: "",
  includeHelpInContents: false,
  extendedPresentation: { items: {} },
  explanation: { items: {} },
}

export const minimalYAML: MetadataReportYAML = {}
