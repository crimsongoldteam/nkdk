import { ContainerFactory } from "@/metadata/forms/elements"
import { beforeEach, it } from "node:test"
import { container } from "tsyringe"
import { HTMLImporter } from "@/html/importer"

const mockHtml = `<div class="modal">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Modal title</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
      </div>
      <div class="modal-footer">
      </div>
    </div>
  </div>
</div>`

beforeEach(() => {
  new ContainerFactory().register()
})

it("should import from HTML", () => {
  const form = container.resolve(HTMLImporter).import(mockHtml)
})
