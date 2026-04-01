(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[512],{5290:function(e,t,r){Promise.resolve().then(r.bind(r,1964))},1964:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return y}});var n=r(3827),i=r(4090),a=r(5032),o=r(9475),s=r(2220),l=r(7326),c=r(9733),d=r(7451),x=r(793),m=r(9108),u=r(8727),p=r(6578);let h={Activity:a.Z,FileText:o.Z,Map:s.Z,Shield:l.Z,TrendingUp:c.Z,Globe:d.Z,Route:x.Z},b={gold:{bg:"bg-amber-500/10",border:"border-amber-500/30",text:"text-amber-400",gradient:"from-amber-500/20 to-amber-600/10"},primary:{bg:"bg-primary-500/10",border:"border-primary-500/30",text:"text-primary-400",gradient:"from-primary-500/20 to-primary-600/10"},blue:{bg:"bg-blue-500/10",border:"border-blue-500/30",text:"text-blue-400",gradient:"from-blue-500/20 to-blue-600/10"},green:{bg:"bg-green-500/10",border:"border-green-500/30",text:"text-green-400",gradient:"from-green-500/20 to-green-600/10"},purple:{bg:"bg-purple-500/10",border:"border-purple-500/30",text:"text-purple-400",gradient:"from-purple-500/20 to-purple-600/10"},indigo:{bg:"bg-indigo-500/10",border:"border-indigo-500/30",text:"text-indigo-400",gradient:"from-indigo-500/20 to-indigo-600/10"},cyan:{bg:"bg-cyan-500/10",border:"border-cyan-500/30",text:"text-cyan-400",gradient:"from-cyan-500/20 to-cyan-600/10"}};function y(){let[e,t]=(0,i.useState)([]),[r,o]=(0,i.useState)(null),[s,l]=(0,i.useState)(!0);(0,i.useEffect)(()=>{c()},[]);let c=async()=>{try{let e=await fetch("/api/experts"),r=await e.json();r.success&&(t(r.data),r.data.length>0&&o(r.data[0]))}catch(e){console.error("加载专家列表失败:",e)}finally{l(!1)}},d=e=>{o(e)};return s?(0,n.jsx)("div",{className:"min-h-screen bg-gradient-to-b from-primary-900 to-primary-950 flex items-center justify-center",children:(0,n.jsxs)("div",{className:"text-white text-center",children:[(0,n.jsx)("div",{className:"w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"}),(0,n.jsx)("p",{children:"加载专家列表中..."})]})}):(0,n.jsxs)("div",{className:"min-h-screen bg-gradient-to-b from-primary-900 to-primary-950",children:[(0,n.jsx)("header",{className:"bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50",children:(0,n.jsxs)("div",{className:"max-w-4xl mx-auto px-4 py-3 flex items-center",children:[(0,n.jsxs)("button",{onClick:()=>window.location.href="/",className:"flex items-center text-primary-900 hover:text-primary-600 transition",children:[(0,n.jsx)(m.Z,{size:20}),(0,n.jsx)("span",{children:"返回"})]}),(0,n.jsx)("h1",{className:"flex-1 text-center text-xl font-bold text-primary-900 mr-8",children:"选择您的专属专家"})]})}),(0,n.jsxs)("main",{className:"max-w-4xl mx-auto px-4 py-8",children:[(0,n.jsxs)("div",{className:"text-center mb-8",children:[(0,n.jsx)("div",{className:"inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gold-500 to-gold-600 rounded-2xl mb-4",children:(0,n.jsx)(u.Z,{className:"text-white",size:32})}),(0,n.jsx)("h1",{className:"text-3xl font-bold text-white mb-2",children:"港股IPO专家团队"}),(0,n.jsx)("p",{className:"text-primary-100",children:"选择最适合您的专家，获得专业指导"})]}),(0,n.jsx)("div",{className:"grid md:grid-cols-2 gap-4",children:e.map(e=>{let t=h[e.icon]||a.Z,i=b[e.color]||b.primary,o=(null==r?void 0:r.id)===e.id;return(0,n.jsxs)("div",{onClick:()=>d(e),className:"\n                  relative p-6 rounded-2xl cursor-pointer transition-all duration-300\n                  ".concat(o?"bg-gradient-to-br ".concat(i.gradient," border-2 ").concat(i.border," scale-[1.02]"):"bg-white/5 border border-white/10 hover:bg-white/10","\n                "),children:[o&&(0,n.jsx)("div",{className:"absolute top-4 right-4 ".concat(i.text),children:(0,n.jsx)(p.Z,{size:24})}),(0,n.jsx)("div",{className:"\n                  w-14 h-14 ".concat(i.bg," ").concat(i.border," border-2 rounded-xl \n                  flex items-center justify-center mb-4\n                "),children:(0,n.jsx)(t,{className:i.text,size:28})}),(0,n.jsx)("h3",{className:"text-xl font-bold text-white mb-2",children:e.name}),(0,n.jsx)("p",{className:"text-primary-100 text-sm mb-4",children:e.description}),(0,n.jsx)("div",{className:"flex flex-wrap gap-2 mb-4",children:e.features.map((e,t)=>(0,n.jsx)("span",{className:"px-2 py-1 bg-white/10 rounded-lg text-xs text-primary-50",children:e},t))}),(0,n.jsxs)("div",{className:"flex items-center justify-between",children:[(0,n.jsxs)("span",{className:"".concat(i.text," font-bold text-lg"),children:["\xa5",e.price]}),(0,n.jsxs)("span",{className:"text-primary-200 text-sm",children:["v",e.version]})]})]},e.id)})}),r&&(0,n.jsx)("div",{className:"fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-primary-950 to-transparent",children:(0,n.jsx)("div",{className:"max-w-4xl mx-auto",children:(0,n.jsxs)("button",{onClick:()=>{r&&(window.location.href="/chat?expert=".concat(r.id))},className:"w-full bg-gradient-to-r from-gold-500 to-gold-600 text-white py-4 rounded-xl font-bold text-lg hover:from-gold-600 hover:to-gold-700 transition shadow-lg shadow-gold-500/20",children:["开始咨询 ",r.name]})})}),(0,n.jsx)("div",{className:"h-24"})]})]})}},7461:function(e,t,r){"use strict";r.d(t,{Z:function(){return o}});var n=r(4090),i={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase().trim(),o=(e,t)=>{let r=(0,n.forwardRef)((r,o)=>{let{color:s="currentColor",size:l=24,strokeWidth:c=2,absoluteStrokeWidth:d,className:x="",children:m,...u}=r;return(0,n.createElement)("svg",{ref:o,...i,width:l,height:l,stroke:s,strokeWidth:d?24*Number(c)/Number(l):c,className:["lucide","lucide-".concat(a(e)),x].join(" "),...u},[...t.map(e=>{let[t,r]=e;return(0,n.createElement)(t,r)}),...Array.isArray(m)?m:[m]])});return r.displayName="".concat(e),r}},5032:function(e,t,r){"use strict";r.d(t,{Z:function(){return n}});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,r(7461).Z)("Activity",[["path",{d:"M22 12h-4l-3 9L9 3l-3 9H2",key:"d5dnw9"}]])},6578:function(e,t,r){"use strict";r.d(t,{Z:function(){return n}});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,r(7461).Z)("CheckCircle",[["path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14",key:"g774vq"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]])},9108:function(e,t,r){"use strict";r.d(t,{Z:function(){return n}});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,r(7461).Z)("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]])},9475:function(e,t,r){"use strict";r.d(t,{Z:function(){return n}});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,r(7461).Z)("FileText",[["path",{d:"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",key:"1nnpy2"}],["polyline",{points:"14 2 14 8 20 8",key:"1ew0cm"}],["line",{x1:"16",x2:"8",y1:"13",y2:"13",key:"14keom"}],["line",{x1:"16",x2:"8",y1:"17",y2:"17",key:"17nazh"}],["line",{x1:"10",x2:"8",y1:"9",y2:"9",key:"1a5vjj"}]])},7451:function(e,t,r){"use strict";r.d(t,{Z:function(){return n}});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,r(7461).Z)("Globe",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]])},2220:function(e,t,r){"use strict";r.d(t,{Z:function(){return n}});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,r(7461).Z)("Map",[["polygon",{points:"3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21",key:"ok2ie8"}],["line",{x1:"9",x2:"9",y1:"3",y2:"18",key:"w34qz5"}],["line",{x1:"15",x2:"15",y1:"6",y2:"21",key:"volv9a"}]])},793:function(e,t,r){"use strict";r.d(t,{Z:function(){return n}});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,r(7461).Z)("Route",[["circle",{cx:"6",cy:"19",r:"3",key:"1kj8tv"}],["path",{d:"M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15",key:"1d8sl"}],["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}]])},7326:function(e,t,r){"use strict";r.d(t,{Z:function(){return n}});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,r(7461).Z)("Shield",[["path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10",key:"1irkt0"}]])},8727:function(e,t,r){"use strict";r.d(t,{Z:function(){return n}});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,r(7461).Z)("Sparkles",[["path",{d:"m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z",key:"17u4zn"}],["path",{d:"M5 3v4",key:"bklmnn"}],["path",{d:"M19 17v4",key:"iiml17"}],["path",{d:"M3 5h4",key:"nem4j1"}],["path",{d:"M17 19h4",key:"lbex7p"}]])},9733:function(e,t,r){"use strict";r.d(t,{Z:function(){return n}});/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,r(7461).Z)("TrendingUp",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]])}},function(e){e.O(0,[971,69,744],function(){return e(e.s=5290)}),_N_E=e.O()}]);