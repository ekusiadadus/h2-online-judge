export default function LanguagePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Language Reference</h1>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Basic Commands</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4">Command</th>
                <th className="text-left py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 font-mono">s</td>
                <td className="py-2 text-muted-foreground">
                  Move straight (forward) one step
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 font-mono">r</td>
                <td className="py-2 text-muted-foreground">
                  Rotate right 90 degrees
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 font-mono">l</td>
                <td className="py-2 text-muted-foreground">
                  Rotate left 90 degrees
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Repetition</h2>
          <p className="text-muted-foreground mb-4">
            Chain commands together for repetition:
          </p>
          <pre className="p-4 rounded-lg bg-muted font-mono text-sm">
            {`sss     # Move forward 3 times
rr      # Rotate 180 degrees (right twice)
llll    # Rotate 360 degrees (full circle)`}
          </pre>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Macros</h2>
          <p className="text-muted-foreground mb-4">
            Define reusable command sequences with uppercase names:
          </p>
          <pre className="p-4 rounded-lg bg-muted font-mono text-sm">
            {`# Define a macro
Square: s r s r s r s r

# Use the macro
Square Square    # Draw two squares`}
          </pre>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Functions with Parameters</h2>
          <p className="text-muted-foreground mb-4">
            Define functions that accept parameters:
          </p>
          <pre className="p-4 rounded-lg bg-muted font-mono text-sm">
            {`# Recursive function
Forward(n): s Forward(n-1)
Forward(n=0):

# Move forward 5 times
Forward(5)

# Function with multiple parameters
Move(x, y): Forward(x) r Forward(y)`}
          </pre>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Multi-Agent Programming</h2>
          <p className="text-muted-foreground mb-4">
            Control multiple robots simultaneously:
          </p>
          <pre className="p-4 rounded-lg bg-muted font-mono text-sm">
            {`# Agent 0 moves forward
@0: sss

# Agent 1 rotates
@1: rrr

# Agent 2 moves in a square
@2: Square`}
          </pre>
          <p className="text-muted-foreground mt-4">
            All agents execute their commands in parallel on each step.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Comments</h2>
          <p className="text-muted-foreground mb-4">
            Use <code className="bg-muted px-1 rounded">#</code> for comments:
          </p>
          <pre className="p-4 rounded-lg bg-muted font-mono text-sm">
            {`# This is a comment
s  # Move forward
r  # Turn right`}
          </pre>
        </section>
      </div>
    </div>
  );
}
