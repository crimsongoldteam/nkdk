import { ConfigurationContextFromXML, isEmptyXmlElement, isXmlElementNode, xmlAttributeValue, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { importBooleanFromXML } from "../boolean/fromXML"
import { isRawPictureRefValue, type Picture, type PictureXML } from "./types"

const importTransparentPixel = (
  transparentPixel: PictureXML["xr:TransparentPixel"] | XmlElementNode | undefined
): { x: number; y: number } | undefined => {
  if (!transparentPixel) return undefined

  return {
    x: Number.parseInt(String(isXmlElementNode(transparentPixel) ? xmlAttributeValue(transparentPixel, "x") : transparentPixel._x)),
    y: Number.parseInt(String(isXmlElementNode(transparentPixel) ? xmlAttributeValue(transparentPixel, "y") : transparentPixel._y)),
  }
}

export const importPictureFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: PictureXML | XmlElementNode | undefined
): Picture | undefined => {
  if (!xml) return undefined
  if (isXmlElementNode(xml) && isEmptyXmlElement(xml)) return undefined

  const refNode = isXmlElementNode(xml) ? pictureChild(xml, "xr:Ref") : undefined
  const xmlRef = isXmlElementNode(xml) ? refNode === undefined ? undefined : xmlTextValue(refNode) : xml["xr:Ref"]
  const transparent = isXmlElementNode(xml) ? pictureChild(xml, "xr:LoadTransparent") : xml["xr:LoadTransparent"]
  const pixel = isXmlElementNode(xml) ? pictureChild(xml, "xr:TransparentPixel") : xml["xr:TransparentPixel"]
  if (xmlRef && isRawPictureRefValue(xmlRef)) {
    return {
      rawRef: xmlRef,
      ...(transparent !== undefined
        ? { loadTransparent: importBooleanFromXML(context, undefined, transparent) }
        : {}),
      ...(pixel !== undefined
        ? { transparentPixel: importTransparentPixel(pixel) }
        : {}),
    }
  }

  const loadTransparent = importBooleanFromXML(context, undefined, transparent)!

  const transparentPixel = importTransparentPixel(pixel)
  const absNode = isXmlElementNode(xml) ? pictureChild(xml, "xr:Abs") : undefined
  const absolute = isXmlElementNode(xml) ? absNode === undefined ? undefined : xmlTextValue(absNode) : xml["xr:Abs"]

  if (absolute) {
    return {
      ref: absolute,
      type: "AbsolutePicture",
      loadTransparent,
      ...(transparentPixel ? { transparentPixel } : {}),
    }
  }

  const [type, ref] = xmlRef!.split(".")
  return {
    ref,
    type: type === "StdPicture" ? "StandardPicture" : "CommonPicture",
    loadTransparent,
    ...(transparentPixel ? { transparentPixel } : {}),
  }
}

function pictureChild(node: XmlElementNode, name: string): XmlElementNode | undefined {
  const child = xmlElementChildren(node, name)[0]
  return child !== undefined && isEmptyXmlElement(child) ? undefined : child
}

export const metadataPropertyRule000 = definePropertyTypeRule("Picture", "importFromXML", importPictureFromXML)
