// import { container, singleton } from "tsyringe"
// import { IFormElement, IXMLTransform } from "@/metadata/forms/interfaces"
// import { XMLBuilder } from "fast-xml-parser"
// import { instanceToPlain } from "class-transformer"

import { IFormElement, IHTMLExportRules } from "@/metadata/forms/interfaces"
import { container, singleton } from "tsyringe"

@singleton()
export class HTMLExporter {
  public export(element: IFormElement) {
    const transform = container.resolve<IHTMLExportRules>(element.HTMLExportRulesToken)
    return transform.export(element)
  }
}
