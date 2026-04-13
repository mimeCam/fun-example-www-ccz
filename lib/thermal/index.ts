export { computeThermalScore, type ThermalState, type ThermalInput, type ThermalResult } from './thermal-score';
export { computeThermalTokens, type ThermalTokens } from './thermal-tokens';
export { computeAnimationTokens, type AnimationTokens } from './thermal-animation';
export {
  loadHistory, saveHistory, accumulateArticle, addResonance, toThermalInput,
  type ThermalHistory,
} from './thermal-history';
export { shouldReveal, QUICK_MIRROR_GATE, EXTENSION_GATE, type DwellGateInput } from './dwell-gate';
export { defaultPlan, returningPlan, ceremonyPlan, type TransitionPlan } from './transition-choreography';
