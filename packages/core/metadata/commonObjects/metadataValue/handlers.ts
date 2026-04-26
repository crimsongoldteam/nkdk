import { format, parse } from "date-fns"
import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { importBooleanFromXML } from "../boolean/fromXML"
import { exportBooleanToYAML } from "../boolean/toYAML"
import { importMetadataValueStringFromYAML } from "../metadataPath/fromYAML"
import { exportMetadataValueStringToYAML } from "../metadataPath/toYAML"
import {
  MetadataBooleanValue,
  MetadataDateTimeValue,
  MetadataDecimalValue,
  MetadataObjectRefValue,
  MetadataPrimitiveValueType,
  MetadataPrimitiveValueXML,
  MetadataRefValue,
  MetadataStringValue,
  MetadataTypedValue,
  MetadataValueTypeToXML,
  MetadataValueYAML,
} from "./types"

export type MetadataPrimitiveValueHandler = {
  /** XML-текст или значение → доменный tagged объект */
  fromXML: (
    context: ConfigurationContextFromXML,
    text: string | boolean | number | undefined
  ) => MetadataTypedValue | undefined
  /** Доменный tagged объект → XML-узел */
  toXML: (value: MetadataTypedValue) => MetadataPrimitiveValueXML
  /** YAML-значение → доменный tagged объект */
  fromYAML: (context: ConfigurationContext, data: MetadataValueYAML) => MetadataTypedValue | undefined
  /** Доменный tagged объект → YAML-значение */
  toYAML: (context: ConfigurationContext, value: MetadataTypedValue) => MetadataValueYAML | undefined
}

const parseDateTime = (dateTime: string): string => {
  try {
    const date = parse(dateTime, "dd.MM.yyyy HH:mm:ss", new Date())
    if (!isNaN(date.getTime())) return format(date, "yyyy-MM-dd'T'HH:mm:ss")
    const dateOnly = parse(dateTime, "dd.MM.yyyy", new Date())
    if (!isNaN(dateOnly.getTime())) return format(dateOnly, "yyyy-MM-dd'T'00:00:00")
    return dateTime
  } catch {
    return dateTime
  }
}

const formatDateTime = (dateTime: string): string => {
  const date = new Date(dateTime)
  return format(date, "dd.MM.yyyy HH:mm:ss")
}

/**
 * Таблица хендлеров для шести примитивных типов значения × четыре направления.
 * Каждый хендлер: fromXML, toXML, fromYAML, toYAML.
 */
export const primitiveValueHandlers: Record<MetadataPrimitiveValueType, MetadataPrimitiveValueHandler> = {
  string: {
    fromXML: (_ctx, text) => {
      return { type: "string", value: text === undefined ? "" : String(text) } satisfies MetadataStringValue
    },
    toXML: (v) => ({
      "_xsi:type": MetadataValueTypeToXML.string,
      "#text": String((v as MetadataStringValue).value),
    }),
    fromYAML: (_ctx, data) => {
      if (typeof data === "string") {
        const unquoted = data.startsWith('"') && data.endsWith('"') ? data.slice(1, -1) : data
        return { type: "string", value: unquoted } satisfies MetadataStringValue
      }
      if (typeof data === "number") {
        return { type: "string", value: String(data) } satisfies MetadataStringValue
      }
      return undefined
    },
    toYAML: (_ctx, v) => `"${(v as MetadataStringValue).value}"`,
  },

  decimal: {
    fromXML: (_ctx, text) => {
      if (text === undefined) return undefined
      return { type: "decimal", value: Number(text) } satisfies MetadataDecimalValue
    },
    toXML: (v) => ({
      "_xsi:type": MetadataValueTypeToXML.decimal,
      "#text": String((v as MetadataDecimalValue).value),
    }),
    fromYAML: (_ctx, data) => {
      if (typeof data === "number") return { type: "decimal", value: data } satisfies MetadataDecimalValue
      return undefined
    },
    toYAML: (_ctx, v) => (v as MetadataDecimalValue).value,
  },

  dateTime: {
    fromXML: (_ctx, text) => {
      if (text === undefined) return undefined
      return { type: "dateTime", value: String(text) } satisfies MetadataDateTimeValue
    },
    toXML: (v) => ({
      "_xsi:type": MetadataValueTypeToXML.dateTime,
      "#text": String((v as MetadataDateTimeValue).value),
    }),
    fromYAML: (_ctx, data) => {
      if (typeof data !== "string") return undefined
      const dateTimeMatch = data.match(/^\d{2}\.\d{2}\.\d{4}(\s+\d{2}:\d{2}:\d{2})?$/)
      if (!dateTimeMatch) return undefined
      return { type: "dateTime", value: parseDateTime(data) } satisfies MetadataDateTimeValue
    },
    toYAML: (_ctx, v) => formatDateTime(String((v as MetadataDateTimeValue).value)),
  },

  boolean: {
    fromXML: (ctx, text) => {
      if (text === undefined) return undefined
      const value = typeof text === "boolean" ? text : importBooleanFromXML(ctx, undefined, text as "true" | "false")
      if (value === undefined) return undefined
      return { type: "boolean", value } satisfies MetadataBooleanValue
    },
    toXML: (v) => ({
      "_xsi:type": MetadataValueTypeToXML.boolean,
      "#text": String((v as MetadataBooleanValue).value),
    }),
    fromYAML: (_ctx, data) => {
      if (data === "Истина" || data === "Ложь") {
        return { type: "boolean", value: data === "Истина" } satisfies MetadataBooleanValue
      }
      return undefined
    },
    toYAML: (ctx, v) => exportBooleanToYAML(ctx, undefined, (v as MetadataBooleanValue).value) ?? undefined,
  },

  ref: {
    fromXML: (_ctx, text) => {
      return { type: "ref", value: text === undefined ? "" : String(text) } satisfies MetadataRefValue
    },
    toXML: (v) => ({
      "_xsi:type": MetadataValueTypeToXML.ref,
      "#text": String((v as MetadataRefValue).value),
    }),
    fromYAML: (ctx, data) => {
      if (typeof data !== "string") return undefined
      if (data === ".") return { type: "ref", value: "" } satisfies MetadataRefValue
      const converted = importMetadataValueStringFromYAML(ctx, undefined, data)
      if (!converted || !converted.includes(".")) return undefined
      return { type: "ref", value: converted } satisfies MetadataRefValue
    },
    toYAML: (ctx, v) => {
      if ((v as MetadataRefValue).value === "") return "."
      const result = exportMetadataValueStringToYAML(ctx, undefined, (v as MetadataRefValue).value)
      if (!result) throw new Error(`MetadataValue: не удалось экспортировать ref: ${(v as MetadataRefValue).value}`)
      return result
    },
  },

  objectRef: {
    fromXML: (_ctx, text) => {
      if (text === undefined) return undefined
      return { type: "objectRef", value: String(text) } satisfies MetadataObjectRefValue
    },
    toXML: (v) => ({
      "_xsi:type": MetadataValueTypeToXML.objectRef,
      "#text": String((v as MetadataObjectRefValue).value),
    }),
    fromYAML: (_ctx, _data) => undefined,
    toYAML: (_ctx, _v) => undefined,
  },

  ApplicationUsePurpose: {
    fromXML: (_ctx, text) => {
      if (text === undefined) return undefined
      return { type: "ApplicationUsePurpose", value: String(text) } as any
    },
    toXML: (v) => ({
      "_xsi:type": MetadataValueTypeToXML.ApplicationUsePurpose,
      "#text": String((v as any).value),
    }),
    fromYAML: (_ctx, _data) => undefined,
    toYAML: (_ctx, _v) => undefined,
  },

  typeRef: {
    fromXML: (_ctx: ConfigurationContextFromXML, text: string | boolean | number | undefined) => {
      return { type: "typeRef", value: text === undefined ? "" : String(text) } as unknown as MetadataTypedValue
    },
    toXML: (v: MetadataTypedValue) =>
      ({
        "_xsi:type": "v8:Type",
        "#text": String((v as unknown as { type: "typeRef"; value: string }).value),
      }) as unknown as MetadataPrimitiveValueXML,
    fromYAML: (_ctx: ConfigurationContext, _data: MetadataValueYAML) => undefined,
    toYAML: (_ctx: ConfigurationContext, v: MetadataTypedValue) =>
      String((v as unknown as { type: "typeRef"; value: string }).value),
  } satisfies MetadataPrimitiveValueHandler,

  uuid: {
    fromXML: (_ctx: ConfigurationContextFromXML, text: string | boolean | number | undefined) => {
      return { type: "uuid", value: text === undefined ? "" : String(text) } as unknown as MetadataTypedValue
    },
    toXML: (v: MetadataTypedValue) =>
      ({
        "_xsi:type": "v8:UUID",
        "#text": String((v as unknown as { type: "uuid"; value: string }).value),
      }) as unknown as MetadataPrimitiveValueXML,
    fromYAML: (_ctx: ConfigurationContext, _data: MetadataValueYAML) => undefined,
    toYAML: (_ctx: ConfigurationContext, v: MetadataTypedValue) =>
      String((v as unknown as { type: "uuid"; value: string }).value),
  } satisfies MetadataPrimitiveValueHandler,
}
