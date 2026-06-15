import type { MetadataReport, MetadataReportYAML } from "../types"

export const full: MetadataReport = {
  itemType: "MetadataReport",
  name: "ОтчетВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  useStandardCommands: false,
  defaultForm: "Report.ОтчетВсеСвойства.Form.ФормаОтчета",
  auxiliaryForm: "",
  mainDataCompositionSchema: "Report.ОтчетВсеСвойства.Template.ОсновнаяСхемаКомпоновкиДанных",
  defaultSettingsForm: "Report.ОтчетВсеСвойства.Form.ФормаНастроек",
  auxiliarySettingsForm: "",
  defaultVariantForm: "Report.ОтчетВсеСвойства.Form.ФормаВарианта",
  variantsStorage: "SettingsStorage.ХранилищеНастроекВсеСвойства",
  settingsStorage: "SettingsStorage.ХранилищеНастроекВсеСвойства",
  includeHelpInContents: true,
  extendedPresentation: { items: { ru: "Расширенное представление" } },
  explanation: { items: { ru: "Пояснение\n" } },
}

export const fullYAML: MetadataReportYAML = {
  Синоним: "Синоним",
  Комментарий: "Комментарий",
  ИспользоватьСтандартныеКоманды: "Ложь",
  ОсновнаяФорма: "ФормаОтчета",
  ОсновнаяСхемаКомпоновкиДанных: "ОсновнаяСхемаКомпоновкиДанных",
  ОсновнаяФормаНастроекОтчета: "ФормаНастроек",
  ОсновнаяФормаВариантаОтчета: "ФормаВарианта",
  ХранилищеВариантовОтчетов: "SettingsStorage.ХранилищеНастроекВсеСвойства",
  ХранилищеПользовательскихНастроекОтчетов: "SettingsStorage.ХранилищеНастроекВсеСвойства",
  ВключатьСправкуВСодержание: "Истина",
  РасширенноеПредставление: "Расширенное представление",
  Пояснение: "Пояснение\n",
}
