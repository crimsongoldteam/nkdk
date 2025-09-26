import { container, singleton } from "tsyringe"
import { IFormElement, IXMLImportRules } from "@/metadata/forms/interfaces"
import { XMLParser } from "fast-xml-parser"

@singleton()
export class XMLImporter {
  public import<T extends IFormElement>(data: string, token: symbol): T {
    const parser = new XMLParser()
    const parsedData = parser.parse(data)

    const element = container.resolve<IXMLImportRules<T>>(token).import(parsedData)
    return element
  }
}
