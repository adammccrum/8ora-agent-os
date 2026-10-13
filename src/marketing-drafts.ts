export type Brand = "IrisKey.ai" | "8ORA.AI";
export type Draft = {brand:Brand;channel:"LinkedIn"|"Shorts";title:string;body:string;approvalRequired:true;published:false};
const brandNames:Brand[]=["IrisKey.ai","8ORA.AI"];
export function buildMarketingDrafts(date=new Date()):Draft[]{
 const day=date.toISOString().slice(0,10);
 return [
  {brand:brandNames[0],channel:"LinkedIn",title:"Authority before autonomy",body:"AI can make a decision. But who gives it permission to act? At IrisKey.ai, we focus on the boundary between a system deciding and a real-world consequence. Authority before autonomy. #AIGovernance #Safety",approvalRequired:true,published:false},
  {brand:brandNames[1],channel:"LinkedIn",title:"Business time back",body:"How much time does your business spend repeating the same admin and content tasks? 8ORA.AI is exploring a simpler way to prepare work for human review, so people can focus on customers. #SmallBusiness #AI",approvalRequired:true,published:false},
  {brand:brandNames[0],channel:"Shorts",title:"Who authorised that?",body:"Date: "+day+"\nScene 1: An autonomous machine receives an instruction.\nScene 2: The screen asks: Can it do it, and is it authorised?\nScene 3: IrisKey.ai — Authority Before Autonomy.\nVoiceover and visuals are a draft only.",approvalRequired:true,published:false}
 ];
}
