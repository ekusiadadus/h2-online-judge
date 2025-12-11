/**
 * H2 Language Compiler Types
 *
 * Type definitions for the h2lang WebAssembly module output.
 */

/** Command types that an agent can execute */
export type CommandType = "straight" | "rotate_right" | "rotate_left";

/** A single command for an agent */
export interface Command {
  type: CommandType;
  steps?: number;
  angle?: number;
}

/** An agent (robot) with its ID and commands */
export interface Agent {
  id: number;
  commands: Command[];
}

/** A command for a specific agent at a timeline step */
export interface AgentCommand {
  agent_id: number;
  command: Command;
}

/** A single step in the execution timeline */
export interface TimelineEntry {
  step: number;
  agent_commands: AgentCommand[];
}

/** The compiled program output */
export interface Program {
  agents: Agent[];
  max_steps: number;
  timeline: TimelineEntry[];
}

/** Compilation error details */
export interface CompileError {
  line: number;
  column: number;
  message: string;
}

/** Successful compilation result */
export interface CompileSuccess {
  status: "success";
  program: Program;
}

/** Failed compilation result */
export interface CompileFailure {
  status: "error";
  errors: CompileError[];
}

/** Compilation result (success or failure) */
export type CompileResult = CompileSuccess | CompileFailure;

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  errors?: CompileError[];
}
