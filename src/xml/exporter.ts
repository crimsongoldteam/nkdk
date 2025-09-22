import { container, singleton } from "tsyringe"
import { IFormElement, IXMLTransform } from "@/metadata/forms/interfaces"
import { XMLBuilder } from "fast-xml-parser"
import { instanceToPlain } from "class-transformer"

@singleton()
export class XMLExporter {
  public export(element: IFormElement) {
    const transform = container.resolve<IXMLTransform>(element.XMLTransformToken)
    transform.export(element)

    const result = instanceToPlain(transform, {
      strategy: "excludeAll",
      exposeUnsetFields: false,
    })

    const coveredResult = { [transform.nodeName]: result }

    const builder = new XMLBuilder({ format: true, ignoreAttributes: false })
    const xmlContent = builder.build(coveredResult)

    return xmlContent
  }
}
