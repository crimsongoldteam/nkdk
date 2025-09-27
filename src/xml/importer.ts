import { container, singleton } from "tsyringe"
import { IFormElement, IXMLImportRules } from "@/metadata/forms/interfaces"
import { XMLParser } from "fast-xml-parser"

// Символ для метаданных
const METADATA_SYMBOL = Symbol.for("metadata")

@singleton()
export class XMLImporter {
  public import<T extends IFormElement>(data: string, token: symbol): T {
    const parser = new XMLParser({
      preserveOrder: true,
      ignoreAttributes: false,
      attributeNamePrefix: "_",
    })
    const parsedData = parser.parse(data)

    let options = { ...this.defaultOptions }
    options.isArray = (name: string, _jPath: string, _isLeaf: boolean) => {
      return name === "ChildItems" || name === "Title"
    }

    const compressedData = this.compress(parsedData, options, "")

    const element = container.resolve<IXMLImportRules<T>>(token).import(compressedData)
    return element
  }

  private readonly defaultOptions = {
    preserveOrder: false,
    attributeNamePrefix: "@_",
    attributesGroupName: false,
    textNodeName: "#text",
    ignoreAttributes: true,
    removeNSPrefix: false, // remove NS from tag name or attribute name if true
    allowBooleanAttributes: false, //a tag can have attributes without any value
    //ignoreRootElement : false,
    parseTagValue: true,
    parseAttributeValue: false,
    trimValues: true, //Trim string values of tag and attributes
    cdataPropName: false,
    numberParseOptions: {
      hex: true,
      leadingZeros: true,
      eNotation: true,
    },
    tagValueProcessor: function (tagName: string, val: any) {
      return val
    },
    attributeValueProcessor: function (attrName: string, val: any) {
      return val
    },
    stopNodes: [], //nested tags will not be parsed even for errors
    alwaysCreateTextNode: false,
    isArray: (name: string, _jPath: string, _isLeaf: boolean) => false,
    commentPropName: false,
    unpairedTags: [],
    processEntities: true,
    htmlEntities: false,
    ignoreDeclaration: false,
    ignorePiTags: false,
    transformTagName: false,
    transformAttributeName: false,
    updateTag: function (tagName: string, jPath: string, attrs: any) {
      return tagName
    },
    // skipEmptyListItem: false
    captureMetaData: false,
  }

  private compress(arr: any[], options: any, jPath: string): any {
    let text: any
    let compressedObj: any
    if (options.preserveOrder) {
      compressedObj = []
    } else {
      compressedObj = {}
    }
    for (const element of arr) {
      const tagObj = element
      const property = this.propName(tagObj)
      let newJpath = ""
      if (jPath === undefined) newJpath = property || ""
      else newJpath = jPath + "." + property

      if (property === options.textNodeName && property) {
        if (text === undefined) text = tagObj[property]
        else text += "" + tagObj[property]
      } else if (property === undefined) {
        continue
      } else if (property && tagObj[property]) {
        const isArray = options.isArray(property, newJpath, false)
        let newOptions = { ...options }
        newOptions.preserveOrder = isArray
        let val = this.compress(tagObj[property], newOptions, newJpath)
        const isLeaf = this.isLeafTag(val, options)
        if (tagObj[METADATA_SYMBOL] !== undefined) {
          val[METADATA_SYMBOL] = tagObj[METADATA_SYMBOL] // copy over metadata
        }

        if (tagObj[":@"]) {
          this.assignAttributes(val, tagObj[":@"], newJpath, options)
        } else if (
          Object.keys(val).length === 1 &&
          val[options.textNodeName] !== undefined &&
          !options.alwaysCreateTextNode
        ) {
          val = val[options.textNodeName]
        } else if (Object.keys(val).length === 0) {
          if (options.alwaysCreateTextNode) val[options.textNodeName] = ""
          else val = ""
        }

        if (options.preserveOrder) {
          compressedObj.push({ [property]: val })
          continue
        }

        if (compressedObj[property] !== undefined && compressedObj.hasOwnProperty(property)) {
          if (!isArray) {
            compressedObj[property] = [compressedObj[property]]
          }
          compressedObj[property].push(val)
        } else {
          // if (options.isArray(property, newJpath, isLeaf)) {
          //   compressedObj[property] = val
          // } else {
          compressedObj[property] = val
          // }
        }
      }
    }
    if (typeof text === "string") {
      if (text.length > 0) compressedObj[options.textNodeName] = text
    } else if (text !== undefined) compressedObj[options.textNodeName] = text
    return compressedObj
  }

  private propName(obj: any): string | undefined {
    const keys = Object.keys(obj)
    for (const element of keys) {
      const key = element
      if (key !== ":@") return key
    }
    return undefined
  }

  private assignAttributes(obj: any, attrMap: any, jpath: string, options: any): void {
    if (attrMap) {
      const keys = Object.keys(attrMap)
      const len = keys.length //don't make it inline
      for (let i = 0; i < len; i++) {
        const atrrName = keys[i]
        if (options.isArray(atrrName, jpath + "." + atrrName, true, true)) {
          obj[atrrName] = [attrMap[atrrName]]
        } else {
          obj[atrrName] = attrMap[atrrName]
        }
      }
    }
  }

  private isLeafTag(obj: any, options: any): boolean {
    const { textNodeName } = options
    const propCount = Object.keys(obj).length

    if (propCount === 0) {
      return true
    }

    if (propCount === 1 && (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)) {
      return true
    }

    return false
  }
}
