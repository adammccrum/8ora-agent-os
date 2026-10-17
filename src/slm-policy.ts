import type {AgentDefinition,ModelProfile} from "./types";
export type ModelTier="slm"|"llm";
export interface ModelPlan {tier:ModelTier;profile:ModelProfile;reason:string;requiresFreeRoute:true}
const llmAgents=new Set(["engineering-researcher","software-engineer","testing-engineer","integration-engineer"]);
/** Local policy, not a claim that a model is installed or free quota exists. */
export function chooseModel(agent:AgentDefinition,request:string):ModelPlan{
 const complex=/(patent claim|formal verification|complex simulation|safety critical|legal opinion|advanced coding|multi-step proof)/i.test(request);
 const tier:ModelTier=complex||llmAgents.has(agent.id)?"llm":"slm";
 return {tier,profile:agent.modelProfile,reason:tier==="slm"?"Routine specialist task; small-model first":"Complex or engineering task; larger-model route requires availability",requiresFreeRoute:true};
}
