import { DynamicList, DynamicListYAML } from "~/metadata/forms/commonObjects/dynamicList/types"

export const fullDynamicList: DynamicList = {
  "@attributes": {
    "xsi:type": "DynamicList",
  },
  ManualQuery: false,
  DynamicDataRead: true,
  Parameter: [
    {
      "dcssch:name": "НачалоПериода",
      "dcssch:title": {
        "_xsi:type": "v8:LocalStringType",
        "v8:item": [
          {
            "v8:lang": "ru",
            "v8:content": "Начало периода",
          },
        ],
      },
      "dcssch:valueType": {
        "v8:Type": "xs:dateTime",
        "v8:DateQualifiers": {
          "v8:DateFractions": "DateTime",
        },
      },
      "dcssch:value": {
        "_xsi:type": "xs:dateTime",
        "#text": "0001-01-01T00:00:00",
      },
      "dcssch:useRestriction": false,
    },
    {
      "dcssch:name": "КонецПериода",
      "dcssch:title": {
        "_xsi:type": "v8:LocalStringType",
        "v8:item": [
          {
            "v8:lang": "ru",
            "v8:content": "Конец периода",
          },
        ],
      },
      "dcssch:valueType": {
        "v8:Type": "xs:dateTime",
        "v8:DateQualifiers": {
          "v8:DateFractions": "DateTime",
        },
      },
      "dcssch:value": {
        "_xsi:type": "xs:dateTime",
        "#text": "0001-01-01T00:00:00",
      },
      "dcssch:useRestriction": false,
    },
    {
      "dcssch:name": "Первые",
      "dcssch:title": {
        "_xsi:type": "v8:LocalStringType",
        "v8:item": [
          {
            "v8:lang": "ru",
            "v8:content": "Первые",
          },
        ],
      },
      "dcssch:valueType": {
        "v8:Type": "xs:decimal",
        "v8:NumberQualifiers": {
          "v8:Digits": 0,
          "v8:FractionDigits": 0,
          "v8:AllowedSign": "Any",
        },
      },
      "dcssch:value": {
        "_xsi:type": "xs:decimal",
        "#text": 0,
      },
      "dcssch:useRestriction": false,
    },
  ],
  MainTable: "AccountingRegister.Международный.RecordsWithExtDimensions",
  ListSettings: {
    "dcsset:filter": {
      "dcsset:viewMode": "Normal",
      "dcsset:userSettingID": "dfcece9d-5077-440b-b6b3-45a5cb4538eb",
    },
    "dcsset:order": {
      "dcsset:viewMode": "Normal",
      "dcsset:userSettingID": "88619765-ccb3-46c6-ac52-38e9c992ebd4",
    },
    "dcsset:conditionalAppearance": {
      "dcsset:viewMode": "Normal",
      "dcsset:userSettingID": "b75fecce-942b-4aed-abc9-e6a02e460fb3",
    },
    "dcsset:itemsViewMode": "Normal",
    "dcsset:itemsUserSettingID": "911b6018-f537-43e8-a417-da56b22f9aec",
  },
}

export const fullDynamicListYAML: DynamicListYAML = fullDynamicList

export const minimalDynamicList: DynamicList = {
  "@attributes": {
    "xsi:type": "DynamicList",
  },
}
