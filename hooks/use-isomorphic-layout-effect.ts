import * as React from "react";

/**
 * `useLayoutEffect` on the client, `useEffect` during SSR. Used to reset
 * scroll or prime an animation before the browser paints without triggering
 * React's server-render warning.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;
