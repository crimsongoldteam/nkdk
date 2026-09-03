import type { XmlAnomalyAnnotationTable } from "../../../yaml/xmlAnomalyAnnotations"
import {
  createLocalXmlRawAppender,
  projectLocalXmlOrder,
  projectLocalXmlOwnValues,
} from "../xmlAnomaly/yamlProjection"
import { encodeXmlRawElement } from "../../../xml/structure/rawCodec"
import { annotateXmlRawValue } from "../xmlAnomaly/yamlProjection"
import {
  projectLocalXmlPropertyDifferences,
  projectLocalXmlScalarDifference,
} from "../xmlAnomaly/localPropertyBoundary"
import { createLocalXmlBodyConsumer } from "./localXmlBodyConsumer"

type BodyConsumerParams = Parameters<typeof createLocalXmlBodyConsumer>[0]

/** Локальный proof с записью существующих raw-аннотаций прямо в итоговый YAML. */
export function createAnnotatedLocalXmlBodyConsumer(params: Omit<
  BodyConsumerParams,
  "annotate" | "annotateScalar"
> & {
  readonly yaml: Record<string, unknown>
  readonly annotations: XmlAnomalyAnnotationTable
}) {
  const appendRaw = createLocalXmlRawAppender({ yaml: params.yaml, annotations: params.annotations })
  return createLocalXmlBodyConsumer({
    ...params,
    annotate({ source, differences, property }) {
      if (property !== undefined) {
        const key = property.yamlKey
        const expectedName = property.xmlPath.at(-1)
        if (key === undefined || expectedName === undefined) {
          throw new Error(`Для XML-свойства ${property.propertyKey} не подготовлена YAML-граница`)
        }
        projectLocalXmlPropertyDifferences({
          parent: params.yaml, key, annotations: params.annotations,
          source, expectedName, differences,
          hasSemanticValue: Object.prototype.hasOwnProperty.call(params.yaml, key),
          orderPath: property.xmlPath,
        })
        return
      }
      const children = new Map(source.content.flatMap((node) =>
        node.type === "element" ? [[node.path, node] as const] : [],
      ))
      const own = differences.filter((difference) => {
        if (difference.kind === "order") return false
        if (difference.ownerPath !== source.path || !difference.path.startsWith(`${source.path}/`)) return true
        const relative = difference.path.slice(source.path.length + 1)
        if (relative.startsWith("@") || relative.startsWith("#text[")) return true
        const child = /^([^/#?]+)\[(\d+)\]$/u.exec(relative)
        if (difference.kind !== "presence" || child === null) return true
        const sourceChild = children.get(difference.path)
        if (sourceChild === undefined) {
          throw new Error(`Не подготовлена YAML-граница лишнего XML-ребёнка ${difference.path}`)
        }
        appendRaw(child[1]!, encodeXmlRawElement(sourceChild))
        return false
      })
      projectLocalXmlOwnValues({
        yaml: params.yaml, annotations: params.annotations, root: source, differences: own,
      })
      projectLocalXmlOrder({
        yaml: params.yaml, annotations: params.annotations, root: source, differences,
      })
    },
    annotateScalar({ source, owner, difference, property }) {
      if (owner === undefined) {
        throw new Error(`Для XML-скаляра ${source.path} не передан непосредственный владелец`)
      }
      projectLocalXmlScalarDifference({
        yaml: params.yaml, annotations: params.annotations, owner, source, difference,
        path: property.xmlPath.slice(0, -1),
      })
    },
    annotateAbsent({ property }) {
      const key = property.yamlKey
      if (key === undefined) throw new Error(`Для XML-свойства ${property.propertyKey} не подготовлена YAML-граница`)
      annotateXmlRawValue({
        parent: params.yaml, key, annotations: params.annotations, xml: null,
        hasSemanticValue: Object.prototype.hasOwnProperty.call(params.yaml, key),
      })
    },
  })
}
