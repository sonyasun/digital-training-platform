<template>
  <Teleport to="body" :disabled="embedded">
    <Transition name="signature-modal">
      <div v-if="open" :class="['signature-overlay', { 'is-embedded': embedded, 'is-presentation-only': presentationOnly }]" role="dialog" :aria-modal="embedded ? undefined : 'true'" aria-labelledby="signature-title" @keydown.esc="emit('close')">
        <button v-if="!embedded" class="signature-backdrop" type="button" aria-label="关闭介绍" @click="emit('close')"></button>
        <section ref="modalRef" class="signature-card">
          <header v-if="!presentationOnly" class="signature-header">
            <div>
              <p class="eyebrow"><AiGlyph /> AI 个性化学习</p>
              <h1 id="signature-title">让学习更轻松，让进步看得见！</h1>
              <!-- <p class="lead">从知识图谱到专属路径，AI 根据每一次学习证据实时规划、补强与拓展。</p> -->
            </div>
            <button v-if="!embedded" class="icon-button" type="button" aria-label="关闭介绍" @click="emit('close')"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
          </header>

          <div class="signature-body">
            <div class="map-stage">
              <div class="map-mountains" :style="mapMountainsStyle"></div><div class="map-wash"></div><div class="map-grid"></div>
              <svg class="learning-map" viewBox="0 0 820 420" role="img" aria-label="个性化学习路径动画演示">
                <defs>
                  <radialGradient id="sigGreen" cx="34%" cy="28%" r="72%"><stop offset="0" stop-color="#A7F3D0"/><stop offset=".42" stop-color="#34D399"/><stop offset="1" stop-color="#047857"/></radialGradient>
                  <radialGradient id="sigRed" cx="34%" cy="28%" r="72%"><stop offset="0" stop-color="#FECACA"/><stop offset=".42" stop-color="#EF4444"/><stop offset="1" stop-color="#991B1B"/></radialGradient>
                  <radialGradient id="sigBlue" cx="34%" cy="28%" r="72%"><stop offset="0" stop-color="#BFDBFE"/><stop offset=".42" stop-color="#3B82F6"/><stop offset="1" stop-color="#1E40AF"/></radialGradient>
                  <radialGradient id="sigGray" cx="34%" cy="28%" r="72%"><stop offset="0" stop-color="#F8FAFC"/><stop offset=".5" stop-color="#CBD5E1"/><stop offset="1" stop-color="#64748B"/></radialGradient>
                  <radialGradient id="sigAmber" cx="34%" cy="28%" r="72%"><stop offset="0" stop-color="#FDE68A"/><stop offset=".48" stop-color="#F59E0B"/><stop offset="1" stop-color="#B45309"/></radialGradient>
                  <filter id="sigGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  <filter id="sigShadow" x="-80%" y="-80%" width="260%" height="260%"><feDropShadow dx="0" dy="7" stdDeviation="7" flood-color="#0F172A" flood-opacity=".18"/></filter>
                  <filter id="sigScatterGlow" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                </defs>

                <g v-show="activeDemo === 'planning'" class="planning-scene">
                  <g class="graph-edges"><path d="M126 110L270 72L402 126L548 82L692 134M126 110L220 276L402 126L466 286L692 134M270 72L220 276M548 82L466 286"/></g>
                  <path class="planning-path" d="M72 322C158 288 188 279 228 258C286 228 314 235 364 210C423 180 452 191 502 160C560 125 598 133 642 108C690 81 727 88 774 62"/>
                  <g v-for="node in planningNodes" :key="node.id" :class="['scatter-node', `scatter-${node.id}`, `scatter-node--${node.tone}`]" :transform="`translate(${node.x} ${node.y})`">
                    <circle class="scatter-halo" r="34" />
                    <circle class="scatter-ring" r="28" />
                    <circle class="scatter-core" r="21" :fill="node.fill" filter="url(#sigShadow)" />
                    <ellipse class="scatter-shine" cx="-7" cy="-9" rx="9" ry="5.5" transform="rotate(-24)" />
                    <text class="scatter-code" y="1">{{ node.code }}</text>
                    <g class="scatter-label">
                      <line class="scatter-label-line" x1="0" y1="24" x2="0" y2="37" />
                      <text class="planned-label" y="50">{{ node.label }}</text>
                    </g>
                  </g>
                </g>

                <g v-show="activeDemo === 'reinforce'" class="reinforce-scene">
                  <path class="path-base" d="M70 320C155 285 198 292 270 246C337 205 393 214 456 172C526 125 588 153 660 104C700 77 736 84 780 57"/>
                  <path class="path-signal" d="M70 320C155 285 198 292 270 246C337 205 393 214 456 172C526 125 588 153 660 104C700 77 736 84 780 57"/>
                  <path class="insert-path" d="M270 246C316 220 344 219 382 199C409 185 432 178 456 172"/>
                  <g class="map-node map-node--green" transform="translate(70 320)">
                    <circle class="map-node-halo" r="32" /><circle class="map-node-ring" r="26" />
                    <circle class="map-node-core" r="21" fill="url(#sigGreen)" filter="url(#sigShadow)" />
                    <ellipse class="map-node-shine" cx="-7" cy="-9" rx="8" ry="5" transform="rotate(-24)" />
                    <path class="map-node-check" d="M-7 0l5 5L9-8" />
                    <g class="map-node-label"><line class="map-node-label-line" x1="0" y1="24" x2="0" y2="37" /><text class="node-name" y="50">BIM 基础概念</text></g>
                  </g>
                  <g class="focus-node map-node--focus" transform="translate(270 246)">
                    <circle class="focus-halo" r="40" /><circle class="map-node-ring" r="30" />
                    <circle class="focus-green map-node-core" r="24" fill="url(#sigGreen)" filter="url(#sigShadow)" />
                    <circle class="focus-red map-node-core" r="24" fill="url(#sigRed)" filter="url(#sigShadow)" />
                    <circle class="ring-bg" r="34" /><circle class="mastery-ring" r="34" />
                    <ellipse class="map-node-shine" cx="-8" cy="-10" rx="9" ry="5.5" transform="rotate(-24)" />
                    <text class="node-index" y="1">2</text>
                    <g class="map-node-label"><line class="map-node-label-line map-node-label-line--focus" x1="0" y1="28" x2="0" y2="41" /><text class="node-name" y="54">BIM 模型精度</text></g>
                  </g>
                  <g class="reinforce-node map-node--reinforce" transform="translate(382 199)">
                    <circle class="reinforce-halo" r="44" /><circle class="map-node-ring map-node-ring--amber" r="34" />
                    <polygon class="star-amber map-node-star" points="0,-29 7,-9 28,-9 11,4 17,25 0,13 -17,25 -11,4 -28,-9 -7,-9" fill="url(#sigAmber)" filter="url(#sigShadow)" />
                    <polygon class="star-green map-node-star" points="0,-29 7,-9 28,-9 11,4 17,25 0,13 -17,25 -11,4 -28,-9 -7,-9" fill="url(#sigGreen)" filter="url(#sigShadow)" />
                    <path class="star-check" d="M-8 0l6 6L10-8" />
                    <g class="map-node-label"><line class="map-node-label-line map-node-label-line--amber" x1="0" y1="32" x2="0" y2="45" /><text class="node-name" y="58">LOD 规范补强</text></g>
                  </g>
                  <g class="map-node map-node--gray map-node--hex" transform="translate(456 172)">
                    <circle class="map-node-halo" r="32" /><circle class="map-node-ring" r="26" />
                    <polygon class="map-node-core map-node-hex" points="0,-24 22,-12 22,12 0,24 -22,12 -22,-12" fill="url(#sigGray)" filter="url(#sigShadow)" />
                    <path class="map-node-lock" d="M-5-2v-5a5 5 0 0110 0v5M-8-2h16v13H-8z" />
                    <g class="map-node-label"><line class="map-node-label-line" x1="0" y1="26" x2="0" y2="39" /><text class="node-name" y="52">参数化建模</text></g>
                  </g>
                  <g class="map-node map-node--gray map-node--diamond" transform="translate(660 104)">
                    <circle class="map-node-halo" r="30" /><circle class="map-node-ring" r="24" />
                    <polygon class="map-node-core map-node-diamond" points="0,-23 23,0 0,23 -23,0" fill="url(#sigGray)" filter="url(#sigShadow)" />
                    <g class="map-node-label"><line class="map-node-label-line" x1="0" y1="24" x2="0" y2="37" /><text class="node-name" y="50">模型协同</text></g>
                  </g>
                  <g class="mastery-badge reinforce-badge" transform="translate(170 157)"><rect width="126" height="67" rx="10"/><text x="14" y="22">本次评价掌握率</text><text class="mastery-value" x="14" y="51">{{ mastery }}%</text><path d="M126 53l18 12-21-1z"/></g>
                </g>

                <g v-show="activeDemo === 'expand'" class="expand-scene">
                  <path class="path-base" d="M82 315C166 283 218 288 302 247C389 204 452 217 528 170C606 122 680 135 770 79"/>
                  <path class="expand-main-signal" d="M82 315C166 283 218 288 302 247C389 204 452 217 528 170C606 122 680 135 770 79"/>
                  <path class="branch-base" d="M302 247L302 92"/><path class="branch-line" d="M302 247L302 92"/>
                  <g class="map-node map-node--green" transform="translate(82 315)">
                    <circle class="map-node-halo" r="32" /><circle class="map-node-ring" r="26" />
                    <circle class="map-node-core" r="21" fill="url(#sigGreen)" filter="url(#sigShadow)" />
                    <ellipse class="map-node-shine" cx="-7" cy="-9" rx="8" ry="5" transform="rotate(-24)" />
                    <path class="map-node-check" d="M-7 0l5 5L9-8" />
                    <g class="map-node-label"><line class="map-node-label-line" x1="0" y1="24" x2="0" y2="37" /><text class="node-name" y="50">BIM 基础概念</text></g>
                  </g>
                  <g class="expand-focus map-node--focus map-node--expand" transform="translate(302 247)">
                    <circle class="expand-halo" r="40" /><circle class="map-node-ring" r="30" />
                    <circle class="map-node-core" r="24" fill="url(#sigGreen)" filter="url(#sigShadow)" />
                    <circle class="expand-ring" r="35" />
                    <ellipse class="map-node-shine" cx="-8" cy="-10" rx="9" ry="5.5" transform="rotate(-24)" />
                    <path class="map-node-check" d="M-8 0l6 6L10-8" />
                    <g class="map-node-label"><line class="map-node-label-line map-node-label-line--focus" x1="0" y1="28" x2="0" y2="41" /><text class="node-name" y="54">模型精度</text></g>
                  </g>
                  <g class="map-node map-node--gray map-node--hex" transform="translate(528 170)">
                    <circle class="map-node-halo" r="32" /><circle class="map-node-ring" r="26" />
                    <polygon class="map-node-core map-node-hex" points="0,-24 22,-12 22,12 0,24 -22,12 -22,-12" fill="url(#sigGray)" filter="url(#sigShadow)" />
                    <g class="map-node-label"><line class="map-node-label-line" x1="0" y1="26" x2="0" y2="39" /><text class="node-name" y="52">参数化建模</text></g>
                  </g>
                  <g class="extension-node map-node--extension" transform="translate(302 92)">
                    <circle class="extension-halo" r="44" /><circle class="map-node-ring map-node-ring--blue" r="34" />
                    <polygon class="extension-blue map-node-hex-lg" points="0,-28 26,-14 26,14 0,28 -26,14 -26,-14" fill="url(#sigBlue)" filter="url(#sigShadow)" />
                    <polygon class="extension-green map-node-hex-lg" points="0,-28 26,-14 26,14 0,28 -26,14 -26,-14" fill="url(#sigGreen)" filter="url(#sigShadow)" />
                    <path class="extension-check" d="M-8 0l6 6L10-8" />
                    <g class="map-node-label">
                      <line class="map-node-label-line map-node-label-line--blue" x1="0" y1="32" x2="0" y2="45" />
                      <text class="node-name" y="58">拓展学习</text>
                      <text class="extension-sub" y="72">LOD 实战挑战</text>
                    </g>
                  </g>
                  <g class="mastery-badge expand-badge" transform="translate(344 193)"><rect width="154" height="58" rx="10"/><text x="13" y="20">评价掌握度</text><text class="mastery-value is-green" x="13" y="46">{{ mastery }}%</text><path class="left-arrow" d="M0 31l-18 13 21-2z"/></g>
                  <g class="extension-score" transform="translate(350 63)"><rect width="142" height="58" rx="10"/><text x="13" y="20">拓展评价完成</text><text x="13" y="46">92%</text><path d="M0 22L-18 29L0 36Z"/></g>
                </g>

                <g v-show="activeDemo === 'assistant'" class="assistant-path-scene">
                  <path class="assistant-path" d="M88 322C172 288 224 294 306 250C392 204 448 216 528 169C610 120 684 133 770 78"/>
                  <g class="assistant-node map-node--green" transform="translate(88 322)">
                    <circle class="map-node-halo" r="30" /><circle class="map-node-core" r="19" fill="url(#sigGreen)" filter="url(#sigShadow)" />
                    <ellipse class="map-node-shine" cx="-6" cy="-8" rx="7" ry="4.5" transform="rotate(-24)" />
                    <path class="map-node-check" d="M-7 0l5 5L9-8" />
                  </g>
                  <g class="assistant-node map-node--green map-node--focus-lite" transform="translate(306 250)">
                    <circle class="map-node-halo" r="34" /><circle class="map-node-ring" r="28" />
                    <circle class="map-node-core" r="22" fill="url(#sigGreen)" filter="url(#sigShadow)" />
                    <ellipse class="map-node-shine" cx="-7" cy="-9" rx="8" ry="5" transform="rotate(-24)" />
                    <path class="map-node-check" d="M-7 0l5 5L9-8" />
                  </g>
                  <g class="assistant-node map-node--blue map-node--hex" transform="translate(528 169)">
                    <circle class="map-node-halo map-node-halo--blue" r="32" /><circle class="map-node-ring map-node-ring--blue" r="26" />
                    <polygon class="map-node-core map-node-hex" points="0,-23 22,-11 22,11 0,23 -22,11 -22,-11" fill="url(#sigBlue)" filter="url(#sigShadow)" />
                    <ellipse class="map-node-shine" cx="-6" cy="-8" rx="7" ry="4.5" transform="rotate(-24)" />
                  </g>
                  <g class="assistant-node map-node--gray map-node--pending" transform="translate(770 78)">
                    <circle class="map-node-halo" r="28" /><circle class="map-node-core" r="18" fill="url(#sigGray)" filter="url(#sigShadow)" />
                    <ellipse class="map-node-shine" cx="-5" cy="-7" rx="6" ry="4" transform="rotate(-24)" />
                  </g>
                </g>
              </svg>

              <div class="data-pulse pulse-one" :class="{ 'is-live': activeDemo === 'reinforce' }"></div>
              <div class="data-pulse pulse-two" :class="{ 'is-live': activeDemo === 'reinforce' }"></div>
              <div v-show="activeDemo === 'assistant'" class="assistant-performance">
                <div class="assistant-bubble">
                  <div class="assistant-bubble__accent" aria-hidden="true"></div>
                  <div class="assistant-bubble__head">
                    <span class="assistant-bubble__badge" aria-hidden="true">
                      <svg viewBox="0 0 16 16" width="14" height="14"><path d="M8 1.2a.7.7 0 0 1 .68.54l.8 3.52 3.52.8a.7.7 0 0 1 0 1.36l-3.52.8-.8 3.52a.7.7 0 0 1-1.36 0l-.8-3.52-3.52-.8a.7.7 0 0 1 0-1.36l3.52-.8.8-3.52A.7.7 0 0 1 8 1.2Z" fill="currentColor"/></svg>
                      AI 学习助手
                    </span>
                  </div>
                  <p class="assistant-bubble__text">
                    <span v-if="!assistantText" class="typing-dots"><i></i><i></i><i></i></span>{{ assistantText }}<b class="typing-caret"></b>
                  </p>
                </div>
                <div class="assistant-avatar">
                  <span class="avatar-orbit orbit-one" aria-hidden="true"></span>
                  <span class="avatar-orbit orbit-two" aria-hidden="true"></span>
                  <div class="robot-face"><i></i><i></i></div>
                  <strong>AI 学习助手</strong>
                </div>
              </div>
            </div>

            <aside class="demo-panel" aria-label="路径能力">
              <div class="demo-panel__tabs" role="tablist" aria-label="路径能力">
                <button
                  v-for="demo in demos"
                  :key="demo.id"
                  type="button"
                  role="tab"
                  class="demo-tab"
                  :class="{ active: activeDemo === demo.id, complete: completedDemos.includes(demo.id) }"
                  :aria-selected="activeDemo === demo.id ? 'true' : 'false'"
                  @click="selectDemo(demo.id)"
                >
                  <span class="demo-tab__dot" aria-hidden="true"></span>
                  <strong>{{ demo.title }}</strong>
                </button>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { defineComponent, h, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { gsap } from 'gsap'
type DemoId='planning'|'reinforce'|'expand'|'assistant'
const AiGlyph=defineComponent({setup:()=>()=>h('span',{class:'ai-glyph','aria-hidden':'true'},[h('svg',{viewBox:'0 0 24 24'},[h('path',{d:'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1'}),h('circle',{cx:12,cy:12,r:4})])])})
const props=withDefaults(defineProps<{open:boolean;embedded?:boolean;presentationOnly?:boolean}>(),{embedded:false,presentationOnly:false});const emit=defineEmits<{close:[];enter:[]}>()
const mapMountainsStyle={backgroundImage:'url(assets/student/map-background-texture.png)'}
const modalRef=ref<HTMLElement|null>(null),activeDemo=ref<DemoId>('planning'),mastery=ref(0),assistantText=ref(''),completedDemos=ref<DemoId[]>([])
let timeline:gsap.core.Timeline|null=null,runToken=0,delayTimer:ReturnType<typeof setTimeout>|null=null
const demos=[
{id:'planning' as DemoId,title:'路径动态规划',summary:'知识图谱正在收敛为专属学习路径'},
{id:'reinforce' as DemoId,title:'路径动态补强',summary:'评价结果正在触发针对性补强'},
{id:'expand' as DemoId,title:'路径动态拓展',summary:'高掌握度正在解锁进阶分支'},
{id:'assistant' as DemoId,title:'AI 全过程辅助',summary:'AI 正在生成个性化学习建议'},]
const planningNodes=[
{id:'a',x:126,y:110,fx:72,fy:322,code:'概',label:'基础概念',fill:'url(#sigGreen)',tone:'green'},{id:'b',x:270,y:72,fx:228,fy:258,code:'规',label:'模型规范',fill:'url(#sigBlue)',tone:'blue'},{id:'c',x:402,y:126,fx:364,fy:210,code:'模',label:'精度建模',fill:'url(#sigAmber)',tone:'amber'},{id:'d',x:548,y:82,fx:502,fy:160,code:'族',label:'参数化族',fill:'url(#sigBlue)',tone:'blue'},{id:'e',x:692,y:134,fx:642,fy:108,code:'协',label:'模型协同',fill:'url(#sigGray)',tone:'gray'},{id:'f',x:220,y:276,fx:774,fy:62,code:'交',label:'数字交付',fill:'url(#sigGray)',tone:'gray'}]
const positionedNodes=[{sel:'.reinforce-scene>.map-node--green',t:'translate(70 320)'},{sel:'.focus-node',t:'translate(270 246)'},{sel:'.reinforce-node',t:'translate(382 199)'},{sel:'.reinforce-scene>.map-node--hex',t:'translate(456 172)'},{sel:'.reinforce-scene>.map-node--diamond',t:'translate(660 104)'},{sel:'.expand-scene>.map-node--green',t:'translate(82 315)'},{sel:'.expand-focus',t:'translate(302 247)'},{sel:'.expand-scene>.map-node--hex',t:'translate(528 170)'},{sel:'.extension-node',t:'translate(302 92)'},{sel:'.assistant-node.map-node--green:not(.map-node--focus-lite)',t:'translate(88 322)'},{sel:'.assistant-node.map-node--focus-lite',t:'translate(306 250)'},{sel:'.assistant-node.map-node--blue',t:'translate(528 169)'},{sel:'.assistant-node.map-node--pending',t:'translate(770 78)'}]
function q(){return gsap.utils.selector(modalRef.value!)}
function resetAll(){if(!modalRef.value)return;const s=q();mastery.value=0;assistantText.value='';gsap.set(s('.data-pulse,.path-signal,.insert-path,.reinforce-node,.reinforce-badge,.focus-red,.focus-halo,.mastery-ring,.branch-base,.branch-line,.extension-node,.expand-badge,.extension-score,.assistant-performance,.expand-main-signal,.assistant-path'),{autoAlpha:0});gsap.set(s('.planning-path'),{autoAlpha:0,strokeDashoffset:900});gsap.set(s('.scatter-label,.map-node-label'),{autoAlpha:0});gsap.set(s('.graph-edges'),{autoAlpha:1});planningNodes.forEach(n=>gsap.set(s(`.scatter-${n.id}`),{attr:{transform:`translate(${n.x} ${n.y})`},autoAlpha:1}));positionedNodes.forEach(({sel,t})=>gsap.set(s(sel),{attr:{transform:t}}));gsap.set(s('.focus-green'),{autoAlpha:1,scale:1,transformOrigin:'center'});gsap.set(s('.focus-red'),{autoAlpha:0,scale:.7,transformOrigin:'center'});gsap.set(s('.mastery-ring'),{strokeDashoffset:214});gsap.set(s('.path-signal,.expand-main-signal,.assistant-path'),{strokeDashoffset:760});gsap.set(s('.insert-path'),{strokeDashoffset:250});gsap.set(s('.reinforce-node,.extension-node'),{autoAlpha:0});gsap.set(s('.star-green,.star-check'),{autoAlpha:0,scale:1,transformOrigin:'center'});gsap.set(s('.star-amber'),{autoAlpha:1,scale:1,transformOrigin:'center'});gsap.set(s('.branch-base,.branch-line'),{strokeDashoffset:170});gsap.set(s('.extension-green,.extension-check,.extension-score'),{autoAlpha:0});gsap.set(s('.extension-blue'),{autoAlpha:1,scale:1,transformOrigin:'center'});gsap.set(s('.assistant-node'),{autoAlpha:1});gsap.set(s('.data-pulse'),{x:0,y:0,clearProps:'x,y'})}
function counter(value:number,duration:number){return gsap.to({v:0},{v:value,duration,ease:'power1.out',onUpdate(){mastery.value=Math.round(this.targets()[0].v)}})}
function playDemo(id:DemoId,token:number){return new Promise<void>(resolve=>{if(!modalRef.value||token!==runToken){resolve();return}const s=q(),d=matchMedia('(prefers-reduced-motion: reduce)').matches ? .06 : 1;timeline=gsap.timeline({defaults:{ease:'power3.out'},onComplete:resolve})
if(id==='planning'){timeline.to(s('.graph-edges'),{autoAlpha:.18,duration:.5*d});planningNodes.forEach((n,i)=>timeline!.to(s(`.scatter-${n.id}`),{attr:{transform:`translate(${n.fx} ${n.fy})`},duration:.75*d,ease:'power3.inOut'},i===0?'<':`<${.07}`));timeline.to(s('.graph-edges'),{autoAlpha:0,duration:.3*d},'<.2').to(s('.planning-path'),{autoAlpha:1,strokeDashoffset:0,duration:1.05*d,ease:'power2.inOut'},'<').to(s('.scatter-label'),{autoAlpha:1,duration:.38*d,ease:'back.out(1.4)',stagger:.07},'<.45')}
else if(id==='reinforce'){timeline.to(s('.map-node-label'),{autoAlpha:1,duration:.34*d,stagger:.05,ease:'power2.out'}).to(s('.path-signal'),{autoAlpha:1,strokeDashoffset:0,duration:.9*d,ease:'power1.inOut'},'<+.04').to(s('.focus-green'),{autoAlpha:0,scale:.72,duration:.35*d}).to(s('.focus-red'),{autoAlpha:1,scale:1,duration:.45*d},'<.06').to(s('.focus-halo,.mastery-ring,.reinforce-badge'),{autoAlpha:1,duration:.25*d},'<').add(counter(52,.7*d)).to(s('.mastery-ring'),{strokeDashoffset:103,duration:.7*d},'<').to(s('.data-pulse'),{autoAlpha:1,duration:.1*d}).to(s('.data-pulse'),{x:310,y:-120,duration:.8*d,stagger:.1,ease:'power2.inOut'},'<').to(s('.insert-path'),{autoAlpha:1,strokeDashoffset:0,duration:.5*d}).to(s('.reinforce-node'),{autoAlpha:1,duration:.58*d,ease:'power2.out'},'<.16').to(s('.star-amber'),{autoAlpha:0,scale:.7,duration:.28*d,transformOrigin:'center'},'>.35').to(s('.star-green,.star-check'),{autoAlpha:1,scale:1,duration:.36*d,transformOrigin:'center'},'<.05')}
else if(id==='expand'){timeline.to(s('.map-node-label'),{autoAlpha:1,duration:.34*d,stagger:.05,ease:'power2.out'}).to(s('.expand-main-signal'),{autoAlpha:1,strokeDashoffset:0,duration:.85*d,ease:'power1.inOut'},'<+.04').to(s('.expand-badge'),{autoAlpha:1,duration:.3*d}).add(counter(92,.75*d)).to(s('.expand-halo,.expand-ring'),{autoAlpha:1,duration:.28*d},'<').to(s('.branch-base,.branch-line'),{autoAlpha:1,strokeDashoffset:0,duration:.85*d,ease:'power2.inOut'},'<+.08').to(s('.extension-node'),{autoAlpha:1,duration:.58*d,ease:'power2.out'},'<.4').to({}, {duration:.6*d}).to(s('.extension-blue'),{autoAlpha:0,scale:.72,duration:.28*d,transformOrigin:'center'}).to(s('.extension-green,.extension-check'),{autoAlpha:1,scale:1,duration:.36*d,transformOrigin:'center'},'<.05').to(s('.extension-score'),{autoAlpha:1,duration:.32*d}).to({}, {duration:.6*d})}
else{const full='我已分析你的学习情况，推荐一个拓展学习节点，领先班级80%的同学哦！';const typing={v:0};timeline.to(s('.assistant-path'),{autoAlpha:1,strokeDashoffset:0,duration:.88*d,ease:'power2.inOut'}).to(s('.assistant-node'),{autoAlpha:1,duration:.42*d,stagger:.1,ease:'power2.out'},'-.55').to(s('.assistant-performance'),{autoAlpha:1,duration:.38*d}).fromTo(s('.assistant-avatar'),{scale:.65,y:18},{scale:1,y:0,duration:.62*d,ease:'back.out(1.8)'},'<').fromTo(s('.assistant-bubble'),{scale:.9,y:10,transformOrigin:'right bottom'},{scale:1,y:0,duration:.45*d},'<.2').to(typing,{v:full.length,duration:2.8*d,ease:'none',onUpdate(){assistantText.value=full.slice(0,Math.round(typing.v))}})}})}
function wait(ms:number){return new Promise<void>(resolve=>{delayTimer=setTimeout(()=>{delayTimer=null;resolve()},ms)})}
function stopPlayback(){runToken++;timeline?.kill();if(delayTimer)clearTimeout(delayTimer)}
async function selectDemo(id:DemoId){stopPlayback();const token=runToken;activeDemo.value=id;await nextTick();resetAll();await playDemo(id,token);if(token!==runToken)return;if(!completedDemos.value.includes(id))completedDemos.value=[...completedDemos.value,id]}
async function autoplay(){const token=++runToken;timeline?.kill();if(delayTimer)clearTimeout(delayTimer);completedDemos.value=[];for(const demo of demos){if(token!==runToken||!props.open)return;activeDemo.value=demo.id;await nextTick();resetAll();await playDemo(demo.id,token);if(token!==runToken)return;completedDemos.value=[...completedDemos.value,demo.id];if(demo.id!=='assistant')await wait(700)}}
watch(()=>props.open,async value=>{if(!value){stopPlayback();return}await nextTick();if(props.presentationOnly){completedDemos.value=[];await selectDemo('planning')}else{autoplay()}},{immediate:true})
onBeforeUnmount(()=>{stopPlayback()})
</script><style scoped>
.signature-overlay{position:fixed;z-index:2000;inset:0;display:grid;place-items:center;padding:24px;font-family:var(--font-sans,"Geist","PingFang SC","Microsoft YaHei",sans-serif)}.signature-backdrop{position:absolute;inset:0;width:100%;height:100%;border:0;background:linear-gradient(135deg,rgba(15,23,42,.36),rgba(30,79,215,.16)),rgba(248,250,252,.34);backdrop-filter:blur(18px) saturate(118%);-webkit-backdrop-filter:blur(18px) saturate(118%)}.signature-card{position:relative;width:min(1180px,calc(100vw - 48px));max-height:calc(100dvh - 48px);overflow:auto;border:1px solid rgba(255,255,255,.72);border-radius:22px;background:linear-gradient(145deg,rgba(255,255,255,.82),rgba(245,248,255,.62));box-shadow:0 32px 90px rgba(15,23,42,.22),0 0 0 1px rgba(118,86,216,.08),inset 0 1px 0 rgba(255,255,255,.88);backdrop-filter:blur(24px) saturate(125%);-webkit-backdrop-filter:blur(24px) saturate(125%)}.signature-card::before{content:"";position:absolute;inset:0 0 auto;height:88px;pointer-events:none;background:radial-gradient(circle at 18% 0,rgba(25,182,200,.22),transparent 34%),radial-gradient(circle at 72% 0,rgba(118,86,216,.18),transparent 30%)}.signature-card::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:linear-gradient(115deg,transparent 0 36%,rgba(255,255,255,.38) 45%,transparent 55%);opacity:.42}
.signature-overlay.is-embedded{position:relative;z-index:1;inset:auto;display:block;width:100%;height:100%;padding:0}.signature-overlay.is-embedded .signature-card{width:100%;height:100%;max-height:none;border-radius:22px;box-shadow:0 20px 60px rgba(57,72,130,.12),inset 0 1px #fff}.signature-overlay.is-embedded .signature-body{min-height:calc(100dvh - 104px)}.signature-overlay.is-embedded .map-stage{min-height:calc(100dvh - 104px)}
.signature-overlay.is-presentation-only .signature-card{border:0;border-radius:16px;background:transparent;box-shadow:none;backdrop-filter:none}.signature-overlay.is-presentation-only .signature-card::before,.signature-overlay.is-presentation-only .signature-card::after{display:none}.signature-overlay.is-presentation-only .signature-body{display:grid;grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) auto;min-height:0;height:100%}.signature-overlay.is-presentation-only .map-stage{min-height:0;border-right:0}.signature-overlay.is-presentation-only .demo-panel{padding:12px 14px 14px;border-top:1px solid rgba(221,227,236,.72)}.signature-overlay.is-presentation-only .demo-panel__tabs{grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.signature-overlay.is-embedded.is-presentation-only .signature-body,.signature-overlay.is-embedded.is-presentation-only .map-stage{min-height:0;height:100%}
.signature-header{position:relative;z-index:1;display:flex;justify-content:space-between;gap:28px;padding:22px 28px 18px;border-bottom:1px solid rgba(221,227,236,.72)}.eyebrow,.lead,.signature-header h1,.demo-panel p{margin:0}.eyebrow{display:flex;align-items:center;gap:8px;color:var(--color-ai-text,#5937b4);font-size:12px;font-weight:700}.signature-header h1{max-width:820px;margin-top:6px;color:var(--color-text,#0f172a);font-size:clamp(25px,3vw,36px);line-height:1.16;letter-spacing:0}.lead{max-width:800px;margin-top:7px;color:var(--color-text-muted,#64748b);font-size:14px;line-height:22px}.ai-glyph{display:inline-grid;place-items:center;width:24px;height:24px;border:1px solid var(--color-ai-border,#dcd4f5);border-radius:7px;color:var(--color-ai,#7656d8);background:linear-gradient(145deg,rgba(243,240,252,.96),rgba(232,250,249,.72));box-shadow:0 0 18px rgba(118,86,216,.16)}.ai-glyph svg{width:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round}.icon-button{flex:0 0 auto;display:grid;place-items:center;width:40px;height:40px;padding:0;border:1px solid rgba(221,227,236,.82);border-radius:10px;color:#64748b;background:rgba(255,255,255,.58);box-shadow:inset 0 1px 0 rgba(255,255,255,.9);backdrop-filter:blur(12px);cursor:pointer}.icon-button svg{width:19px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
.signature-body{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1fr) 218px;min-height:520px}.map-stage{position:relative;min-width:0;min-height:520px;overflow:hidden;border-right:1px solid rgba(221,227,236,.72);background:linear-gradient(135deg,rgba(255,255,255,.38),rgba(237,244,255,.28))}.map-mountains{position:absolute;inset:0;background-position:center;background-size:cover;background-repeat:no-repeat;opacity:.56;filter:saturate(.9) contrast(.98)}.map-wash{position:absolute;inset:0;background:radial-gradient(circle at 26% 72%,rgba(25,182,200,.18),transparent 28%),radial-gradient(circle at 68% 22%,rgba(118,86,216,.16),transparent 28%),linear-gradient(90deg,rgba(255,255,255,.5),rgba(237,244,245,.08))}.map-grid{position:absolute;inset:0;opacity:.2;background-image:linear-gradient(rgba(30,79,215,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(25,182,200,.12) 1px,transparent 1px);background-size:32px 32px;mask-image:linear-gradient(to right,#000,transparent 94%);animation:grid-breathe 7s ease-in-out infinite}.learning-map{position:absolute;z-index:2;inset:50% auto auto 50%;width:min(100%,820px);transform:translate(-50%,-50%);overflow:visible;will-change:transform,opacity}
.graph-edges path{fill:none;stroke:#7c8f96;stroke-width:1.4;stroke-dasharray:4 6}.planning-path,.path-base,.path-signal,.insert-path,.expand-main-signal,.branch-base,.branch-line,.assistant-path{fill:none;stroke-linecap:round}.planning-path{stroke:#10b981;stroke-width:5;stroke-dasharray:900;filter:url(#sigGlow)}.path-base{stroke:rgba(100,116,139,.36);stroke-width:4}.path-signal,.expand-main-signal,.assistant-path{stroke:#10b981;stroke-width:6;stroke-dasharray:760;filter:url(#sigGlow)}.insert-path{stroke:#f59e0b;stroke-width:5;stroke-dasharray:250}.branch-base{stroke:rgba(59,130,246,.22);stroke-width:12;stroke-dasharray:170}.branch-line{stroke:#2563eb;stroke-width:6;stroke-dasharray:170;filter:url(#sigGlow)}
.scatter-node .scatter-halo{fill:none;stroke-width:1.2;opacity:.9}.scatter-node .scatter-ring{fill:none;stroke:rgba(255,255,255,.86);stroke-width:1.5;stroke-dasharray:5 7;opacity:.94}.scatter-node .scatter-core{stroke:rgba(255,255,255,.52);stroke-width:1.6}.scatter-node .scatter-shine{fill:rgba(255,255,255,.44);pointer-events:none}.scatter-label-line{stroke-width:1.5;stroke-linecap:round;opacity:.55}.scatter-node--green .scatter-label-line{stroke:#34d399}.scatter-node--blue .scatter-label-line{stroke:#60a5fa}.scatter-node--amber .scatter-label-line{stroke:#fbbf24}.scatter-node--gray .scatter-label-line{stroke:#94a3b8}.scatter-node--green .scatter-halo{stroke:rgba(52,211,153,.42);fill:rgba(16,185,129,.11)}.scatter-node--blue .scatter-halo{stroke:rgba(96,165,250,.4);fill:rgba(59,130,246,.1)}.scatter-node--amber .scatter-halo{stroke:rgba(251,191,36,.42);fill:rgba(245,158,11,.1)}.scatter-node--gray .scatter-halo{stroke:rgba(148,163,184,.38);fill:rgba(100,116,139,.08)}.scatter-a .scatter-halo{r:36;stroke-width:1.5;fill:rgba(16,185,129,.15);stroke:rgba(16,185,129,.48);filter:url(#sigScatterGlow)}.scatter-a .scatter-core{r:22;stroke:rgba(255,255,255,.72);stroke-width:2;filter:url(#sigShadow)}.scatter-a .scatter-ring{stroke:rgba(255,255,255,.95);stroke-width:1.6;stroke-dasharray:3 5}.scatter-a .scatter-shine{fill:rgba(255,255,255,.52);rx:10;ry:6}.scatter-a .scatter-label-line{stroke:#10b981;opacity:.72;stroke-width:1.6}.scatter-a .planned-label{fill:#047857!important;font-weight:700}.scatter-node text,.map-node text,.node-name{fill:#24343b;font-size:12px;font-weight:700;text-anchor:middle}.scatter-code,.node-index{fill:#fff!important;font-size:12px!important;font-weight:800;text-anchor:middle;dominant-baseline:central;letter-spacing:.03em;paint-order:stroke fill;stroke:rgba(15,23,42,.12);stroke-width:.6px}.node-orbit{fill:none;stroke:rgba(255,255,255,.75);stroke-width:1.5}.planned-label{font-size:12px!important;fill:#475569!important;font-weight:600;text-anchor:middle;dominant-baseline:central;paint-order:stroke fill;stroke:rgba(255,255,255,.92);stroke-width:3.5px;stroke-linejoin:round}.map-node-halo{fill:none;stroke-width:1.2;opacity:.88}.map-node--green .map-node-halo{stroke:rgba(52,211,153,.4);fill:rgba(16,185,129,.1)}.map-node--blue .map-node-halo,.map-node-halo--blue{stroke:rgba(96,165,250,.4);fill:rgba(59,130,246,.1)}.map-node--gray .map-node-halo{stroke:rgba(148,163,184,.36);fill:rgba(100,116,139,.08)}.map-node-ring{fill:none;stroke:rgba(255,255,255,.84);stroke-width:1.4;stroke-dasharray:4 6;opacity:.92}.map-node-ring--amber{stroke:rgba(251,191,36,.55)}.map-node-ring--blue{stroke:rgba(96,165,250,.55)}.map-node-core{stroke:rgba(255,255,255,.58);stroke-width:1.5}.map-node-shine{fill:rgba(255,255,255,.42);pointer-events:none}.map-node-check,.star-check,.extension-check{fill:none;stroke:#fff;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.map-node-lock{fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round}.map-node-label-line{stroke-width:1.5;stroke-linecap:round;opacity:.58}.map-node--green .map-node-label-line,.map-node-label-line--focus{stroke:#34d399}.map-node-label-line--amber{stroke:#fbbf24;opacity:.68}.map-node-label-line--blue{stroke:#60a5fa;opacity:.68}.map-node--gray .map-node-label-line{stroke:#94a3b8}.node-name{font-size:12px!important;fill:#475569!important;font-weight:600;text-anchor:middle;dominant-baseline:central;paint-order:stroke fill;stroke:rgba(255,255,255,.92);stroke-width:3.5px;stroke-linejoin:round}.focus-node .node-name,.reinforce-node .node-name,.extension-node .node-name{font-weight:700}.focus-node .node-name{fill:#334155!important}.reinforce-node .node-name{fill:#b45309!important}.extension-node .node-name{fill:#1d4ed8!important}.map-node--reinforce .reinforce-halo{fill:rgba(245,158,11,.13);stroke:rgba(245,158,11,.44);stroke-width:1.5;filter:url(#sigScatterGlow)}.map-node-star{stroke:rgba(255,255,255,.55);stroke-width:1.2}.focus-node .focus-halo{fill:rgba(239,68,68,.12);stroke:rgba(239,68,68,.42);stroke-width:1.5;filter:url(#sigScatterGlow)}.map-node--expand .expand-halo{fill:rgba(16,185,129,.13);stroke:rgba(16,185,129,.4);stroke-width:1.5;filter:url(#sigScatterGlow)}.map-node--extension .extension-halo{fill:rgba(59,130,246,.12);stroke:rgba(59,130,246,.38);stroke-width:1.5;filter:url(#sigScatterGlow)}.map-node--hex .map-node-hex,.map-node--diamond .map-node-diamond{stroke:rgba(255,255,255,.5);stroke-width:1.4}.map-node--pending .map-node-core{opacity:.82}.assistant-node .map-node-core{filter:url(#sigShadow)}.assistant-node.map-node--focus-lite .map-node-halo{stroke:rgba(52,211,153,.48);fill:rgba(16,185,129,.12)}.focus-halo{fill:rgba(239,68,68,.13);stroke:rgba(239,68,68,.4);stroke-width:1.5}.reinforce-halo{fill:rgba(245,158,11,.14);stroke:rgba(245,158,11,.42);stroke-width:1.5}.ring-bg,.mastery-ring,.expand-ring{fill:none;stroke-width:4}.ring-bg{stroke:rgba(239,68,68,.17)}.mastery-ring{stroke:#ef4444;stroke-dasharray:214;stroke-linecap:round;transform:rotate(-90deg);transform-origin:center}.expand-ring{stroke:#10b981;stroke-dasharray:180 40}.expand-halo{fill:rgba(16,185,129,.12);stroke:rgba(16,185,129,.38)}.extension-halo{fill:rgba(59,130,246,.12);stroke:rgba(59,130,246,.36)}.extension-sub{fill:#64748b!important;font-size:12px!important;font-weight:500;text-anchor:middle;dominant-baseline:central;paint-order:stroke fill;stroke:rgba(255,255,255,.9);stroke-width:3px}
.mastery-badge rect,.extension-score rect{fill:rgba(255,255,255,.97);stroke-width:1;filter:drop-shadow(0 4px 14px rgba(15,23,42,.08))}.mastery-badge path,.extension-score path{fill:rgba(255,255,255,.97)}.reinforce-badge rect{stroke:rgba(254,202,202,.85)}.expand-badge rect{stroke:rgba(167,243,208,.88)}.extension-score rect{stroke:rgba(191,219,254,.88)}.mastery-badge text,.extension-score text{fill:#64748b;font-size:12px;font-weight:500}.mastery-badge .mastery-value{fill:#dc2626;font-size:23px;font-weight:800;letter-spacing:-.02em}.mastery-badge .is-green,.extension-score text:nth-of-type(2){fill:#059669;font-size:22px;font-weight:800;letter-spacing:-.02em}.data-pulse{position:absolute;z-index:4;left:31%;top:55%;width:7px;height:7px;border-radius:50%;background:#34d399;box-shadow:0 0 0 5px rgba(52,211,153,.12),0 0 18px #10b981;opacity:0;transition:opacity .2s}.data-pulse.is-live{opacity:1}.pulse-two{width:4px;height:4px;left:33%;top:53%}
.demo-panel{display:flex;flex-direction:column;padding:26px 14px 18px;background:linear-gradient(180deg,rgba(255,255,255,.64),rgba(248,250,255,.42));backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}.demo-panel__tabs{display:grid;margin:0;padding:0;list-style:none}.demo-tab{position:relative;display:grid;grid-template-columns:10px 1fr;align-items:center;gap:10px;min-height:66px;padding:8px 10px;border:0;background:transparent;color:#94a3b8;text-align:left;cursor:pointer;font:inherit;transition:background .25s ease,color .25s ease,box-shadow .25s ease,transform .25s ease}.demo-tab__dot{width:6px;height:6px;border-radius:50%;background:#cbd5e1;transition:background .25s ease,box-shadow .25s ease}.demo-tab strong{font-size:14px;font-weight:600}.demo-tab.active{color:var(--color-ai-text,#5937b4);background:linear-gradient(90deg,rgba(243,240,252,.86),transparent)}.demo-tab.active:before{content:"";position:absolute;left:0;top:14px;bottom:14px;width:3px;border-radius:3px;background:var(--color-ai,#7656d8)}.demo-tab.active .demo-tab__dot{background:var(--color-ai,#7656d8);box-shadow:0 0 0 5px rgba(118,86,216,.1),0 0 16px rgba(118,86,216,.22)}.demo-tab.complete{color:#334155}.demo-tab.complete.active{color:#059669;background:linear-gradient(90deg,#ecfdf5,transparent)}.demo-tab.complete.active:before{background:#10b981}.demo-tab.complete .demo-tab__dot{position:relative;width:16px;height:16px;background:#10b981;box-shadow:none}.demo-tab.complete .demo-tab__dot:after{content:"";position:absolute;left:5px;top:3px;width:4px;height:7px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg)}.demo-tab:focus-visible{outline:3px solid rgba(30,79,215,.25);outline-offset:2px}
.assistant-performance{position:absolute;z-index:8;right:40px;bottom:34px;width:min(360px,48%);height:220px}.assistant-bubble{position:absolute;top:0;right:0;width:100%;padding:1px;border-radius:18px 18px 6px 18px;background:linear-gradient(135deg,rgba(167,139,250,.55),rgba(125,211,252,.45) 42%,rgba(255,255,255,.35) 72%,rgba(52,211,153,.35));box-shadow:0 20px 48px rgba(87,90,255,.14),0 8px 24px rgba(15,23,42,.08),inset 0 1px 0 rgba(255,255,255,.65)}.assistant-bubble:before{content:"";position:absolute;right:28px;bottom:-7px;width:14px;height:14px;background:linear-gradient(135deg,rgba(255,255,255,.96),rgba(248,250,255,.88));border-right:1px solid rgba(255,255,255,.75);border-bottom:1px solid rgba(221,227,240,.55);transform:rotate(45deg);box-shadow:4px 4px 12px rgba(87,90,255,.08);z-index:0}.assistant-bubble__accent{position:absolute;inset:1px;border-radius:17px 17px 5px 17px;background:linear-gradient(90deg,rgba(118,86,216,.28),rgba(25,182,200,.22) 52%,rgba(52,211,153,.12));opacity:.55;pointer-events:none}.assistant-bubble__head{position:relative;z-index:1;display:flex;align-items:center;padding:11px 14px 0}.assistant-bubble__badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px 4px 8px;border-radius:100px;border:1px solid rgba(255,255,255,.72);background:rgba(255,255,255,.62);color:#5b3fd4;font-size:12px;font-weight:600;line-height:1.2;letter-spacing:.01em;box-shadow:0 2px 8px rgba(118,86,216,.1)}.assistant-bubble__badge svg{flex-shrink:0;color:#7656d8}.assistant-bubble__text{position:relative;z-index:1;margin:0;padding:10px 14px 14px;color:#334155;font-size:12px;line-height:1.72;letter-spacing:.01em}.assistant-bubble__text:before{content:"";position:absolute;inset:0;border-radius:0 0 5px 17px;background:linear-gradient(180deg,rgba(255,255,255,.78) 0%,rgba(255,255,255,.94) 18%,rgba(248,250,255,.92) 100%);backdrop-filter:blur(20px) saturate(140%);-webkit-backdrop-filter:blur(20px) saturate(140%);z-index:-1}.typing-dots{display:inline-flex;gap:4px;vertical-align:middle;margin-right:2px}.typing-dots i{width:5px;height:5px;border-radius:50%;background:linear-gradient(180deg,#7656d8,#575aff);box-shadow:0 0 6px rgba(87,90,255,.35);animation:dot-bounce .8s infinite alternate}.typing-dots i:nth-child(2){animation-delay:.15s}.typing-dots i:nth-child(3){animation-delay:.3s}.typing-caret{display:inline-block;width:2px;height:12px;margin-left:2px;border-radius:1px;background:linear-gradient(180deg,#7656d8,#575aff);vertical-align:-2px;animation:caret-blink .7s steps(1) infinite}.assistant-avatar{position:absolute;right:2px;bottom:0;display:grid;justify-items:center;width:82px;height:96px;z-index:2}.robot-face{position:relative;z-index:3;display:grid;grid-template-columns:repeat(2,6px);place-content:center;gap:7px;width:50px;height:50px;border:4px solid rgba(255,255,255,.88);border-radius:16px;background:linear-gradient(145deg,#1a2744 0%,#2d4070 52%,#3b5088 100%);box-shadow:0 10px 28px rgba(49,46,129,.26),0 0 32px rgba(25,182,200,.18),inset 0 1px 0 rgba(255,255,255,.12)}.robot-face:before{content:"";position:absolute;inset:3px;border-radius:12px;background:linear-gradient(180deg,rgba(255,255,255,.08),transparent 48%);pointer-events:none}.robot-face i{width:6px;height:8px;border-radius:5px;background:linear-gradient(180deg,#b8fff5,#56e8d1);box-shadow:0 0 10px rgba(86,232,209,.75)}.assistant-avatar strong{position:relative;z-index:3;margin-top:6px;color:#5b3fd4;font-size:12px;font-weight:600;letter-spacing:.02em;text-shadow:0 1px 0 rgba(255,255,255,.8)}.avatar-orbit{position:absolute;z-index:1;top:-4px;width:64px;height:64px;border:1px solid rgba(118,86,216,.32);border-radius:50%;box-shadow:0 0 20px rgba(118,86,216,.08);animation:sig-orbit 9s linear infinite}.orbit-two{top:-10px;width:78px;height:78px;border-color:rgba(25,182,200,.22);box-shadow:0 0 24px rgba(25,182,200,.06);animation:sig-orbit 13s linear infinite reverse}
.signature-modal-enter-active,.signature-modal-leave-active{transition:opacity .28s}.signature-modal-enter-active .signature-card,.signature-modal-leave-active .signature-card{transition:transform .34s cubic-bezier(.2,.8,.2,1),opacity .28s}.signature-modal-enter-from,.signature-modal-leave-to{opacity:0}.signature-modal-enter-from .signature-card,.signature-modal-leave-to .signature-card{opacity:0;transform:translateY(18px) scale(.98)}button:focus-visible{outline:3px solid rgba(30,79,215,.25);outline-offset:2px}@keyframes sig-spin{to{transform:rotate(360deg)}}@keyframes sig-orbit{to{transform:rotate(360deg)}}@keyframes grid-breathe{0%,100%{opacity:.16}50%{opacity:.24}}@keyframes dot-bounce{to{transform:translateY(-4px);opacity:.45}}@keyframes caret-blink{50%{opacity:0}}
@media(max-width:880px){.signature-body{grid-template-columns:1fr}.map-stage{min-height:430px;border-right:0}.demo-panel{padding:8px 14px;border-top:1px solid #e2e8f0}.demo-panel__tabs{grid-template-columns:repeat(4,1fr)}.demo-tab{min-height:46px;border-bottom:0;padding:6px}.demo-tab strong{font-size:12px}.assistant-performance{right:24px;bottom:24px;width:65%}}
@media(max-width:620px){.signature-overlay{padding:10px}.signature-card{width:calc(100vw - 20px);max-height:calc(100dvh - 20px)}.signature-header{padding:18px 16px 14px}.signature-header h1{font-size:23px}.lead{display:none}.map-stage{min-height:360px}.learning-map{width:760px;transform:translate(-43%,-50%) scale(.72)}.demo-tab{grid-template-columns:6px 1fr}.demo-tab strong{font-size:12px}.assistant-performance{right:12px;bottom:14px;width:78%;transform:scale(.82);transform-origin:right bottom}.assistant-bubble__text{font-size:12px}}
@media(prefers-reduced-motion:reduce){.typing-dots i,.typing-caret,.avatar-orbit,.map-grid{animation:none}.signature-modal-enter-active,.signature-modal-leave-active,.signature-modal-enter-active .signature-card,.signature-modal-leave-active .signature-card{transition-duration:.01ms}}
</style>
