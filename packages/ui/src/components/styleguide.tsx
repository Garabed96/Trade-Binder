"use client";

import * as React from "react";
import { Button } from "./button";
import { Input } from "./input";

const components = [
  { id: "button", name: "Button", keywords: ["button", "click", "action", "submit"] },
  { id: "input", name: "Input", keywords: ["input", "text", "form", "field", "search"] },
] as const;

export function Styleguide() {
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [activeSection, setActiveSection] = React.useState("button");
  const [showCode, setShowCode] = React.useState(false);
  const [mainNavVisible, setMainNavVisible] = React.useState(true);
  const lastScrollY = React.useRef(0);

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const filteredComponents = components.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase()))
  );

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };

  // Track scroll direction to know if main navbar is visible
  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY.current) {
        setMainNavVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setMainNavVisible(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track active section on scroll
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    components.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex-1">
      {/* Sticky Navigation */}
      <nav className={`sticky z-40 border-b border-slate-200 bg-background transition-all duration-300 dark:border-slate-700 ${mainNavVisible ? "top-20" : "top-0"}`}>
        <div className="container-default">
          {/* Header row */}
          <div className="flex items-center justify-between py-4">
            <h1 className="text-lg font-bold">@trade-binder/ui</h1>

            <div className="flex items-center gap-4">
              {/* Dev mode toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-slate-500 dark:text-slate-400">Show code</span>
                <button
                  role="switch"
                  aria-checked={showCode}
                  onClick={() => setShowCode(!showCode)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    showCode ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                      showCode ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </label>

              {/* Search */}
              <div className="relative w-64">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="h-10 w-full rounded-2xl border border-slate-300 bg-white pl-10 pr-8 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs row */}
          <div className="flex gap-1 -mb-px">
            {filteredComponents.map((c) => (
              <button
                key={c.id}
                onClick={() => scrollToSection(c.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === c.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container-default space-y-12 py-8">
        {/* Show message if no results */}
        {filteredComponents.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-100 p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-slate-500 dark:text-slate-400">No components found matching "{search}"</p>
            <button
              onClick={() => setSearch("")}
              className="mt-2 text-sm text-blue-400 hover:text-blue-300"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Button Section */}
        {filteredComponents.some((c) => c.id === "button") && (
          <section id="button" className="scroll-mt-32 space-y-6">
            <h2 className="border-b border-slate-200 pb-2 text-xl font-semibold dark:border-slate-800">Button</h2>

            {/* Color x Variant Matrix */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Colors &amp; Variants</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400"></th>
                      <th className="p-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400">Solid</th>
                      <th className="p-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400">Ghost</th>
                      <th className="p-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400">Outline</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 text-xs font-medium text-slate-500 dark:text-slate-400">Primary</td>
                      <td className="p-2 text-center"><Button color="primary" variant="solid">Button</Button></td>
                      <td className="p-2 text-center"><Button color="primary" variant="ghost">Button</Button></td>
                      <td className="p-2 text-center"><Button color="primary" variant="outline">Button</Button></td>
                    </tr>
                    <tr>
                      <td className="p-2 text-xs font-medium text-slate-500 dark:text-slate-400">Secondary</td>
                      <td className="p-2 text-center"><Button color="secondary" variant="solid">Button</Button></td>
                      <td className="p-2 text-center"><Button color="secondary" variant="ghost">Button</Button></td>
                      <td className="p-2 text-center"><Button color="secondary" variant="outline">Button</Button></td>
                    </tr>
                    <tr>
                      <td className="p-2 text-xs font-medium text-slate-500 dark:text-slate-400">Destructive</td>
                      <td className="p-2 text-center"><Button color="destructive" variant="solid">Button</Button></td>
                      <td className="p-2 text-center"><Button color="destructive" variant="ghost">Button</Button></td>
                      <td className="p-2 text-center"><Button color="destructive" variant="outline">Button</Button></td>
                    </tr>
                    <tr>
                      <td className="p-2 text-xs font-medium text-slate-500 dark:text-slate-400">Warning</td>
                      <td className="p-2 text-center"><Button color="warning" variant="solid">Button</Button></td>
                      <td className="p-2 text-center"><Button color="warning" variant="ghost">Button</Button></td>
                      <td className="p-2 text-center"><Button color="warning" variant="outline">Button</Button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {showCode && (
                <pre className="rounded-lg bg-slate-800 p-4 text-xs text-slate-300 dark:bg-slate-900">
{`<Button color="primary" variant="solid">Button</Button>
<Button color="primary" variant="ghost">Button</Button>
<Button color="primary" variant="outline">Button</Button>
<Button color="secondary" variant="solid">Button</Button>
<Button color="destructive" variant="solid">Button</Button>
<Button color="warning" variant="solid">Button</Button>`}
                </pre>
              )}
            </div>

            {/* Sizes */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button color="secondary" variant="ghost" size="icon-sm">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </Button>
                <Button color="secondary" variant="ghost" size="icon">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </Button>
              </div>
              {showCode && (
                <pre className="rounded-lg bg-slate-800 p-4 text-xs text-slate-300 dark:bg-slate-900">
{`<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button color="secondary" variant="ghost" size="icon-sm">...</Button>
<Button color="secondary" variant="ghost" size="icon">...</Button>`}
                </pre>
              )}
            </div>

            {/* States */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">States</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button>Default</Button>
                <Button disabled>Disabled</Button>
                <Button loading={loading} onClick={simulateLoading}>
                  {loading ? "Loading..." : "Click to Load"}
                </Button>
              </div>
              {showCode && (
                <pre className="rounded-lg bg-slate-800 p-4 text-xs text-slate-300 dark:bg-slate-900">
{`<Button>Default</Button>
<Button disabled>Disabled</Button>
<Button loading={isLoading}>Loading...</Button>`}
                </pre>
              )}
            </div>

            {/* Full Width */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Full Width</h3>
              <div className="max-w-md space-y-2">
                <Button color="primary" variant="solid" fullWidth>Full Width Primary</Button>
                <Button color="secondary" variant="solid" fullWidth>Full Width Secondary</Button>
              </div>
              {showCode && (
                <pre className="rounded-lg bg-slate-800 p-4 text-xs text-slate-300 dark:bg-slate-900">
{`<Button color="primary" variant="solid" fullWidth>Full Width Primary</Button>
<Button color="secondary" variant="solid" fullWidth>Full Width Secondary</Button>`}
                </pre>
              )}
            </div>

            {/* With Icons */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">With Icons</h3>
              <div className="flex flex-wrap gap-4">
                <Button>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Item
                </Button>
                <Button color="destructive" variant="solid">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </Button>
                <Button color="secondary" variant="solid">
                  Settings
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
              {showCode && (
                <pre className="rounded-lg bg-slate-800 p-4 text-xs text-slate-300 dark:bg-slate-900">
{`<Button color="primary" variant="solid">
  <PlusIcon />
  Add Item
</Button>
<Button color="destructive" variant="solid">
  <TrashIcon />
  Delete
</Button>`}
                </pre>
              )}
            </div>

            {/* Real World Examples */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Real World Examples</h3>

              {/* Modal Footer */}
              <div className="rounded-lg border border-slate-200 bg-slate-100 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="mb-3 text-xs text-slate-500">Modal Footer</p>
                <div className="flex gap-3">
                  <Button color="secondary" variant="solid" className="flex-1">Cancel</Button>
                  <Button color="destructive" variant="solid" className="flex-1">Delete Binder</Button>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* Input Section */}
        {filteredComponents.some((c) => c.id === "input") && (
          <section id="input" className="scroll-mt-32 space-y-6">
            <h2 className="border-b border-slate-200 pb-2 text-xl font-semibold dark:border-slate-800">Input</h2>

            {/* Variants */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Variants</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <p className="mb-2 text-xs text-slate-500">Default</p>
                  <Input placeholder="Enter your email..." />
                </div>
                <div>
                  <p className="mb-2 text-xs text-slate-500">Danger (confirmations)</p>
                  <Input variant="danger" placeholder="Type to confirm..." />
                </div>
              </div>
              {showCode && (
                <pre className="rounded-lg bg-slate-800 p-4 text-xs text-slate-300 dark:bg-slate-900">
{`<Input placeholder="Enter your email..." />
<Input variant="danger" placeholder="Type to confirm..." />`}
                </pre>
              )}
            </div>

            {/* Sizes */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Sizes</h3>
              <div className="space-y-4 max-w-md">
                <Input size="sm" placeholder="Small input" />
                <Input placeholder="Default input" />
                <Input size="lg" placeholder="Large input" />
              </div>
              {showCode && (
                <pre className="rounded-lg bg-slate-800 p-4 text-xs text-slate-300 dark:bg-slate-900">
{`<Input size="sm" placeholder="Small input" />
<Input placeholder="Default input" />
<Input size="lg" placeholder="Large input" />`}
                </pre>
              )}
            </div>

            {/* States */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">States</h3>
              <div className="space-y-4 max-w-md">
                <Input placeholder="Enabled input" />
                <Input disabled placeholder="Disabled input" />
              </div>
              {showCode && (
                <pre className="rounded-lg bg-slate-800 p-4 text-xs text-slate-300 dark:bg-slate-900">
{`<Input placeholder="Enabled input" />
<Input disabled placeholder="Disabled input" />`}
                </pre>
              )}
            </div>

            {/* Types */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Types</h3>
              <div className="space-y-4 max-w-md">
                <Input type="text" placeholder="Text input" />
                <Input type="email" placeholder="Email input" />
                <Input type="password" placeholder="Password input" />
                <Input type="number" placeholder="Number input" />
              </div>
              {showCode && (
                <pre className="rounded-lg bg-slate-800 p-4 text-xs text-slate-300 dark:bg-slate-900">
{`<Input type="text" placeholder="Text input" />
<Input type="email" placeholder="Email input" />
<Input type="password" placeholder="Password input" />
<Input type="number" placeholder="Number input" />`}
                </pre>
              )}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-slate-200 pt-6 text-center text-sm text-slate-500 dark:border-slate-800">
          <p>This page is only visible in development mode.</p>
        </footer>
      </div>
    </div>
  );
}
