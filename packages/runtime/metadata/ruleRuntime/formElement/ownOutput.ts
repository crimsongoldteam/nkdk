import { registerFormXmlIdReservation, type FormXmlIdSpace } from "../../configurationIndex/formXmlIdReservation"
import type { PrepareXMLItemOutputFunction, XMLItemOutputPreparation } from "../property/fromYAMLToXMLTypes"
import type { ConfigurationContextWithExportToXML } from "../../context/types"
import { resolveFormElementXMLId } from "./xmlIdentity"

const namedAttributes = ({ _name, _id, ...attributes }: Readonly<Record<string, unknown>>) => ({
  _name, _id: typeof _id === "string" ? _id : "", ...attributes,
})

export function createNamedFormItemOutputPreparation(space: FormXmlIdSpace): PrepareXMLItemOutputFunction {
  return ({ context }) => formItemPreparation(context, space, namedAttributes)
}

export const prepareFormElementOutput = formElementPreparation(false)

export function createSingletonElementOutputPreparation(directId?: string): PrepareXMLItemOutputFunction {
  return formElementPreparation(true, directId)
}

function formElementPreparation(singleton: boolean, directId?: string): PrepareXMLItemOutputFunction {
  return ({ context, name }) => {
    const indexedId = directId === undefined ? resolveFormElementXMLId(context) : undefined
    return formItemPreparation(context, "elements", ({ _name, _id, ...attributes }) => ({
      _name: singleton
        ? name ?? (typeof _name === "string" && _name.length > 0 ? _name : "")
        : typeof _name === "string" ? _name : name,
      _id: directId ?? (typeof _id === "string" && _id.length > 0 ? _id : (indexedId ?? "")),
      ...attributes,
    }), directId)
  }
}

function formItemPreparation(
  context: ConfigurationContextWithExportToXML,
  space: FormXmlIdSpace,
  attributes: XMLItemOutputPreparation["attributes"],
  specialId?: string,
): XMLItemOutputPreparation {
  return {
    attributes,
    initialize(body) {
      const runtime = specialId === undefined ? context.exportToXML.configurationIndex : undefined
      registerFormXmlIdReservation(body, {
        ...(runtime === undefined ? {} : { runtime }), space,
        ...(specialId === undefined ? {} : { specialId }),
      })
    },
  }
}
