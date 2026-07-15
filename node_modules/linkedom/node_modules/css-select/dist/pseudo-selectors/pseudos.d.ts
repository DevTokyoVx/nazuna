import type { PseudoSelector } from "css-what";
import type { InternalOptions } from "../types.js";
type Pseudo = <Node, ElementNode extends Node>(element: ElementNode, options: InternalOptions<Node, ElementNode>, subselect?: string | null) => boolean;
/** Runtime pseudo selector implementations. */
export declare const pseudos: Record<string, Pseudo>;
/**
 * Validate pseudo selector argument arity.
 * @param pseudoClassCondition Pseudo-function implementation to wrap.
 * @param name Name of the pseudo selector.
 * @param subselect Subselector passed to the pseudo-function.
 * @param argumentIndex Index of the argument parser to apply.
 */
export declare function verifyPseudoArguments<T extends unknown[]>(pseudoClassCondition: (...parameters: T) => boolean, name: string, subselect: PseudoSelector["data"], argumentIndex: number): void;
export {};
//# sourceMappingURL=pseudos.d.ts.map