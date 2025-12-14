export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">H2 Online Judge Documentation</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Learn how to use H2 Online Judge - a visual programming environment
          for controlling robots with the H2 language.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <a
            href="/guide"
            className="block p-6 rounded-lg border border-border hover:border-primary transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
            <p className="text-muted-foreground">
              Learn the basics of H2 Online Judge and write your first program.
            </p>
          </a>

          <a
            href="/language"
            className="block p-6 rounded-lg border border-border hover:border-primary transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">Language Reference</h2>
            <p className="text-muted-foreground">
              Complete reference for H2 language syntax and features.
            </p>
          </a>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Quick Example</h2>
          <pre className="p-4 rounded-lg bg-muted font-mono text-sm overflow-x-auto">
            {`# Move forward 3 times and turn right
sss r

# Define a macro
Square: s r s r s r s r
Square

# Multi-agent programming
@0: sss
@1: rrr`}
          </pre>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Features</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>- Visual execution on a 25x25 grid</li>
            <li>- Multi-agent support with parallel execution</li>
            <li>- Macros and recursive functions</li>
            <li>- Problem editor for creating puzzles</li>
            <li>- Share your solutions via URL</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
