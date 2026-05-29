import { describe, expect, it } from "vitest"
import {
  consolidateGraphLabel,
  FORM_ELEMENT_LABEL,
  GRAPH_STUB_LABEL,
  METADATA_OBJECT_LABEL,
} from "./labelConsolidation"

describe("labelConsolidation", () => {
  it("maps form elements to FormElement and keeps raw kind", () => {
    expect(consolidateGraphLabel("InputField", true)).toEqual({
      label: FORM_ELEMENT_LABEL,
      kind: "InputField",
    })
    expect(consolidateGraphLabel("TableInputField", true)).toEqual({
      label: FORM_ELEMENT_LABEL,
      kind: "TableInputField",
    })
    expect(consolidateGraphLabel("AutoCommandBar", true)).toEqual({
      label: FORM_ELEMENT_LABEL,
      kind: "AutoCommandBar",
    })
    expect(consolidateGraphLabel("DendrogramField", true)).toEqual({
      label: FORM_ELEMENT_LABEL,
      kind: "DendrogramField",
    })
    expect(consolidateGraphLabel("ViewStatusAddition", true)).toEqual({
      label: FORM_ELEMENT_LABEL,
      kind: "ViewStatusAddition",
    })
  })

  it("maps top-level metadata objects to MetadataObject and keeps raw kind", () => {
    expect(consolidateGraphLabel("MetadataCatalog", true)).toEqual({
      label: METADATA_OBJECT_LABEL,
      kind: "MetadataCatalog",
    })
    expect(consolidateGraphLabel("MetadataDocument", true)).toEqual({
      label: METADATA_OBJECT_LABEL,
      kind: "MetadataDocument",
    })
    expect(consolidateGraphLabel("MetadataInformationRegister", true)).toEqual({
      label: METADATA_OBJECT_LABEL,
      kind: "MetadataInformationRegister",
    })
    expect(consolidateGraphLabel("MetadataExternalDataSource", true)).toEqual({
      label: METADATA_OBJECT_LABEL,
      kind: "MetadataExternalDataSource",
    })
    expect(consolidateGraphLabel("MetadataStyleItem", true)).toEqual({
      label: METADATA_OBJECT_LABEL,
      kind: "MetadataStyleItem",
    })
  })

  it("does not consolidate metadata child/common object labels in this pass", () => {
    expect(consolidateGraphLabel("MetadataAttribute", true)).toEqual({
      label: "MetadataAttribute",
    })
    expect(consolidateGraphLabel("MetadataTabularSection", true)).toEqual({
      label: "MetadataTabularSection",
    })
    expect(consolidateGraphLabel("MetadataRegisterResource", true)).toEqual({
      label: "MetadataRegisterResource",
    })
    expect(consolidateGraphLabel("FormAttribute", true)).toEqual({
      label: "FormAttribute",
    })
  })

  it("uses GraphStub for nodes without concrete type and file path", () => {
    expect(consolidateGraphLabel(undefined, false)).toEqual({
      label: GRAPH_STUB_LABEL,
    })
  })

  it("keeps Unknown as a diagnostic label for typed file nodes without itemType", () => {
    expect(consolidateGraphLabel(undefined, true)).toEqual({
      label: "Unknown",
    })
  })
})
