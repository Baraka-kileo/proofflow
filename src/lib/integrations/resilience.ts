export class ConnectorTimeoutError extends Error { constructor(){super("Buyer-system request timed out.");this.name="ConnectorTimeoutError";} }
export async function withSafeRetry<T>(operation:()=>Promise<T>,options:{timeoutMs:number;retries:number}):Promise<T>{
  let lastError:unknown;
  for(let attempt=0;attempt<=options.retries;attempt++){
    let timer:ReturnType<typeof setTimeout>|undefined;
    try{return await Promise.race([operation(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new ConnectorTimeoutError()),options.timeoutMs);})]);}
    catch(error){lastError=error;if(attempt===options.retries)throw error;}
    finally{if(timer)clearTimeout(timer);}
  }
  throw lastError;
}
