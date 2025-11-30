import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { InputField } from "./inputField"

describe("render InputField", () => {
  afterEach(() => {
    cleanup()
  })

  it("should render with title and value", () => {
    render(
      <InputField
        elementType="InputField"
        title={{ items: { ru: "Test Title" } }}
        value="Test Value"
        name="Test Name"
      />
    )

    expect(screen.getByText("Test Title:")).toBeDefined()
    expect(screen.getByRole("textbox")).toBeDefined()
  })

  it("should render with only title", () => {
    render(
      <InputField
        elementType="InputField"
        title={{ items: { ru: "Test Title" } }}
        name="Test Name"
      />
    )

    expect(screen.getByText("Test Title:")).toBeDefined()
    expect(screen.getByRole("textbox")).toBeDefined()
  })

  it("should render with only value", () => {
    render(
      <InputField
        elementType="InputField"
        title={{ items: { ru: "Test Title" } }}
        value="Test Value"
        name="Test Name"
      />
    )

    expect(screen.getByText("Test Title:")).toBeDefined()
    expect(screen.getByRole("textbox")).toBeDefined()
  })

  it("should render without props", () => {
    render(<InputField elementType="InputField" name="Test Name" />)

    expect(screen.getByRole("textbox")).toBeDefined()
  })

  it("should render with undefined title and value", () => {
    render(
      <InputField elementType="InputField" title={undefined} value={undefined} name="Test Name" />
    )

    expect(screen.getByRole("textbox")).toBeDefined()
  })
})
