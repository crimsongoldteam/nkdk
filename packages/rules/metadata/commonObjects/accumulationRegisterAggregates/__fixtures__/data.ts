import { AccumulationRegisterAggregates, AccumulationRegisterAggregatesYAML } from "../types"

export const currentRegisterName = "РегистрНакопленияВсеСвойстваОбороты"

export const aggregates: AccumulationRegisterAggregates = {
  itemType: "AccumulationRegisterAggregates",
  items: [
    {
      itemType: "AccumulationRegisterAggregate",
      use: "Always",
      periodicity: "Day",
      dimensions: {
        ИзмерениеВсеСвойства: true,
        ИспользоватьХранилищеДвоичныхДанных: true,
      },
    },
    {
      itemType: "AccumulationRegisterAggregate",
      use: "Auto",
      periodicity: "Auto",
      dimensions: {
        ИзмерениеВсеСвойства: false,
        ИспользоватьХранилищеДвоичныхДанных: false,
      },
    },
  ],
}

export const aggregatesReference: AccumulationRegisterAggregates = {
  itemType: "AccumulationRegisterAggregates",
  items: [
    {
      itemType: "AccumulationRegisterAggregate",
      id: "35aa98aa-6732-4e20-8187-b6b54e2ad9ef",
      use: "Always",
      periodicity: "Day",
      dimensions: {
        ИзмерениеВсеСвойства: true,
        ИспользоватьХранилищеДвоичныхДанных: true,
      },
    },
    {
      itemType: "AccumulationRegisterAggregate",
      id: "15941cf4-dc0f-455a-a9eb-c66073c1b0d8",
      use: "Auto",
      periodicity: "Auto",
      dimensions: {
        ИзмерениеВсеСвойства: false,
        ИспользоватьХранилищеДвоичныхДанных: false,
      },
    },
  ],
}

export const aggregatesYAML: AccumulationRegisterAggregatesYAML = [
  {
    Использование: "Всегда",
    Периодичность: "День",
    Измерения: {
      ИзмерениеВсеСвойства: "Истина",
      ИспользоватьХранилищеДвоичныхДанных: "Истина",
    },
  },
  {
    Использование: "Авто",
    Периодичность: "Авто",
    Измерения: {
      ИзмерениеВсеСвойства: "Ложь",
      ИспользоватьХранилищеДвоичныхДанных: "Ложь",
    },
  },
]
