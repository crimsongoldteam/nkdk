import { singleton } from "tsyringe"
import { IFormElement } from "@/metadata/forms/interfaces"
import { instanceToPlain } from "class-transformer"

@singleton()
export class EnterpriseExporter {
  public export(element: IFormElement) {
    const result = instanceToPlain(element, {
      strategy: "excludeAll",
      exposeUnsetFields: false,
    })

    return result
  }
}
