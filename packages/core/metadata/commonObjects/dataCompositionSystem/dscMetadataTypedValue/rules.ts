import type { Static } from "@sinclair/typebox"
import {
  ConfigurationContext,
  ConfigurationContextFromXML,
  ConfigurationContextWithExportToXML,
} from "~/metadata/context/types"
import { importMetadataFieldStringFromYAML, importMetadataValueStringFromYAML } from "../../metadataPath/fromYAML"
import { exportMetadataFieldStringToYAML, exportMetadataValueStringToYAML } from "../../metadataPath/toYAML"
import { importMetadataValueFromXML } from "../../metadataValue/fromXML"
import { importMetadataValueFromYAML } from "../../metadataValue/fromYAML"
import { exportMetadataValueToXML } from "../../metadataValue/toXML"
import { exportMetadataValueToYAML } from "../../metadataValue/toYAML"
import { importStandartBeginningDateFromXML } from "../../standartBeginningDate/fromXML"
import { importStandartBeginningDateFromYAML } from "../../standartBeginningDate/fromYAML"
import { exportStandartBeginningDateToXML } from "../../standartBeginningDate/toXML"
import { exportStandartBeginningDateToYAML } from "../../standartBeginningDate/toYAML"
import {
  StandartBeginningDate,
  StandartBeginningDateJSONSchema,
  StandartBeginningDateXML,
} from "../../standartBeginningDate/types"
import {
  DcsMetadataTypedValue,
  DcsMetadataTypedValuePropertyRule,
  DcsMetadataTypedValueXML,
  DcsMetadataTypedValueYAML,
} from "./types"

export const DcsMetadataTypedValueRegistry: Record<DcsMetadataTypedValue["type"], DcsMetadataTypedValueRegistryItem> = {
  Order: {
    detect: ({ yaml }) => yaml === "Порядок",
    fromYAML: () => ({ type: "Order" }),
    fromXML: () => ({ type: "Order" }),
    toYAML: () => "Порядок",
    toXML: () => ({ "_xsi:type": "dcsset:Order" }),
  },
  Field: {
    detect: ({ yaml }) => isStringYAML(yaml) && yaml.startsWith("."),
    fromYAML: ({ context, yaml }) => ({
      type: "Field",
      value: isStringYAML(yaml) ? (importMetadataFieldStringFromYAML(context, undefined, yaml) ?? yaml) : "",
    }),
    fromXML: ({ xml }) => ({ type: "Field", value: xmlText(xml) }),
    toYAML: ({ context, item }) =>
      exportMetadataFieldStringToYAML(context, undefined, getFieldValue(item)) ?? getFieldValue(item),
    toXML: ({ item }) => ({
      "_xsi:type": "dcscor:Field",
      "#text": getFieldValue(item),
    }),
  },
  DesignTimeValue: {
    detect: ({ context, yaml }) =>
      isStringYAML(yaml) &&
      !yaml.startsWith(".") &&
      importMetadataValueStringFromYAML(context, undefined, yaml) !== undefined,
    fromYAML: ({ context, yaml }) => ({
      type: "DesignTimeValue",
      value: isStringYAML(yaml) ? (importMetadataValueStringFromYAML(context, undefined, yaml) ?? yaml) : "",
    }),
    fromXML: ({ xml }) => ({ type: "DesignTimeValue", value: xmlText(xml) }),
    toYAML: ({ context, item }) =>
      exportMetadataValueStringToYAML(context, undefined, getDesignTimeValue(item)) ?? getDesignTimeValue(item),
    toXML: ({ item }) => ({
      "_xsi:type": "dcscor:DesignTimeValue",
      "#text": getDesignTimeValue(item),
    }),
  },
  ref: {
    detect: ({ context, yaml }) =>
      isStringYAML(yaml) && importMetadataValueStringFromYAML(context, undefined, yaml) !== undefined,
    fromYAML: ({ context, yaml }) => importPrimitiveFromYAML(context, yaml),
    fromXML: ({ context, xml }) => importPrimitiveFromXML(context, xml, "ref"),
    toYAML: ({ context, item }) => exportPrimitiveToYAML(context, item),
    toXML: ({ context, item }) => exportPrimitiveToXML(context, item, "ref"),
  },
  decimal: {
    detect: ({ yaml }) => typeof yaml === "number",
    fromYAML: ({ context, yaml }) => importPrimitiveFromYAML(context, yaml),
    fromXML: ({ context, xml }) => importPrimitiveFromXML(context, xml, "decimal"),
    toYAML: ({ context, item }) => exportPrimitiveToYAML(context, item),
    toXML: ({ context, item }) => exportPrimitiveToXML(context, item, "decimal"),
  },
  boolean: {
    detect: ({ yaml }) => yaml === "Истина" || yaml === "Ложь",
    fromYAML: ({ context, yaml }) => importPrimitiveFromYAML(context, yaml),
    fromXML: ({ context, xml }) => importPrimitiveFromXML(context, xml, "boolean"),
    toYAML: ({ context, item }) => exportPrimitiveToYAML(context, item),
    toXML: ({ context, item }) => exportPrimitiveToXML(context, item, "boolean"),
  },
  dateTime: {
    detect: ({ yaml }) => isStringYAML(yaml) && /^\d{2}\.\d{2}\.\d{4}(\s+\d{2}:\d{2}:\d{2})?$/.test(yaml),
    fromYAML: ({ yaml }) => ({
      type: "dateTime",
      value: yamlDateTimeToXMLDateTime(String(yaml)),
    }),
    fromXML: ({ context, xml }) => importPrimitiveFromXML(context, xml, "dateTime"),
    toYAML: ({ item }) => xmlDateTimeToYAMLDateTime(getDateTimeValue(item)),
    toXML: ({ item }) => ({
      "_xsi:type": "xs:dateTime",
      "#text": getDateTimeValue(item),
    }),
  },
  string: {
    detect: ({ yaml }) => isStringYAML(yaml) && !yaml.startsWith("."),
    fromYAML: ({ context, yaml }) => importPrimitiveFromYAML(context, yaml),
    fromXML: ({ context, xml }) => {
      const text = xmlText(xml)
      if (text === "") return { type: "string", value: "" }
      return importPrimitiveFromXML(context, xml, "string")
    },
    toYAML: ({ context, item }) => exportPrimitiveToYAML(context, item),
    toXML: ({ context, item }) => exportPrimitiveToXML(context, item, "string"),
  },
  StandardBeginningDate: {
    detect: ({ yaml }) => isStandardBeginningDateYAML(yaml),
    fromYAML: ({ context, yaml }) => ({
      type: "StandardBeginningDate",
      value: importStandartBeginningDateFromYAML(
        context,
        undefined,
        isStandardBeginningDateYAML(yaml) ? yaml : undefined
      )!,
    }),
    fromXML: ({ xml }) => ({
      type: "StandardBeginningDate",
      value: importStandartBeginningDateFromXML(xml as StandartBeginningDateXML)!,
    }),
    toYAML: ({ item }) => exportStandartBeginningDateToYAML(getStandardBeginningDateValue(item))!,
    toXML: ({ item }) =>
      exportStandartBeginningDateToXML(getStandardBeginningDateValue(item)) as DcsMetadataTypedValueXML,
  },
  EmptyValueList: {
    detect: ({ yaml }) => yaml === "СписокЗначений",
    fromYAML: () => ({ type: "EmptyValueList" }),
    fromXML: ({ xml }) => {
      assertEmptyValueListXML(xml)
      return { type: "EmptyValueList" }
    },
    toYAML: () => "СписокЗначений",
    toXML: () => ({
      "_xsi:type": "v8:ValueListType",
      "v8:valueType": {},
      "v8:lastId": {
        "_xsi:type": "xs:decimal",
        "#text": "-1",
      },
    }),
  },
}

export const DcsMetadataTypedValueTypeFromXML = (valueType: string | undefined): DcsMetadataTypedValue["type"] => {
  switch (valueType) {
    case "dcscor:Field":
      return "Field"
    case "dcscor:DesignTimeValue":
      return "DesignTimeValue"
    case "xr:DesignTimeRef":
      return "ref"
    case "xs:decimal":
      return "decimal"
    case "xs:boolean":
      return "boolean"
    case "xs:dateTime":
      return "dateTime"
    case "xs:string":
      return "string"
    case "v8:StandardBeginningDate":
      return "StandardBeginningDate"
    case "v8:ValueListType":
      return "EmptyValueList"
    case "dcsset:Order":
      return "Order"
    default:
      throw new Error(`DcsMetadataTypedValue XML: unsupported _xsi:type ${String(valueType)}`)
  }
}

export type DcsMetadataTypedValueRegistryItem = {
  detect: (params: { context: ConfigurationContext; yaml: DcsMetadataTypedValueYAML }) => boolean
  fromYAML: (params: {
    context: ConfigurationContext
    rule: DcsMetadataTypedValuePropertyRule
    yaml: DcsMetadataTypedValueYAML
  }) => DcsMetadataTypedValue
  fromXML: (params: {
    context: ConfigurationContextFromXML
    rule: DcsMetadataTypedValuePropertyRule
    xml: DcsMetadataTypedValueXML
  }) => DcsMetadataTypedValue
  toYAML: (params: {
    context: ConfigurationContext
    rule: DcsMetadataTypedValuePropertyRule
    item: DcsMetadataTypedValue
  }) => DcsMetadataTypedValueYAML
  toXML: (params: {
    context: ConfigurationContextWithExportToXML
    rule: DcsMetadataTypedValuePropertyRule
    item: DcsMetadataTypedValue
  }) => DcsMetadataTypedValueXML
}

const xmlText = (xml: DcsMetadataTypedValueXML): string => {
  if ("#text" in xml) return xml["#text"] ?? ""
  return ""
}

const isEmptyRecord = (value: unknown): boolean =>
  typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 0

const isEmptyValueType = (value: unknown): boolean => value === undefined || isEmptyRecord(value)

const assertEmptyValueListXML = (xml: DcsMetadataTypedValueXML): void => {
  const raw = xml as Record<string, unknown>
  const valueType = raw["v8:valueType"]
  const lastId = raw["v8:lastId"]
  const items = raw["v8:item"]
  const availableValues = raw["v8:availableValues"]

  const lastIdText =
    typeof lastId === "object" && lastId !== null ? String((lastId as Record<string, unknown>)["#text"]) : undefined
  const lastIdType =
    typeof lastId === "object" && lastId !== null ? String((lastId as Record<string, unknown>)["_xsi:type"]) : undefined

  if (!isEmptyValueType(valueType) || lastIdText !== "-1" || lastIdType !== "xs:decimal") {
    throw new Error("DcsMetadataTypedValue XML: unsupported non-empty v8:ValueListType")
  }
  if (items !== undefined || availableValues !== undefined) {
    throw new Error("DcsMetadataTypedValue XML: unsupported non-empty v8:ValueListType")
  }
}

type PrimitiveDcsType = Extract<DcsMetadataTypedValue["type"], "decimal" | "boolean" | "dateTime" | "string" | "ref">
type MetadataValueRule = { type: "MetadataValue"; valueType: [PrimitiveDcsType] }

const isStringYAML = (yaml: DcsMetadataTypedValueYAML): yaml is string => typeof yaml === "string"
const isStandardBeginningDateYAML = (
  yaml: DcsMetadataTypedValueYAML
): yaml is Static<typeof StandartBeginningDateJSONSchema> =>
  typeof yaml === "object" && yaml !== null && !Array.isArray(yaml) && "Вариант" in yaml

const yamlDateTimeToXMLDateTime = (value: string): string => {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/)
  if (!match) throw new Error(`DcsMetadataTypedValue YAML: invalid dateTime ${value}`)
  const [, day, month, year, hour = "00", minute = "00", second = "00"] = match
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`
}

const xmlDateTimeToYAMLDateTime = (value: string): string => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/)
  if (!match) return value
  const [, year, month, day, hour, minute, second] = match
  return `${day}.${month}.${year} ${hour}:${minute}:${second}`
}

const getFieldValue = (item: DcsMetadataTypedValue): string => {
  if (item.type !== "Field") throw new Error(`Invalid DcsMetadataTypedValue type: expected Field, got ${item.type}`)
  return item.value
}

const getDesignTimeValue = (item: DcsMetadataTypedValue): string => {
  if (item.type !== "DesignTimeValue")
    throw new Error(`Invalid DcsMetadataTypedValue type: expected DesignTimeValue, got ${item.type}`)
  return item.value
}

const getStandardBeginningDateValue = (item: DcsMetadataTypedValue): StandartBeginningDate => {
  if (item.type !== "StandardBeginningDate")
    throw new Error(`Invalid DcsMetadataTypedValue type: expected StandardBeginningDate, got ${item.type}`)
  return item.value
}

const getDateTimeValue = (item: DcsMetadataTypedValue): string => {
  if (item.type !== "dateTime")
    throw new Error(`Invalid DcsMetadataTypedValue type: expected dateTime, got ${item.type}`)
  return item.value
}

const importPrimitiveFromYAML = (
  context: ConfigurationContext,
  yaml: DcsMetadataTypedValueYAML
): Extract<DcsMetadataTypedValue, { type: PrimitiveDcsType }> => {
  return importMetadataValueFromYAML(context, undefined, yaml as any) as Extract<
    DcsMetadataTypedValue,
    { type: PrimitiveDcsType }
  >
}

const importPrimitiveFromXML = (
  context: ConfigurationContextFromXML,
  xml: DcsMetadataTypedValueXML,
  type: PrimitiveDcsType
): Extract<DcsMetadataTypedValue, { type: PrimitiveDcsType }> => {
  const rule: MetadataValueRule = { type: "MetadataValue", valueType: [type] }
  return importMetadataValueFromXML({
    context,
    rule: rule as any,
    value: xml,
    type,
  }) as Extract<DcsMetadataTypedValue, { type: PrimitiveDcsType }>
}

const exportPrimitiveToYAML = (
  context: ConfigurationContext,
  item: DcsMetadataTypedValue
): DcsMetadataTypedValueYAML => {
  // Строки экспортируем как raw-значение: кавычки добавляет exportDcsMetadataTypedValueToYAML
  const typed = item as Extract<DcsMetadataTypedValue, { type: PrimitiveDcsType }>
  if (typed.type === "string") return typed.value
  return exportMetadataValueToYAML(context, undefined, item as any) as DcsMetadataTypedValueYAML
}

const exportPrimitiveToXML = (
  context: ConfigurationContextWithExportToXML,
  item: DcsMetadataTypedValue,
  type: PrimitiveDcsType
): DcsMetadataTypedValueXML => {
  const rule: MetadataValueRule = { type: "MetadataValue", valueType: [type] }
  return exportMetadataValueToXML({
    context,
    rule: rule as any,
    value: item as any,
  }) as DcsMetadataTypedValueXML
}
