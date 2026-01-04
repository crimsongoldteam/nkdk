import { ChoiceParameters, ChoiceParametersEnterprise } from "~/metadata/commonObjects/сhoiceParameters/types"

//#region Single
export const singleChoiceParameter: ChoiceParameters = [
  {
    name: "Отбор.ВАрхиве",
    value: {
      type: "boolean",
      value: false,
    },
  },
]

export const singleChoiceParametersEnterprise: ChoiceParametersEnterprise = { "Отбор.ВАрхиве": "Ложь" }

//#endregion

//#region Multiple
export const multipleChoiceParameters: ChoiceParameters = [
  {
    name: "Отбор.ВАрхиве",
    value: {
      type: "boolean",
      value: false,
    },
  },
  {
    name: "Отбор.Недействителен",
    value: {
      type: "boolean",
      value: false,
    },
  },
]

export const multipleChoiceParametersEnterprise: ChoiceParametersEnterprise = {
  "Отбор.ВАрхиве": "Ложь",
  "Отбор.Недействителен": "Ложь",
}

//#endregion

//#region Enum
export const enumChoiceParameter: ChoiceParameters = [
  {
    name: "Отбор.ТипСчета",
    value: {
      type: "ref",
      value: "Enum.ТипыСчетов.EnumValue.ВнеоборотныеАктивы",
    },
  },
]

export const enumChoiceParametersEnterprise: ChoiceParametersEnterprise = {
  "Отбор.ТипСчета": "Перечисление.ТипыСчетов.ВнеоборотныеАктивы",
}

//#endregion

//#region String
export const stringChoiceParameter: ChoiceParameters = [
  {
    name: "Дополнительно.ТипВладельца",
    value: {
      type: "string",
      value: "ЗаказПокупателя",
    },
  },
]

export const stringChoiceParametersEnterprise: ChoiceParametersEnterprise = {
  "Дополнительно.ТипВладельца": '"ЗаказПокупателя"',
}

//#endregion

//#region Nil
export const nilChoiceParameters: ChoiceParameters = [
  {
    name: "ВыборСчетовГоловнойОрганизации",
  },
]

export const nilChoiceParametersEnterprise: ChoiceParametersEnterprise = { ВыборСчетовГоловнойОрганизации: undefined }

//#endregion

//#region FixedArray
export const fixedArrayChoiceParameter: ChoiceParameters = [
  {
    name: "Отбор.ТипСтруктурнойЕдиницы",
    value: {
      type: "fixedArray",
      value: [
        {
          type: "ref",
          value: "Enum.ТипыСтруктурныхЕдиниц.EnumValue.Склад",
        },
        {
          type: "ref",
          value: "Enum.ТипыСтруктурныхЕдиниц.EnumValue.Розница",
        },
        {
          type: "ref",
          value: "Enum.ТипыСтруктурныхЕдиниц.EnumValue.РозницаСуммовойУчет",
        },
      ],
    },
  },
]

export const fixedArrayChoiceParametersEnterprise: ChoiceParametersEnterprise = {
  "Отбор.ТипСтруктурнойЕдиницы": [
    "Перечисление.ТипыСтруктурныхЕдиниц.Склад",
    "Перечисление.ТипыСтруктурныхЕдиниц.Розница",
    "Перечисление.ТипыСтруктурныхЕдиниц.РозницаСуммовойУчет",
  ],
}
//#endregion

//#region FormBoolean
export const formBooleanChoiceParameter: ChoiceParameters = [
  {
    name: "БезПроизводныхЗначений",
    value: {
      type: "formChoiceListDesTimeValue",
      value: {
        type: "boolean",
        value: true,
      },
    },
  },
]

export const formBooleanChoiceParametersEnterprise: ChoiceParametersEnterprise = { БезПроизводныхЗначений: "Истина" }
//#endregion

//#region FormEnum
export const formEnumChoiceParameter: ChoiceParameters = [
  {
    name: "Отбор.ТипСчета",
    value: {
      type: "formChoiceListDesTimeValue",
      value: {
        type: "ref",
        value: "Enum.ТипыСчетов.EnumValue.НераспределеннаяПрибыль",
      },
    },
  },
]

export const formEnumChoiceParametersEnterprise: ChoiceParametersEnterprise = {
  "Отбор.ТипСчета": "Перечисление.ТипыСчетов.НераспределеннаяПрибыль",
}
//#endregion

//#region Without Value
export const withoutValueChoiceParameter: ChoiceParameters = [
  {
    name: "ВыборСчетовГоловнойОрганизации",
  },
]

export const withoutValueChoiceParametersEnterprise: ChoiceParametersEnterprise = {
  ВыборСчетовГоловнойОрганизации: undefined,
}

//#endregion

//#region Without One Value
export const withoutOneValueChoiceParameter: ChoiceParameters = [
  {
    name: "ВыборСчетовГоловнойОрганизации",
  },
  {
    name: "Отбор.Закрыт",
    value: {
      type: "boolean",
      value: false,
    },
  },
]

export const withoutOneValueChoiceParametersEnterprise: ChoiceParametersEnterprise = {
  ВыборСчетовГоловнойОрганизации: undefined,
  "Отбор.Закрыт": "Ложь",
}

//#endregion
