// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest"
import { command } from "../src/components/command/command"
import { dialog } from "../src/components/dialog/dialog"
import { drawer } from "../src/components/drawer/drawer"
import { popover } from "../src/components/popover/popover"
import { mount } from "../src/testing"

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as never

afterEach(() => {
  vi.restoreAllMocks()
  document.body.replaceChildren()
})

const nests = (warn: { mock: { calls: unknown[][] } }) =>
  warn.mock.calls.some((call) => String(call[0]).includes("nests forms"))

test("Enter in a command search with nothing highlighted submits no form", async () => {
  const view = mount(
    command,
    {},
    `<form><input aria-label="Search" /><list><item value="name">Name</item></list></form>`
  )
  const search = view.part("input") as HTMLInputElement
  search.focus()
  search.value = "zzz"
  search.dispatchEvent(new Event("input", { bubbles: true }))
  await new Promise((resolve) => setTimeout(resolve, 20))
  expect(view.root.querySelector("[data-highlighted]")).toBe(null)
  const enter = new KeyboardEvent("keydown", {
    key: "Enter",
    bubbles: true,
    cancelable: true,
  })
  search.dispatchEvent(enter)
  expect(enter.defaultPrevented).toBe(true)
  view.unmount()
})

test.each([
  ["popover", popover],
  ["dialog", dialog],
  ["drawer", drawer],
])("a %s rendered inside a form", (_, primitive) => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  const withForm = mount(
    primitive,
    { defaultOpen: true },
    `<form><trigger>Open</trigger><content><title>Title</title><form><input /></form></content></form>`
  )
  expect(nests(warn)).toBe(true)
  withForm.unmount()
  warn.mockClear()

  const withFields = mount(
    primitive,
    { defaultOpen: true },
    `<form><trigger>Open</trigger><content><title>Title</title><input /></content></form>`
  )
  expect(nests(warn)).toBe(false)
  withFields.unmount()
})
