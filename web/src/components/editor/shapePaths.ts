/**
 * SVG path generators for each block shape.
 * All paths are at local origin (0,0) — caller translates to world coords.
 *
 * Notch conventions:
 *   NX=20  — notch x-offset from left edge
 *   NW=20  — notch width
 *   NH=8   — notch height (protrudes below block or indents into top)
 *   R=4    — corner radius
 *
 * C-block arm:
 *   INDENT=20 — width of the left arm connecting header to footer
 */

const NX = 20, NW = 20, NH = 8, R = 4, INDENT = 20;

/** Hat block: rounded top, notch tab at bottom, no top notch hole */
export function hatPath(w: number, h: number): string {
  return [
    `M ${R} 0`,
    `H ${w - R} Q ${w} 0 ${w} ${R}`,
    `V ${h}`,
    `H ${NX + NW} V ${h + NH} H ${NX} V ${h}`,
    `H 0 V ${R} Q 0 0 ${R} 0 Z`,
  ].join(' ');
}

/** Stack block: notch hole at top, notch tab at bottom */
export function stackPath(w: number, h: number): string {
  return [
    `M 0 0`,
    `H ${NX} V ${NH} H ${NX + NW} V 0`,
    `H ${w - R} Q ${w} 0 ${w} ${R}`,
    `V ${h}`,
    `H ${NX + NW} V ${h + NH} H ${NX} V ${h}`,
    `H 0 Z`,
  ].join(' ');
}

/** Boolean block: hexagon (pointed left/right sides) */
export function hexPath(w: number, h: number): string {
  const cx = h / 2;
  return [
    `M ${cx} 0 H ${w - cx}`,
    `L ${w} ${h / 2}`,
    `L ${w - cx} ${h}`,
    `H ${cx}`,
    `L 0 ${h / 2} Z`,
  ].join(' ');
}

/** Value block: pill / capsule */
export function capsulePath(w: number, h: number): string {
  const r = h / 2;
  return [
    `M ${r} 0 H ${w - r}`,
    `Q ${w} 0 ${w} ${r}`,
    `Q ${w} ${h} ${w - r} ${h}`,
    `H ${r}`,
    `Q 0 ${h} 0 ${r}`,
    `Q 0 0 ${r} 0 Z`,
  ].join(' ');
}

/**
 * C-block: header + cavity + footer with left arm.
 * Top has notch hole (prev), bottom has notch tab (next).
 *
 * @param w        block width
 * @param headerH  header height (CBLOCK_HEADER_HEIGHT)
 * @param cavH     total cavity height (includes padding, computed from children)
 * @param footerH  footer height (CBLOCK_FOOTER_HEIGHT)
 */
export function cBlockPath(w: number, headerH: number, cavH: number, footerH: number): string {
  const totalH = headerH + cavH + footerH;
  return [
    // Header top: notch hole
    `M 0 0`,
    `H ${NX} V ${NH} H ${NX + NW} V 0`,
    `H ${w - R} Q ${w} 0 ${w} ${R}`,
    // Right side down full height
    `V ${totalH}`,
    // Footer bottom: notch tab
    `H ${NX + NW} V ${totalH + NH} H ${NX} V ${totalH}`,
    // Left side of footer up to cavity bottom
    `H 0 V ${headerH + cavH}`,
    // C-block arm: go right to inner wall, up through cavity, back left
    `H ${INDENT} V ${headerH} H 0`,
    // Left side of header up to top
    `V 0 Z`,
  ].join(' ');
}

/** Slot separator line path for if_else (divides then/else cavities) */
export function slotDividerPath(w: number, x: number, y: number): string {
  return `M ${x} ${y} H ${w}`;
}
