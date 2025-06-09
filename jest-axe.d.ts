declare module "jest-axe" {
  import { MatcherFunction } from "expect";

  export const axe: (node: HTMLElement) => Promise<any>;
  export const toHaveNoViolations: MatcherFunction<[any]>;
}
