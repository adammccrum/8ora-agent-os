export async function hashArgs(value:unknown):Promise<string>{
 const bytes=new TextEncoder().encode(JSON.stringify(value));
 const digest=await crypto.subtle.digest("SHA-256",bytes);
 return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
