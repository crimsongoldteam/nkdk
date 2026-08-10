/** Корень DCS-фрагмента для системного перечисления: один `dcscor:value` с `xsi:type` и текстом варианта. */
export interface SystemEnumerationDcsValueRootXML {
  "dcscor:value":
    | string
    | {
        "_xsi:type": string
        "#text"?: string
      }
}
