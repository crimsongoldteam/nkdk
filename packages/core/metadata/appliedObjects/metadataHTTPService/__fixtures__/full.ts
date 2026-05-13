import { MetadataHTTPService, MetadataHTTPServiceYAML } from "../types"

export const fullFromXML: MetadataHTTPService = {
  itemType: "MetadataHTTPService",
  name: "HTTPСервисВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  rootURL: "root",
  reuseSessions: "DontUse",
  sessionMaxAge: 90,
  urlTemplates: [
    {
      itemType: "MetadataHTTPServiceURLTemplate",
      name: "ШаблонURLВсеСвойства",
      synonym: { items: { ru: "Синоним" } },
      comment: "Комментарий",
      template: "/item",
      methods: [
        {
          itemType: "MetadataHTTPServiceMethod",
          name: "МетодВсеСвойства",
          synonym: { items: { ru: "Синоним метода" } },
          comment: "Комментарий метода",
          httpMethod: "HEAD",
          handler: "ШаблонURLВсеСвойстваМетодВсеСвойства",
        },
        {
          itemType: "MetadataHTTPServiceMethod",
          name: "МетодПоУмолчанию",
          synonym: { items: { ru: "Метод по умолчанию" } },
          httpMethod: "GET",
          handler: "ШаблонURLВсеСвойстваМетодПоУмолчанию",
        },
      ],
    },
    {
      itemType: "MetadataHTTPServiceURLTemplate",
      name: "ШаблонURLПоУмолчанию",
      synonym: { items: { ru: "Шаблон URLПо умолчанию" } },
      template: "/*",
      methods: [],
    },
  ],
}

export const full: MetadataHTTPService = fullFromXML

export const fullYAML: MetadataHTTPServiceYAML = {
  Синоним: "Синоним",
  Комментарий: "Комментарий",
  КорневойURL: "root",
  ПовторноеИспользованиеСеансов: "НеИспользовать",
  ВремяЖизниСеанса: 90,
  ШаблоныURL: {
    ШаблонURLВсеСвойства: {
      Синоним: "Синоним",
      Комментарий: "Комментарий",
      Шаблон: "/item",
      Методы: {
        МетодВсеСвойства: {
          Синоним: "Синоним метода",
          Комментарий: "Комментарий метода",
          HTTPМетод: "HEAD",
          Обработчик: "ШаблонURLВсеСвойстваМетодВсеСвойства",
        },
        МетодПоУмолчанию: {
          Синоним: "Метод по умолчанию",
          HTTPМетод: "GET",
          Обработчик: "ШаблонURLВсеСвойстваМетодПоУмолчанию",
        },
      },
    },
    ШаблонURLПоУмолчанию: {
      Синоним: "Шаблон URLПо умолчанию",
      Шаблон: "/*",
    },
  },
}
