import * as React from "react"
import { render, screen, cleanup } from "@testing-library/react"
import { expect, it, describe, afterEach } from "vitest"
import { InputField } from "./inputField"

describe("InputField", () => {
  afterEach(() => {
    cleanup()
  })

  it("should render with title and value", () => {
    render(<InputField title="Test Title" value="Test Value" />)

    expect(screen.getByText("Test Title")).toBeDefined()
    expect(screen.getByDisplayValue("Test Value")).toBeDefined()
  })

  it("should render with only title", () => {
    render(<InputField title="Test Title" />)

    expect(screen.getByText("Test Title")).toBeDefined()
    expect(screen.getByRole("textbox")).toBeDefined()
  })

  it("should render with only value", () => {
    render(<InputField value="Test Value" />)

    expect(screen.getByDisplayValue("Test Value")).toBeDefined()
  })

  it("should render without props", () => {
    render(<InputField />)

    expect(screen.getByRole("textbox")).toBeDefined()
  })

  it("should render with undefined title and value", () => {
    render(<InputField title={undefined} value={undefined} />)

    expect(screen.getByRole("textbox")).toBeDefined()
  })
})
