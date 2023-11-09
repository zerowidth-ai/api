import e from"axios";var s={};s=class{constructor({secretKey:e,appId:s,intelligenceId:r}){// Validate input parameters
if(!e||!s||!r)throw Error("Missing required constructor parameters: secretKey, appId, and intelligenceId must be provided");this.secretKey=e,this.appId=s,this.intelligenceId=r,this.baseUrl="https://api.zerowidth.ai"}async makeApiCall(s,r={}){let t=`${this.baseUrl}/${s}`,a={Authorization:`Bearer ${this.secretKey}`,"Content-Type":"application/json",...r.headers};try{let s=await e({method:r.method||"get",url:t,headers:a,data:r.body,params:r.params});return s.data}catch(e){throw console.error("Error making API call:",e),e}}// Process data through an installed intellgience
async process({messages:e,message:s,variables:r,userId:t,sessionId:a,stateful:i,verbose:o}){let d=`process/${this.appId}/${this.intelligenceId}`;if(o&&(d+="?verbose=true"),i&&(!t||!a))throw Error("Stateful processing requires a userId and sessionId");if(i&&e)throw Error("Stateful processing does not support multiple messages");if(i&&!s)throw Error("Stateful processing requires a single message object");return this.makeApiCall(d,{method:"POST",body:{user_id:t,session_id:a,stateful:i,data:{message:s,messages:e,variables:r}}})}};export{s as default};//# sourceMappingURL=main.js.map

//# sourceMappingURL=main.js.map
