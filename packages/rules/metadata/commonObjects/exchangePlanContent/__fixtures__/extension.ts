export function extensionContentXML(): Record<string, unknown> {
  const item = (Metadata: string) => ({ Metadata, AutoRecord: "Allow" })
  const state = (Metadata: string, State: "Check" | "Modify") => ({ Metadata, State })
  return {
    ExchangePlanContent: {
      Item: [
        item("Document.ДокументВсеСвойства"),
        item("Catalog.СправочникПолный"),
        item("Document.ДокументКнопкаСПараметрамиExt"),
        item("Document.ДокументСНумераторомExt"),
      ],
      ExtensionProperty: { Item: [
        state("Document.ДокументВсеСвойстваExt", "Modify"),
        state("Document.ДокументВсеСвойства", "Check"),
        state("Catalog.СправочникВладелец", "Check"),
        state("Document.ДокументСНумераторомExt", "Check"),
        state("Catalog.СправочникПолный", "Modify"),
        state("Document.ДокументСНумератором", "Check"),
        state("Document.ДокументКнопкаСПараметрамиExt", "Modify"),
      ] },
    },
  }
}

export const extensionContentYAML = [
  { Метаданные: "Документ.ДокументВсеСвойстваExt", Использовать: "Ложь" },
  { Метаданные: "Документ.ДокументВсеСвойства", Авторегистрация: "Разрешить" },
  { Метаданные: "Справочник.СправочникВладелец", Использовать: "Ложь" },
  { Метаданные: "Документ.ДокументСНумераторомExt", Авторегистрация: "Разрешить" },
  { Метаданные: "Справочник.СправочникПолный", Авторегистрация: "Разрешить" },
  { Метаданные: "Документ.ДокументСНумератором", Использовать: "Ложь" },
  { Метаданные: "Документ.ДокументКнопкаСПараметрамиExt", Авторегистрация: "Разрешить" },
]
