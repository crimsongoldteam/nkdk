import {
  MetadataHTTPServiceURLTemplates,
  MetadataHTTPServiceURLTemplatesYAML,
} from "~/metadata/commonObjects/metadataHTTPServiceURLTemplate/types"

export const urlTemplatesFromXML: MetadataHTTPServiceURLTemplates = [
  {
    itemType: "MetadataHTTPServiceURLTemplate",
    name: "Шаблон",
    template: "/goods/{id}",
    methods: [
      {
        itemType: "MetadataHTTPServiceMethod",
        name: "МетодHEAD",
        synonym: { items: { ru: "Метод HEAD" } },
        comment: "Комментарий метода",
        httpMethod: "HEAD",
        handler: "МетодHEAD",
      },
    ],
  },
  {
    itemType: "MetadataHTTPServiceURLTemplate",
    name: "ПустойШаблон",
    synonym: { items: { ru: "Пустой шаблон" } },
    template: "/*",
    methods: [],
  },
]

export const urlTemplatesYAML: MetadataHTTPServiceURLTemplatesYAML = {
  Шаблон: {
    Шаблон: "/goods/{id}",
    Методы: {
      МетодHEAD: {
        Синоним: "Метод HEAD",
        Комментарий: "Комментарий метода",
        HTTPМетод: "HEAD",
        Обработчик: "МетодHEAD",
      },
    },
  },
}

export const urlTemplatesFromYAML: MetadataHTTPServiceURLTemplates = [
  {
    itemType: "MetadataHTTPServiceURLTemplate",
    name: "Шаблон",
    template: "/goods/{id}",
    methods: [
      {
        itemType: "MetadataHTTPServiceMethod",
        name: "МетодHEAD",
        synonym: { items: { ru: "Метод HEAD" } },
        comment: "Комментарий метода",
        httpMethod: "HEAD",
        handler: "МетодHEAD",
      },
    ],
  },
]
