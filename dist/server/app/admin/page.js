(()=>{var e={};e.id=3,e.ids=[3],e.modules={7849:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external")},2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},5403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},4749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},5143:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>l.a,__next_app__:()=>m,originalPathname:()=>x,pages:()=>o,routeModule:()=>p,tree:()=>d});var r=s(482),a=s(9108),i=s(2563),l=s.n(i),n=s(8300),c={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(c[e]=()=>n[e]);s.d(t,c);let d=["",{children:["admin",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,9481)),"C:\\Users\\Tina H\\.minimax-agent-cn\\projects\\5\\hk-elite-insight\\app\\admin\\page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,2917)),"C:\\Users\\Tina H\\.minimax-agent-cn\\projects\\5\\hk-elite-insight\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,9361,23)),"next/dist/client/components/not-found-error"]}],o=["C:\\Users\\Tina H\\.minimax-agent-cn\\projects\\5\\hk-elite-insight\\app\\admin\\page.tsx"],x="/admin/page",m={require:s,loadChunk:()=>Promise.resolve()},p=new r.AppPageRouteModule({definition:{kind:a.x.APP_PAGE,page:"/admin/page",pathname:"/admin",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},6908:(e,t,s)=>{Promise.resolve().then(s.bind(s,3129))},2173:()=>{},7278:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,2583,23)),Promise.resolve().then(s.t.bind(s,6840,23)),Promise.resolve().then(s.t.bind(s,8771,23)),Promise.resolve().then(s.t.bind(s,3225,23)),Promise.resolve().then(s.t.bind(s,9295,23)),Promise.resolve().then(s.t.bind(s,3982,23))},3129:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>w});var r=s(5344),a=s(3729),i=s(8534),l=s(7121),n=s(7280),c=s(3485),d=s(6064),o=s(304),x=s(2770),m=s(1532),p=s(3746),h=s(9224);/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let u=(0,h.Z)("EyeOff",[["path",{d:"M9.88 9.88a3 3 0 1 0 4.24 4.24",key:"1jxqfv"}],["path",{d:"M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68",key:"9wicm4"}],["path",{d:"M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61",key:"1jreej"}],["line",{x1:"2",x2:"22",y1:"2",y2:"22",key:"a6p6uj"}]]);var b=s(3148);/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let y=(0,h.Z)("Save",[["path",{d:"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",key:"1owoqh"}],["polyline",{points:"17 21 17 13 7 13 7 21",key:"1md35c"}],["polyline",{points:"7 3 7 8 15 8",key:"8nz8an"}]]);var g=s(2312),j=s(1960);let v={Activity:i.Z,FileText:l.Z,Map:n.Z,Shield:c.Z,TrendingUp:d.Z,Globe:o.Z,Route:x.Z},N={gold:{bg:"bg-amber-500",border:"border-amber-500",text:"text-amber-400",button:"bg-amber-500"},primary:{bg:"bg-primary-500",border:"border-primary-500",text:"text-primary-400",button:"bg-primary-500"},blue:{bg:"bg-blue-500",border:"border-blue-500",text:"text-blue-400",button:"bg-blue-500"},green:{bg:"bg-green-500",border:"border-green-500",text:"text-green-400",button:"bg-green-500"},purple:{bg:"bg-purple-500",border:"border-purple-500",text:"text-purple-400",button:"bg-purple-500"},indigo:{bg:"bg-indigo-500",border:"border-indigo-500",text:"text-indigo-400",button:"bg-indigo-500"},cyan:{bg:"bg-cyan-500",border:"border-cyan-500",text:"text-cyan-400",button:"bg-cyan-500"}};function w(){let[e,t]=(0,a.useState)([]),[s,l]=(0,a.useState)(null),[n,c]=(0,a.useState)(""),[d,o]=(0,a.useState)(""),[x,h]=(0,a.useState)(.7),[w,f]=(0,a.useState)(2e3),[k,Z]=(0,a.useState)(!1),[P,S]=(0,a.useState)(!1),[C,M]=(0,a.useState)(!1);(0,a.useEffect)(()=>{t([{id:"health-check",name:"港股通体检专家",icon:"Activity",description:"AI智能分析入通可行性，评估港股上市条件",color:"gold",systemPrompt:`你是一位拥有20年经验的港股IPO上市专家，专精于港股通准入条件和香港联交所上市规则。你的名字叫"港股通体检专家"。

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
请按照以下JSON格式输出体检结果...`,temperature:.7,maxTokens:2e3,price:49.9,features:["股权架构分析","财务指标评估","合规风险提示","改进方案建议"],isActive:!0,version:"1.0.0",lastUpdated:"2024-01-01"},{id:"ipo-analysis",name:"招股书分析专家",icon:"FileText",description:"AI解读招股书核心要点，剖析投资价值与风险",color:"primary",systemPrompt:`你是香港IPO市场的专业分析师，擅长解读招股书。你的名字叫"招股书分析专家"。

## 你的职责
根据用户提供的招股书内容或问题，进行专业分析，帮助投资者理解公司价值和风险。

## 核心分析维度
1. 商业模式解读
2. 保荐人记录
3. 基石投资者分析
4. 风险因素评估
5. 估值分析...`,temperature:.7,maxTokens:2e3,price:29.9,features:["商业模式解读","保荐人记录","基石投资者分析","风险因素评估"],isActive:!0,version:"1.0.0",lastUpdated:"2024-01-01"},{id:"listing-path",name:"上市路径规划专家",icon:"Map",description:"量身定制上市方案，规划最佳路径",color:"blue",systemPrompt:`你是香港上市路径规划专家，拥有15年辅导企业香港上市的经验。你的名字叫"上市路径规划专家"。`,temperature:.7,maxTokens:2e3,price:99.9,features:["架构设计建议","时间线规划","费用估算","节点把控"],isActive:!0,version:"1.0.0",lastUpdated:"2024-01-01"},{id:"compliance",name:"合规审查专家",icon:"Shield",description:"全面排查合规风险，确保上市顺利进行",color:"green",systemPrompt:`你是香港上市合规审查专家，专精于香港联交所上市规则和证券法规。你的名字叫"合规审查专家"。`,temperature:.7,maxTokens:2e3,price:79.9,features:["法律合规检查","监管要求匹配","风险预警","整改建议"],isActive:!0,version:"1.0.0",lastUpdated:"2024-01-01"},{id:"valuation",name:"估值定价专家",icon:"TrendingUp",description:"专业估值分析，提供定价策略参考",color:"purple",systemPrompt:`你是香港上市估值定价专家，精通各种估值方法和市场分析。你的名字叫"估值定价专家"。`,temperature:.7,maxTokens:2e3,price:89.9,features:["市值分析","估值模型","定价区间","同业对比"],isActive:!0,version:"1.0.0",lastUpdated:"2024-01-01"}])},[]);let T=e=>{l(e),c(e.systemPrompt),o(e.price.toString()),h(e.temperature),f(e.maxTokens),M(!1)},z=s&&N[s.color]||N.primary,A=s&&v[s.icon]||i.Z;return(0,r.jsxs)("div",{className:"min-h-screen bg-gradient-to-b from-primary-900 to-primary-950",children:[r.jsx("header",{className:"bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50",children:(0,r.jsxs)("div",{className:"max-w-7xl mx-auto px-4 py-3 flex items-center justify-between",children:[(0,r.jsxs)("div",{className:"flex items-center",children:[(0,r.jsxs)("button",{onClick:()=>window.location.href="/",className:"flex items-center text-primary-900 hover:text-primary-600 transition",children:[r.jsx(m.Z,{size:20}),r.jsx("span",{children:"返回"})]}),(0,r.jsxs)("div",{className:"ml-4 flex items-center",children:[r.jsx(p.Z,{className:"text-primary-600 mr-2",size:24}),r.jsx("h1",{className:"text-xl font-bold text-primary-900",children:"专家配置管理"})]})]}),(0,r.jsxs)("button",{onClick:()=>S(!P),className:"flex items-center text-gray-600 hover:text-primary-600",children:[P?r.jsx(u,{size:20}):r.jsx(b.Z,{size:20}),(0,r.jsxs)("span",{className:"ml-1",children:[P?"隐藏":"预览","JSON"]})]})]})}),(0,r.jsxs)("div",{className:"max-w-7xl mx-auto px-4 py-6 flex gap-6",children:[r.jsx("div",{className:"w-72 flex-shrink-0",children:(0,r.jsxs)("div",{className:"bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20",children:[r.jsx("h2",{className:"text-white font-bold mb-4",children:"专家列表"}),r.jsx("div",{className:"space-y-2",children:e.map(e=>{let t=v[e.icon]||i.Z,a=N[e.color]||N.primary,l=s?.id===e.id;return(0,r.jsxs)("button",{onClick:()=>T(e),className:`
                      w-full p-3 rounded-xl flex items-center space-x-3 transition
                      ${l?"bg-white/20 border border-white/30":"hover:bg-white/10"}
                    `,children:[r.jsx("div",{className:`w-10 h-10 ${a.bg} rounded-lg flex items-center justify-center`,children:r.jsx(t,{className:"text-white",size:20})}),(0,r.jsxs)("div",{className:"flex-1 text-left",children:[r.jsx("p",{className:"text-white font-medium text-sm",children:e.name}),(0,r.jsxs)("p",{className:"text-gray-400 text-xs",children:["v",e.version]})]})]},e.id)})})]})}),r.jsx("div",{className:"flex-1",children:s?(0,r.jsxs)("div",{className:"bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20",children:[(0,r.jsxs)("div",{className:"flex items-center mb-6",children:[r.jsx("div",{className:`w-12 h-12 ${z.bg} rounded-xl flex items-center justify-center mr-4`,children:r.jsx(A,{className:"text-white",size:24})}),(0,r.jsxs)("div",{children:[r.jsx("h2",{className:"text-white font-bold text-xl",children:s.name}),r.jsx("p",{className:"text-gray-400 text-sm",children:"编辑Prompt和参数"})]})]}),(0,r.jsxs)("div",{className:"mb-4",children:[r.jsx("label",{className:"block text-gray-300 text-sm mb-2",children:"服务价格 (\xa5)"}),r.jsx("input",{type:"number",value:d,onChange:e=>o(e.target.value),className:"w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"})]}),(0,r.jsxs)("div",{className:"grid grid-cols-2 gap-4 mb-4",children:[(0,r.jsxs)("div",{children:[r.jsx("label",{className:"block text-gray-300 text-sm mb-2",children:"Temperature (0-1)"}),r.jsx("input",{type:"range",min:"0",max:"1",step:"0.1",value:x,onChange:e=>h(parseFloat(e.target.value)),className:"w-full"}),(0,r.jsxs)("p",{className:"text-gray-400 text-xs mt-1",children:["当前值: ",x]})]}),(0,r.jsxs)("div",{children:[r.jsx("label",{className:"block text-gray-300 text-sm mb-2",children:"Max Tokens"}),r.jsx("input",{type:"number",value:w,onChange:e=>f(parseInt(e.target.value)),className:"w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"})]})]}),(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsxs)("label",{className:"block text-gray-300 text-sm mb-2",children:["System Prompt",r.jsx("span",{className:"text-gray-500 ml-2",children:"（修改AI专家的行为指令）"})]}),r.jsx("textarea",{value:n,onChange:e=>c(e.target.value),rows:20,className:"w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-mono text-sm",placeholder:"在这里输入专家的System Prompt..."})]}),r.jsx("div",{className:"flex gap-3",children:(0,r.jsxs)("button",{onClick:()=>{M(!0),alert('修改已保存到内存中。请点击"导出配置"按钮，将JSON配置复制到剪贴板，然后手动更新到GitHub的experts.json文件中。')},className:`flex-1 ${z.button} text-white py-3 rounded-xl font-medium flex items-center justify-center hover:opacity-90 transition`,children:[r.jsx(y,{size:20,className:"mr-2"}),"保存修改 ",C&&r.jsx(g.Z,{size:16,className:"ml-2 text-green-300"})]})}),(0,r.jsxs)("div",{className:"mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl",children:[r.jsx("p",{className:"text-blue-300 text-sm",children:r.jsx("strong",{children:"使用说明："})}),(0,r.jsxs)("ul",{className:"text-blue-200 text-xs mt-2 space-y-1",children:[r.jsx("li",{children:"1. 修改Prompt内容来调整AI专家的回答风格和专业方向"}),r.jsx("li",{children:'2. 点击"保存修改"保存到当前会话'}),r.jsx("li",{children:'3. 点击右侧"导出配置"获取完整JSON'}),r.jsx("li",{children:"4. 将JSON内容更新到 GitHub 的 app/config/experts.json 文件中"})]})]})]}):r.jsx("div",{className:"bg-white/10 rounded-2xl p-6 border border-white/20 text-center py-20",children:r.jsx("p",{className:"text-gray-400",children:"请从左侧选择一个专家进行编辑"})})}),r.jsx("div",{className:"w-80 flex-shrink-0",children:(0,r.jsxs)("div",{className:"bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 sticky top-24",children:[r.jsx("h2",{className:"text-white font-bold mb-4",children:"配置导出"}),P?r.jsx("div",{className:"mb-4",children:r.jsx("textarea",{readOnly:!0,value:s?JSON.stringify({experts:e.map(e=>e.id===s?.id?{...e,systemPrompt:n,price:parseFloat(d)||e.price,temperature:x,maxTokens:w,lastUpdated:new Date().toISOString().split("T")[0],version:(parseFloat(e.version)+.1).toFixed(1)}:e),settings:{defaultExpert:"health-check",maxConversationHistory:10,enableStreaming:!0}},null,2):"",rows:20,className:"w-full bg-black/30 border border-white/20 rounded-xl px-3 py-2 text-green-400 font-mono text-xs"})}):(0,r.jsxs)("div",{className:"mb-4",children:[r.jsx("h3",{className:"text-gray-300 text-sm mb-2",children:"当前配置预览"}),s?(0,r.jsxs)("div",{className:"space-y-2 text-sm",children:[(0,r.jsxs)("div",{className:"flex justify-between",children:[r.jsx("span",{className:"text-gray-400",children:"专家ID:"}),r.jsx("span",{className:"text-white",children:s.id})]}),(0,r.jsxs)("div",{className:"flex justify-between",children:[r.jsx("span",{className:"text-gray-400",children:"价格:"}),(0,r.jsxs)("span",{className:"text-gold-400",children:["\xa5",d]})]}),(0,r.jsxs)("div",{className:"flex justify-between",children:[r.jsx("span",{className:"text-gray-400",children:"Temperature:"}),r.jsx("span",{className:"text-white",children:x})]}),(0,r.jsxs)("div",{className:"flex justify-between",children:[r.jsx("span",{className:"text-gray-400",children:"Max Tokens:"}),r.jsx("span",{className:"text-white",children:w})]}),(0,r.jsxs)("div",{className:"flex justify-between",children:[r.jsx("span",{className:"text-gray-400",children:"版本:"}),(0,r.jsxs)("span",{className:"text-white",children:["v",s.version]})]}),(0,r.jsxs)("div",{className:"mt-4 pt-4 border-t border-white/10",children:[r.jsx("p",{className:"text-gray-400 text-xs mb-2",children:"Prompt长度:"}),(0,r.jsxs)("p",{className:"text-white",children:[n.length," 字符"]})]})]}):r.jsx("p",{className:"text-gray-400 text-sm",children:"请先选择一个专家"})]}),(0,r.jsxs)("button",{onClick:()=>{let t=JSON.stringify(e,null,2);navigator.clipboard.writeText(t),Z(!0),setTimeout(()=>Z(!1),2e3)},disabled:!s,className:`
                w-full py-3 rounded-xl font-medium flex items-center justify-center transition
                ${s?"bg-gold-500 hover:bg-gold-600 text-white":"bg-gray-600 text-gray-400 cursor-not-allowed"}
              `,children:[k?r.jsx(g.Z,{size:20,className:"mr-2"}):r.jsx(j.Z,{size:20,className:"mr-2"}),k?"已复制!":"复制完整配置"]}),k&&r.jsx("p",{className:"text-green-400 text-xs mt-2 text-center",children:"配置已复制到剪贴板，请粘贴到 experts.json 文件中"})]})})]})]})}},9224:(e,t,s)=>{"use strict";s.d(t,{Z:()=>l});var r=s(3729),a={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let i=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase().trim(),l=(e,t)=>{let s=(0,r.forwardRef)(({color:s="currentColor",size:l=24,strokeWidth:n=2,absoluteStrokeWidth:c,className:d="",children:o,...x},m)=>(0,r.createElement)("svg",{ref:m,...a,width:l,height:l,stroke:s,strokeWidth:c?24*Number(n)/Number(l):n,className:["lucide",`lucide-${i(e)}`,d].join(" "),...x},[...t.map(([e,t])=>(0,r.createElement)(e,t)),...Array.isArray(o)?o:[o]]));return s.displayName=`${e}`,s}},8534:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(9224).Z)("Activity",[["path",{d:"M22 12h-4l-3 9L9 3l-3 9H2",key:"d5dnw9"}]])},2312:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(9224).Z)("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]])},1532:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(9224).Z)("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]])},1960:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(9224).Z)("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},3148:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(9224).Z)("Eye",[["path",{d:"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z",key:"rwhkz3"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]])},7121:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(9224).Z)("FileText",[["path",{d:"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",key:"1nnpy2"}],["polyline",{points:"14 2 14 8 20 8",key:"1ew0cm"}],["line",{x1:"16",x2:"8",y1:"13",y2:"13",key:"14keom"}],["line",{x1:"16",x2:"8",y1:"17",y2:"17",key:"17nazh"}],["line",{x1:"10",x2:"8",y1:"9",y2:"9",key:"1a5vjj"}]])},304:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(9224).Z)("Globe",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]])},7280:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(9224).Z)("Map",[["polygon",{points:"3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21",key:"ok2ie8"}],["line",{x1:"9",x2:"9",y1:"3",y2:"18",key:"w34qz5"}],["line",{x1:"15",x2:"15",y1:"6",y2:"21",key:"volv9a"}]])},2770:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(9224).Z)("Route",[["circle",{cx:"6",cy:"19",r:"3",key:"1kj8tv"}],["path",{d:"M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15",key:"1d8sl"}],["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}]])},3746:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(9224).Z)("Settings",[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]])},3485:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(9224).Z)("Shield",[["path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10",key:"1irkt0"}]])},6064:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(9224).Z)("TrendingUp",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]])},9481:(e,t,s)=>{"use strict";s.r(t),s.d(t,{$$typeof:()=>i,__esModule:()=>a,default:()=>l});let r=(0,s(6843).createProxy)(String.raw`C:\Users\Tina H\.minimax-agent-cn\projects\5\hk-elite-insight\app\admin\page.tsx`),{__esModule:a,$$typeof:i}=r,l=r.default},2917:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>i,metadata:()=>a});var r=s(5036);s(7272);let a={title:"港股智通 - 港股IPO专家 | HK-Elite Insight",description:"专业港股通体检、招股书分析、MSCI富时指数规划，为内地企业家提供港股IPO一站式服务",keywords:"港股, IPO, 港股通, 招股书, 上市, 体检, 投资, MSCI, 富时",authors:[{name:"HK-Elite Insight"}],viewport:"width=device-width, initial-scale=1, maximum-scale=1",themeColor:"#0a2463"};function i({children:e}){return r.jsx("html",{lang:"zh-CN",children:r.jsx("body",{children:e})})}},7272:()=>{}};var t=require("../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[638,356],()=>s(5143));module.exports=r})();