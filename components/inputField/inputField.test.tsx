import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { InputFieldComponent } from "./inputField"

describe("render InputField", () => {
  afterEach(() => {
    cleanup()
  })

  it("should render with title", () => {
    render(
      <InputFieldComponent
        elementType={FormElementType.InputField}
        title={{ items: { ru: "Test Title" } }}
        name="Test Name"
      />
    )

    expect(screen.getByText("Test Title:")).toBeDefined()
    expect(screen.getByRole("textbox")).toBeDefined()
  })

  it("should render with only title", () => {
    render(
      <InputFieldComponent
        elementType={FormElementType.InputField}
        title={{ items: { ru: "Test Title" } }}
        name="Test Name"
      />
    )

    expect(screen.getByText("Test Title:")).toBeDefined()
    expect(screen.getByRole("textbox")).toBeDefined()
  })

  it("should render with title only", () => {
    render(
      <InputFieldComponent
        elementType={FormElementType.InputField}
        title={{ items: { ru: "Test Title" } }}
        name="Test Name"
      />
    )

    expect(screen.getByText("Test Title:")).toBeDefined()
    expect(screen.getByRole("textbox")).toBeDefined()
  })

  it("should render without props", () => {
    render(<InputFieldComponent elementType={FormElementType.InputField} name="Test Name" />)

    expect(screen.getByRole("textbox")).toBeDefined()
  })

  it("should render with undefined title", () => {
    render(<InputFieldComponent elementType={FormElementType.InputField} title={undefined} name="Test Name" />)

    expect(screen.getByRole("textbox")).toBeDefined()
  })
})
