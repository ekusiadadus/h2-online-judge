/**
 * H2 Language Compiler Types
 *
 * Type definitions for the h2lang WebAssembly module output.
 */

/** Position on the grid */
export interface Position {
  x: number;
  y: number;
}

/** Direction in degrees (0: up, 90: right, 180: down, 270: left) */
export type Direction = 0 | 90 | 180 | 270;

/** Start position with direction */
export interface StartPosition extends Position {
  direction: Direction;
}

/**
 * Problem definition for Herbert-style puzzles.
 *
 * - goals: White circles that must be stepped on
 * - walls: Black blocks that cannot be passed through
 * - traps: Gray circles that reset all visited goals
 * - startPosition: Initial robot position and direction
 */
export interface Problem {
  goals: Position[];
  walls: Position[];
  traps: Position[];
  startPosition: StartPosition;
}

/** Command types that an agent can execute */
export type CommandType = "straight" | "rotate_right" | "rotate_left" | "wait";

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

/** Successful byte count result */
export interface CountBytesSuccess {
  status: "success";
  bytes: number;
}

/** Failed byte count result */
export interface CountBytesFailure {
  status: "error";
  message: string;
}

/** Byte count result (success or failure) */
export type CountBytesResult = CountBytesSuccess | CountBytesFailure;
