"use strict";(()=>{var e={};e.id=989,e.ids=[989],e.modules={517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},6067:(e,s,t)=>{t.r(s),t.d(s,{headerHooks:()=>w,originalPathname:()=>f,patchFetch:()=>$,requestAsyncStorage:()=>m,routeModule:()=>g,serverHooks:()=>I,staticGenerationAsyncStorage:()=>y,staticGenerationBailout:()=>A});var r={};t.r(r),t.d(r,{POST:()=>d});var a=t(5419),i=t(9108),o=t(9678),n=t(8070);let u=process.env.AZURE_OPENAI_ENDPOINT||"",c=process.env.AZURE_OPENAI_API_KEY||"",l=`你是一位拥有20年经验的港股IPO上市专家，专精于港股通准入条件和香港联交所上市规则。你的名字叫"港股通体检专家"。

## 你的职责
根据用户提供的公司信息，进行港股通入通可行性体检，并给出专业的改进建议。

## 港股通准入条件（必须严格遵守）

### 主板上市条件（满足其一即可）：
1. 盈利测试：最近一年盈利≥3500万港元，前两年累计盈利≥4500万港元，前三年累计盈利≥8000万港元
2. 市值收益测试：市值≥40亿港元，最近一年收益≥5亿港元
3. 市值收益现金流测试：市值≥20亿港元，最近一年收益≥5亿港元，最近三年累计现金流≥1亿港元

### 港股通纳入条件：
- 必须在香港主板或创业板上市
- 市值不低于50亿港元
- 需被纳入恒生综合大型股/中型股指数

## 输出格式
请按照以下JSON格式输出体检结果：
{
  "overallScore": 0-100的评分,
  "summary": "总体评估摘要",
  "details": {
    "财务指标": {"status": "pass/warning/fail", "score": 0-100, "issues": [], "details": ""},
    "股权架构": {"status": "pass/warning/fail", "score": 0-100, "issues": [], "details": ""},
    "合规要求": {"status": "pass/warning/fail", "score": 0-100, "issues": [], "details": ""},
    "市值达标": {"status": "pass/warning/fail", "score": 0-100, "issues": [], "details": ""}
  },
  "recommendations": [{"priority": "high/medium/low", "category": "", "suggestion": ""}]
}`;async function h(e){try{let s=await fetch(u,{method:"POST",headers:{"Content-Type":"application/json","api-key":c},body:JSON.stringify({messages:e,temperature:.7,max_tokens:2e3})});if(!s.ok){let e=await s.text();throw Error(`Azure OpenAI API error: ${s.status} - ${e}`)}return(await s.json()).choices[0].message.content}catch(e){throw console.error("Azure OpenAI API error:",e),e}}function p(e){let s=e.profits||[],t=s[2]||0,r=s.reduce((e,s)=>e+s,0),a=e.marketCap||0,i=e.revenue||0,o=50,n=[];t>=3500&&r>=8e3?o=90:t>=2e3||r>=5e3?(o=70,t<3500&&n.push("最近一年盈利未达到3500万要求"),r<8e3&&n.push("三年累计盈利未达到8000万要求")):(n.push("不满足盈利测试要求"),a>=40&&i>=5?o=80:a>=20&&i>=5?o=75:(o=30,n.push("不满足市值收益测试要求")));let u=80,c=[];e.controllingShareholder>75&&(u-=20,c.push("控股股东持股比例过高，可能影响独立性")),e.isVIE&&(u-=15,c.push("采用VIE架构需关注监管合规"));let l=60,h=[];a>=50?l=95:a>=40&&(l=85,h.push("市值50亿以上可纳入港股通"));let p=70,d=[];e.isVIE&&(d.push("需关注VIE架构合规性"),p-=10);let g=Math.round(.35*o+.2*u+.3*l+.15*p),m="";return m=g>=80?"公司整体情况良好，具备港股上市基本条件，建议尽快启动上市筹备工作。":g>=60?"公司具备一定上市基础，但存在部分问题需要改进，建议针对性优化后再启动。":"公司目前离港股上市要求还有较大差距，建议优先解决关键问题后再考虑上市。",{overallScore:g,summary:m,details:{财务指标:{status:o>=70?"pass":o>=50?"warning":"fail",score:o,issues:n,details:`最近一年盈利${t}万，三年累计${r}万。`},股权架构:{status:u>=70?"pass":u>=50?"warning":"fail",score:u,issues:c,details:`控股股东持股${e.controllingShareholder}%。${e.isVIE?"采用VIE架构。":""}`},合规要求:{status:p>=70?"pass":p>=50?"warning":"fail",score:p,issues:d,details:`行业类型：${e.industry}。`},市值达标:{status:l>=70?"pass":"warning",score:l,issues:h,details:`预计市值${a}亿，营收${i}亿。`}},recommendations:[{priority:g<70?"high":"medium",category:"财务优化",suggestion:o<70?"建议提升盈利水平或选择适合的上市财务测试路径":"财务状况良好，保持即可"},{priority:e.isVIE?"high":"low",category:"架构调整",suggestion:e.isVIE?"建议咨询专业律师，确保VIE架构合规性":"股权架构清晰，继续保持"},{priority:a<50?"medium":"low",category:"市值提升",suggestion:a<50?"建议在上市前完成Pre-IPO融资，提升市值至50亿以上":"市值已达标"}].filter(e=>e.suggestion)}}async function d(e){try{let{companyName:s,industry:t,isVIE:r,profits:a,marketCap:i,revenue:o,controllingShareholder:u,hasOffshore:c}=await e.json(),d=`请为以下公司进行港股通入通可行性体检：

## 公司基本信息
- 公司名称：${s}
- 行业类型：${t}
- 是否采用VIE架构：${r?"是":"否"}

## 财务数据（万港元）
- 最近一年盈利：${a?.[2]||"未提供"}
- 前一年盈利：${a?.[1]||"未提供"}
- 大前年盈利：${a?.[0]||"未提供"}
- 预计市值：${i}亿港元
- 最近一年营收：${o}亿港元

## 股权架构
- 控股股东持股比例：${u}%
- 是否存在境外股东：${c?"是":"否"}

请基于以上信息，按照港股通准入条件进行专业分析，并输出JSON格式的体检结果。`;try{let e;let g=await h([{role:"system",content:l},{role:"user",content:d}]);try{e=JSON.parse(g)}catch{let e=p({companyName:s,industry:t,isVIE:r,profits:a,marketCap:i,revenue:o,controllingShareholder:u,hasOffshore:c});return n.Z.json({success:!0,data:e,aiAnalysis:g,message:"AI分析完成"})}return n.Z.json({success:!0,data:e,message:"AI分析完成"})}catch(l){console.error("AI调用失败，使用模拟结果:",l);let e=p({companyName:s,industry:t,isVIE:r,profits:a,marketCap:i,revenue:o,controllingShareholder:u,hasOffshore:c});return n.Z.json({success:!0,data:e,isMock:!0,message:"演示模式（AI服务暂时不可用）"})}}catch(e){return console.error("Health check error:",e),n.Z.json({success:!1,error:e.message||"体检服务出现错误"},{status:500})}}let g=new a.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/health-check/route",pathname:"/api/health-check",filename:"route",bundlePath:"app/api/health-check/route"},resolvedPagePath:"C:\\Users\\Tina H\\.minimax-agent-cn\\projects\\5\\hk-elite-insight\\app\\api\\health-check\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:m,staticGenerationAsyncStorage:y,serverHooks:I,headerHooks:w,staticGenerationBailout:A}=g,f="/api/health-check/route";function $(){return(0,o.patchFetch)({serverHooks:I,staticGenerationAsyncStorage:y})}}};var s=require("../../../webpack-runtime.js");s.C(e);var t=e=>s(s.s=e),r=s.X(0,[638,206],()=>t(6067));module.exports=r})();