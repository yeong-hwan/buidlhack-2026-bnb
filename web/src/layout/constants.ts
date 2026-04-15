// ── Layout Constants ──────────────────────────────────────────────────────────
//
// 모든 값은 world 좌표 단위 (zoom=1 기준 픽셀).
// DOM 측정값 아님 — layout 계산에만 사용.

export const BLOCK_WIDTH = 200;

// Shape별 기본 높이
export const HAT_HEIGHT = 60;
export const STACK_HEIGHT = 48;
export const BOOLEAN_HEIGHT = 40;
export const VALUE_HEIGHT = 32;
export const VALUE_WIDTH = 140;

// C-block 구조
export const CBLOCK_HEADER_HEIGHT = 48;
export const CBLOCK_FOOTER_HEIGHT = 24;
export const CBLOCK_CAVITY_MIN_HEIGHT = 48;
export const CBLOCK_CAVITY_PADDING = 8;   // cavity 상하 내부 여백
export const CBLOCK_CAVITY_INDENT = 8;    // cavity 좌우 들여쓰기

// Port anchor 크기 (hit-test / snap 판정용)
export const PORT_ANCHOR_SIZE = 12;

// Snap 판정 거리 (world unit)
export const SNAP_THRESHOLD = 40;
