export default function GuidePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Getting Started</h1>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">What is H2 Online Judge?</h2>
          <p className="text-muted-foreground mb-4">
            H2 Online Judge is a visual programming environment where you write
            code to control robots on a grid. The goal is to navigate robots to
            collect all goals while avoiding traps and walls.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">The Playground</h2>
          <p className="text-muted-foreground mb-4">
            The playground consists of three main parts:
          </p>
          <ul className="space-y-2 text-muted-foreground ml-4">
            <li>
              <strong>Code Editor</strong> - Write your H2 code here
            </li>
            <li>
              <strong>Grid</strong> - Visualize the robot movements
            </li>
            <li>
              <strong>Controls</strong> - Run, pause, and step through execution
            </li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Your First Program</h2>
          <p className="text-muted-foreground mb-4">
            Let&apos;s write a simple program to move the robot forward:
          </p>
          <pre className="p-4 rounded-lg bg-muted font-mono text-sm mb-4">
            s
          </pre>
          <p className="text-muted-foreground mb-4">
            The <code className="bg-muted px-1 rounded">s</code> command moves
            the robot one step forward. You can chain multiple commands:
          </p>
          <pre className="p-4 rounded-lg bg-muted font-mono text-sm mb-4">
            {`sss     # Move forward 3 times
r       # Turn right 90 degrees
ss      # Move forward 2 times`}
          </pre>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Grid Elements</h2>
          <ul className="space-y-2 text-muted-foreground ml-4">
            <li>
              <strong>Robot</strong> - The triangle you control
            </li>
            <li>
              <strong>Goals</strong> - Green circles to collect
            </li>
            <li>
              <strong>Walls</strong> - Black squares that block movement
            </li>
            <li>
              <strong>Traps</strong> - Gray circles that reset collected goals
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
          <p className="text-muted-foreground">
            Check out the{" "}
            <a href="/language" className="text-primary hover:underline">
              Language Reference
            </a>{" "}
            to learn about macros, functions, and multi-agent programming.
          </p>
        </section>
      </div>
    </div>
  );
}
