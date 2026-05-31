/**
 * shims.ts
 *
 * Minimal browser-global stubs so the (otherwise pure) SceneryStack model can be
 * imported under tsx/Node for headless physics checks. This box has no
 * headless-browser system libraries, so we cannot render — we only exercise the
 * model math. Imported FIRST (before any scenerystack import) for its side effects.
 */
/* eslint-disable */
const g = globalThis as any;

/** Define a global only if it is not already present; tolerate read-only globals. */
function def(name: string, value: unknown): void {
  if (name in g) {
    return;
  }
  try {
    Object.defineProperty(g, name, { value, configurable: true, writable: true });
  } catch {
    // Some globals (e.g. navigator in Node) are read-only getters; leave them.
  }
}

function elementStub(): any {
  return {
    style: {},
    children: [],
    classList: { add() {}, remove() {}, contains: () => false },
    setAttribute() {},
    getAttribute: () => null,
    appendChild: (c: any) => c,
    removeChild: (c: any) => c,
    addEventListener() {},
    removeEventListener() {},
    getContext: () => ({
      fillRect() {},
      clearRect() {},
      measureText: () => ({ width: 0 }),
      getImageData: () => ({ data: [] }),
      canvas: {},
    }),
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }),
  };
}

def("self", g);

def("navigator", { userAgent: "node", language: "en", languages: ["en"], platform: "node" });

def("location", {
  href: "http://localhost/",
  search: "",
  hash: "",
  protocol: "http:",
  hostname: "localhost",
  pathname: "/",
  origin: "http://localhost",
});

def("document", {
  createElement: () => elementStub(),
  createElementNS: () => elementStub(),
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  addEventListener() {},
  removeEventListener() {},
  documentElement: elementStub(),
  body: elementStub(),
  head: elementStub(),
  hidden: false,
  visibilityState: "visible",
});

def("window", g);

// Window-level methods that Node's global object lacks.
if (typeof g.addEventListener !== "function") {
  g.addEventListener = () => {};
}
if (typeof g.removeEventListener !== "function") {
  g.removeEventListener = () => {};
}
if (typeof g.matchMedia !== "function") {
  g.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
}
if (typeof g.devicePixelRatio !== "number") {
  g.devicePixelRatio = 1;
}
if (typeof g.requestAnimationFrame !== "function") {
  g.requestAnimationFrame = (cb: (t: number) => void) => setTimeout(() => cb(Date.now()), 16) as unknown as number;
  g.cancelAnimationFrame = (id: number) => clearTimeout(id);
}

export {};
