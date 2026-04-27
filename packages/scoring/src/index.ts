// @seeneyu/scoring — shared scoring primitives.
//
// M46 scope: export only the three Mirror Mode reducers (eye contact, posture,
// vocal pace). The existing holistic-scorer / temporal-analyzer / mediapipe-init
// modules in seeneyu/src/services/ will be relocated into this package in a
// follow-up pass; for now the web app continues to import them from their
// current location so this migration does not block M46.
export * from './mirror-metrics'
export type { MirrorMetricSample, MirrorMetricAggregate } from './mirror-metrics'
export * from './vocal-pace'
export type { FrameInput } from './vocal-pace'
