import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { XDTOTypeName } from "./types"

type XDTOTypeNameXMLObject = {
  "#text"?: string | number
  [attribute: `_xmlns${string}`]: string | number | undefined
}

const KNOWN_PREFIX_NAMESPACES: Record<string, string> = {
  xs: "http://www.w3.org/2001/XMLSchema",
  v8: "http://v8.1c.ru/8.1/data/core",
}

const isXDTOTypeNameXMLObject = (value: unknown): value is XDTOTypeNameXMLObject => {
  return value !== null && typeof value === "object" && "#text" in value
}

const splitQName = (text: string): { prefix: string; name: string } => {
  const separatorIndex = text.indexOf(":")
  if (separatorIndex <= 0 || separatorIndex === text.length - 1) {
    throw new Error(`Invalid XDTO type QName: ${text}`)
  }

  return {
    prefix: text.slice(0, separatorIndex),
    name: text.slice(separatorIndex + 1),
  }
}

const namespaceFromXMLObject = (value: XDTOTypeNameXMLObject, prefix: string): string | undefined => {
  const namespace = value[`_xmlns:${prefix}`]
  return namespace === undefined ? undefined : namespace.toString()
}

const fromQName = (text: string, namespace: string | undefined): XDTOTypeName => {
  const { prefix, name } = splitQName(text)
  const resolvedNamespace = namespace ?? KNOWN_PREFIX_NAMESPACES[prefix]

  if (resolvedNamespace === undefined) {
    throw new Error(`Unknown XDTO type namespace prefix: ${prefix}`)
  }

  return {
    namespace: resolvedNamespace,
    name,
  }
}

export const importXDTOTypeNameFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  value: string | number | XDTOTypeNameXMLObject | undefined
): XDTOTypeName | undefined => {
  if (value === undefined) return undefined

  if (isXDTOTypeNameXMLObject(value)) {
    const text = value["#text"]?.toString()
    if (text === undefined) return undefined
    const { prefix } = splitQName(text)
    return fromQName(text, namespaceFromXMLObject(value, prefix))
  }

  if (value !== null && typeof value === "object") return undefined
  return fromQName(value.toString(), undefined)
}

registerTypeRule("XDTOTypeName", "importFromXML", importXDTOTypeNameFromXML)
