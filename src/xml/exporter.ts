import { container, singleton } from "tsyringe"
import { IFormElement, IXMLTransform } from "@/metadata/forms/interfaces"
import { instanceToPlain } from "class-transformer"
import { XMLBuilder } from "fast-xml-parser"

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
