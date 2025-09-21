import { Expose } from "class-transformer"
import { injectable } from "tsyringe"
import { TYPES } from "../../container/symbols"
import type { IPropertiesEnterpriseTransform } from "../../interfaces"
import { IClientApplicationFormProperties } from "./interfaces"

@injectable({ token: TYPES.clientApplicationForm.propertiesEnterpriseTransform })
export class ClientApplicationFormPropertiesEnterpriseTransform
  implements IPropertiesEnterpriseTransform, IClientApplicationFormProperties
{
  @Expose({ name: "Автозаголовок" })
  public autoTitle?: boolean

  @Expose({ name: "Заголовок" })
  public title?: string

  public import(properties: IClientApplicationFormProperties) {
    for (const key in properties) {
      const value = properties[key as keyof IClientApplicationFormProperties]
      if (key === "title") continue
      ;(this as any)[key] = value
    }
  }

  public export(properties: IClientApplicationFormProperties): void {
    Object.assign(properties, this)
  }
}
