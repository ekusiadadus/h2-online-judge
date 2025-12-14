/**
 * Share URL Module
 *
 * Provides functions for encoding/decoding playground state
 * into shareable URL parameters.
 */

export { encodeShareState, toCompactState } from "./encoder";
export { decodeShareState, fromCompactState } from "./decoder";
export type {
  ShareState,
  CompactShareState,
  CompactProblem,
  DecodeResult,
} from "./types";
