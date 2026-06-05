export interface XDTOTypeName {
  namespace: string
  name: string
}

export interface XDTOTypeNameYAML {
  ПространствоИмен: string
  Имя: string
}

export type XDTOTypeNameXML = {
  "#text": string | number
  [attribute: `_xmlns${string}`]: string | number | undefined
}
