import { MetadataHTTPServiceMethods, MetadataHTTPServiceMethodsYAML } from "../types"

export const methodsFromXML: MetadataHTTPServiceMethods = [
  {
    itemType: "MetadataHTTPServiceMethod",
    name: "МетодGET",
    httpMethod: "GET",
    handler: "МетодGET",
  },
  {
    itemType: "MetadataHTTPServiceMethod",
    name: "МетодHEAD",
    synonym: { items: { ru: "Метод HEAD" } },
    comment: "Комментарий метода",
    httpMethod: "HEAD",
    handler: "МетодHEAD",
  },
]

export const methodsYAML: MetadataHTTPServiceMethodsYAML = {
  МетодGET: {
    HTTPМетод: "GET",
    Обработчик: "МетодGET",
  },
  МетодHEAD: {
    Комментарий: "Комментарий метода",
    HTTPМетод: "HEAD",
    Обработчик: "МетодHEAD",
  },
}

export const methodsFromYAML: MetadataHTTPServiceMethods = [
  {
    itemType: "MetadataHTTPServiceMethod",
    name: "МетодGET",
    httpMethod: "GET",
    handler: "МетодGET",
  },
  {
    itemType: "MetadataHTTPServiceMethod",
    name: "МетодHEAD",
    comment: "Комментарий метода",
    httpMethod: "HEAD",
    handler: "МетодHEAD",
  },
]
