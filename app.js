import { removeBackground as imglyRemoveBackground } from "https://esm.sh/@imgly/background-removal@1.7.0?target=es2022";


const $ = s => document.querySelector(s);
let enhancementBusy = false;

// Keep enhancement single-threaded and prevent accidental double-clicks.
const enhanceButtonGuard = document.createElement("style");
enhanceButtonGuard.textContent = ".enhance-processing{opacity:.6!important;pointer-events:none!important}";
document.head.appendChild(enhanceButtonGuard);
const $$ = s => [...document.querySelectorAll(s)];

const fileInput=$("#fileInput"), chooseBtn=$("#chooseBtn"), dropZone=$("#dropZone");
const workspace=$("#workspace"), canvas=$("#canvas"), ctx=canvas.getContext("2d"), canvasWrap=$("#canvasWrap");
const originalCompareCanvas=$("#originalCompareCanvas"), enhancedCompareCanvas=$("#enhancedCompareCanvas");
const originalCompareCtx=originalCompareCanvas?.getContext("2d"), enhancedCompareCtx=enhancedCompareCanvas?.getContext("2d");
const statusEl=$("#status"), processing=$("#processing"), processingText=$("#processingText"), processingSub=$("#processingSub");
let original=null, current=null, processed=null, zoom=1, rotation=0, bg="transparent", format="png", scale=2, showBefore=false;
let recentItems=[], activeRecentId=null;
let adjustments={brightness:100,contrast:100,saturation:100,blur:0,grayscale:0};
let viewMode="fit";
let enhancementBaseline=null;
let enhancementScale=1;
let landingMode=(document.body.dataset.page==="enhance") ? "enhance" : "remove";

function setLandingMode(mode){
  landingMode=mode;
  const removeBtn=$("#modeRemoveTop"), enhanceBtn=$("#modeEnhanceTop");
  removeBtn?.classList.toggle("active",mode==="remove");
  enhanceBtn?.classList.toggle("active",mode==="enhance");
  removeBtn?.setAttribute("aria-selected",String(mode==="remove"));
  enhanceBtn?.setAttribute("aria-selected",String(mode==="enhance"));
  $$(".mode-card").forEach(card=>card.classList.toggle("active",card.dataset.mode===mode));
  $$(".header-mode-btn").forEach(btn=>{
    const active=btn.dataset.mode===mode;
    btn.classList.toggle("active",active);
    btn.setAttribute("aria-selected",String(active));
  });
  const title=$("#landingTitle"), desc=$("#landingDescription"), status=$("#uploadStatus");
  if(mode==="enhance"){
    title.innerHTML="Enhance Your<br>Image";
    desc.textContent="Improve image quality with fast 2× and 4× enhancement.";
    if(status) status.textContent="Fast image enhancement";
  }else{
    title.innerHTML="Remove Image<br>Background";
    desc.textContent="Remove backgrounds automatically with fast AI.";
    if(status) status.textContent="Fast automatic background removal";
  }
}
$("#modeRemoveTop")?.addEventListener("click",()=>setLandingMode("remove"));
$("#modeEnhanceTop")?.addEventListener("click",()=>setLandingMode("enhance"));

$("#modeCardRemove")?.addEventListener("click",()=>setLandingMode("remove"));
$("#modeCardEnhance")?.addEventListener("click",()=>setLandingMode("enhance"));
setLandingMode((document.body.dataset.page==="enhance") ? "enhance" : "remove");

chooseBtn.addEventListener("click",()=>fileInput.click());
fileInput.addEventListener("change",e=>e.target.files[0]&&loadFile(e.target.files[0]));
// Reliable drag & drop for the landing page and editor canvas.
// We handle external file drops in capture phase so the browser never navigates
// to the dropped image.
let dragDepth=0;
function isImageFile(file){
  return !!file && (
    /^image\/(jpeg|png|webp)$/i.test(file.type) ||
    /\.(jpe?g|png|webp)$/i.test(file.name||"")
  );
}
function hasFileDrag(e){
  return !!(e.dataTransfer && Array.from(e.dataTransfer.types||[]).includes("Files"));
}
function clearDragUI(){
  dropZone?.classList.remove("drag");
  canvasWrap?.classList.remove("drop-active");
  dragDepth=0;
}
document.addEventListener("dragenter",e=>{
  if(!hasFileDrag(e))return;
  e.preventDefault();
  dragDepth++;
  if(document.body.classList.contains("editor-mode")) canvasWrap?.classList.add("drop-active");
  else dropZone?.classList.add("drag");
},true);
document.addEventListener("dragover",e=>{
  if(!hasFileDrag(e))return;
  e.preventDefault();
  e.stopPropagation();
  try{e.dataTransfer.dropEffect="copy"}catch(_){}
  if(document.body.classList.contains("editor-mode")) canvasWrap?.classList.add("drop-active");
  else dropZone?.classList.add("drag");
},true);
document.addEventListener("dragleave",e=>{
  if(!hasFileDrag(e))return;
  e.preventDefault();
  dragDepth=Math.max(0,dragDepth-1);
  if(dragDepth===0)clearDragUI();
},true);
document.addEventListener("drop",e=>{
  if(!hasFileDrag(e))return;
  e.preventDefault();
  e.stopPropagation();
  const file=e.dataTransfer.files?.[0];
  clearDragUI();
  if(isImageFile(file)) loadFile(file);
  else alert("Please drop a JPG, PNG or WEBP image.");
},true);

function makeId(){ return "img_"+Date.now()+"_"+Math.random().toString(36).slice(2,8); }

function snapshotImage(img, done){
  const c=document.createElement("canvas");
  c.width=img.naturalWidth||img.width; c.height=img.naturalHeight||img.height;
  const x=c.getContext("2d"); x.drawImage(img,0,0,c.width,c.height);
  done(c.toDataURL("image/png"));
}

function addRecentItem(file, img){
  const item={id:makeId(),name:file?.name||"Edited image",originalSrc:"",currentSrc:"",adjustments:{...adjustments},bg,rotation,scale,processing:true};
  snapshotImage(img, src=>{
    item.originalSrc=src; item.currentSrc=src;
    recentItems.unshift(item);
    activeRecentId=item.id;
    renderRecent();
  });
}

function saveActiveToRecent(){
  if(!activeRecentId || !current) return;
  const item=recentItems.find(x=>x.id===activeRecentId);
  if(!item) return;
  snapshotImage(current, src=>{
    item.currentSrc=src;
    item.processing=false;
    item.adjustments={...adjustments};
    item.bg=bg; item.rotation=rotation; item.scale=scale;
    renderRecent();
  });
}

function renderRecent(){
  const section=$("#recentSection"), strip=$("#recentStrip");
  if(!section||!strip) return;
  section.classList.toggle("hidden", false);
  const countEl=$("#recentCount"); if(countEl) countEl.textContent=`${recentItems.length} ${recentItems.length===1?"item":"items"}`;
  strip.innerHTML="";
  const q=(($("#recentSearch")?.value)||"").trim().toLowerCase();
  const visibleItems=recentItems.filter(item=>!q || item.name.toLowerCase().includes(q));
  visibleItems.forEach(item=>{
    const card=document.createElement("button");
    card.type="button";
    card.className="recent-card"+(item.id===activeRecentId?" active":"");
    card.title="Open "+item.name;
    card.innerHTML=`<div class="recent-thumb"><img alt=""><span class="recent-processing ${item.processing?"show":""}">Processing…</span></div><div class="recent-name"></div><div class="recent-meta">${item.processing?"AI background removal":"Processed • Click to edit"}</div>`;
    card.querySelector("img").src=item.currentSrc; card.querySelector("img").style.objectFit="contain"; card.querySelector("img").style.objectPosition="center";
    card.querySelector(".recent-name").textContent=item.name;
    card.addEventListener("click",()=>{
      if(item.processing){ statusEl.textContent="Please wait for background removal to finish"; return; }
      openRecent(item.id);
    });
    strip.appendChild(card);
  });
}

function openRecent(id){
  const item=recentItems.find(x=>x.id===id);
  if(!item) return;
  activeRecentId=id;
  const im=new Image();
  im.onload=()=>{
    current=im;
    processed=im;
    bg=item.bg || "transparent";
    viewMode="fit"; zoom=1;
    const orig=new Image();
    orig.onload=()=>{
      original=orig;
      adjustments={...item.adjustments};
      bg=item.bg||"transparent"; rotation=item.rotation||0; scale=item.scale||2; zoom=1;
      syncAdjustmentUI(); syncBackgroundUI(); syncScaleUI();
      enterEditor();
      $("#afterBtn").click();
      renderRecent();
      render();
      workspace.scrollIntoView({behavior:"smooth",block:"start"});
      statusEl.textContent="Editing "+item.name;
    };
    orig.src=item.originalSrc;
  };
  im.src=item.currentSrc;
}

function syncAdjustmentUI(){
  ["brightness","contrast","saturation","blur","grayscale"].forEach(k=>{
    const el=$("#"+k), out=$("#"+k+"Value");
    if(!el||!out)return;
    el.value=adjustments[k];
    out.textContent=k==="blur"?adjustments[k]+"px":adjustments[k]+"%";
  });
}

function syncBackgroundUI(){
  $$("[data-bg]").forEach(x=>x.classList.toggle("selected",x.dataset.bg===bg));
  if(bg && bg!=="transparent" && !$$("[data-bg]").some(x=>x.dataset.bg===bg)){
    if(bg.startsWith("#") && $("#bgColor")){
      $("#bgColor").value=bg;
      $("#bgColor").closest(".bg-tile")?.classList.add("selected");
    }
  }
}

function syncScaleUI(){
  $$("[data-scale]").forEach(x=>x.classList.toggle("selected",+x.dataset.scale===scale));
}


// First-page drag & drop: bind to the upload card, landing page, and document.
// This prevents child elements or browser default navigation from swallowing the drop.
function bindLandingDrop(){
  const landing=document.querySelector(".landing");
  const targets=[dropZone,landing,document].filter(Boolean);
  targets.forEach(target=>{
    target.addEventListener("dragover",e=>{
      if(!e.dataTransfer || !Array.from(e.dataTransfer.types||[]).includes("Files")) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect="copy";
      dropZone?.classList.add("drag");
    }, true);
    target.addEventListener("dragenter",e=>{
      if(!e.dataTransfer || !Array.from(e.dataTransfer.types||[]).includes("Files")) return;
      e.preventDefault();
      e.stopPropagation();
      dropZone?.classList.add("drag");
    }, true);
    target.addEventListener("dragleave",e=>{
      if(!e.dataTransfer || !Array.from(e.dataTransfer.types||[]).includes("Files")) return;
      e.preventDefault();
      e.stopPropagation();
      if(dropZone && !dropZone.contains(e.relatedTarget)) dropZone.classList.remove("drag");
    }, true);
    target.addEventListener("drop",e=>{
      if(!e.dataTransfer || !e.dataTransfer.files?.length) return;
      e.preventDefault();
      e.stopPropagation();
      dropZone?.classList.remove("drag");
      const file=e.dataTransfer.files[0];
      if(file && (/^image\//i.test(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name||""))){
        loadFile(file);
      }else{
        alert("Please drop a JPG, PNG or WEBP image.");
      }
    }, true);
  });
}
bindLandingDrop();

function enterEditor(){
  document.body.classList.add("editor-mode");
  workspace.classList.remove("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
}

function loadFile(file){
  landingMode=(document.body.dataset.page==="enhance") ? "enhance" : "remove";
  const validType = /^image\/(jpeg|png|webp)$/i.test(file.type);
const validName = /\.(jpe?g|png|webp)$/i.test(file.name || "");
if(!validType && !validName){
  alert("Please choose a JPG, PNG or WEBP image.");
  return;
}
  const r=new FileReader();
  r.onload=async()=>{
    const im=new Image();
    im.onload=async()=>{
      original=im; current=im; processed=null; rotation=0; zoom=1; bg="transparent"; viewMode="fit";
      adjustments={brightness:100,contrast:100,saturation:100,blur:0,grayscale:0};
      syncAdjustmentUI();
      // Show a clean processing state first; the editor appears after AI removal.
      enterEditor();
      if(landingMode==="enhance") {
        const et=document.querySelector('.editor-tab[data-panel="design"]');
        if(et) et.click();
      }
      // Show the uploaded image immediately in the center while AI processing starts.
      statusEl.textContent="Preparing image…";
      render();
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        const center=$("#canvasWrap");
        if(center) center.scrollIntoView({behavior:"smooth",block:"center"});
      }));
      addRecentItem(file,im);
      if(landingMode==="enhance"){
        processed=im;
        current=im;
        hideProcessing();
        statusEl.textContent="Image ready • Choose 2× or 4× Enhance";
        const active=recentItems.find(x=>x.id===activeRecentId); if(active) active.processing=false;
        render();
        saveActiveToRecent();
      }else{
        showProcessing("Removing background…","Fast AI mode • first use downloads a small model");
        try{
          await removeBackground();
        }catch(err){
          console.error(err);
          hideProcessing();
          statusEl.textContent="Could not remove background";
        }
      }
    };
    im.onerror=()=>alert("The selected image could not be opened.");
    im.src=r.result;
  };
  r.readAsDataURL(file);
}

function showProcessing(title,sub){processing.classList.remove("hidden");processingText.textContent=title;processingSub.textContent=sub}
function hideProcessing(){processing.classList.add("hidden")}

function fillCanvasBackground(context, value, width, height){
  if(!value || value==="transparent") return;
  if(typeof value === "string" && value.startsWith("linear-gradient")){
    const m=value.match(/linear-gradient\(\s*([0-9]+)deg\s*,\s*([^,]+)\s*,\s*([^\)]+)\)/i);
    if(m){
      const deg=(Number(m[1])-90)*Math.PI/180;
      const cx=width/2, cy=height/2;
      const len=Math.sqrt(width*width+height*height)/2;
      const x1=cx-Math.cos(deg)*len, y1=cy-Math.sin(deg)*len;
      const x2=cx+Math.cos(deg)*len, y2=cy+Math.sin(deg)*len;
      const g=context.createLinearGradient(x1,y1,x2,y2); g.addColorStop(0,m[2].trim()); g.addColorStop(1,m[3].trim());
      context.fillStyle=g; context.fillRect(0,0,width,height); return;
    }
  }
  context.fillStyle=value; context.fillRect(0,0,width,height);
}

function renderEnhancerCompare(){
  if(document.body.dataset.page!=="enhance" || !originalCompareCanvas || !enhancedCompareCanvas || !original) return;
  const left=original;
  const right=current||original;
  const draw=(c,im,enhanced=false)=>{
    const w=im.naturalWidth||im.width, h=im.naturalHeight||im.height;
    const maxW=520, maxH=500;
    const ratio=Math.min(1,maxW/w,maxH/h);
    c.width=Math.max(1,Math.round(w*ratio)); c.height=Math.max(1,Math.round(h*ratio));
    const x=c.getContext("2d"); x.clearRect(0,0,c.width,c.height);
    x.fillStyle="#fff"; x.fillRect(0,0,c.width,c.height);
    x.save();
    if(enhanced) x.filter=`brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) blur(${adjustments.blur}px) grayscale(${adjustments.grayscale}%)`;
    x.imageSmoothingEnabled=true; x.imageSmoothingQuality="high";
    x.drawImage(im,0,0,c.width,c.height); x.restore();
  };
  draw(originalCompareCanvas,left,false);
  draw(enhancedCompareCanvas,right,true);
  const factor=enhancementScale||1;
  const fl=document.querySelector('#enhancedFactorLabel'); if(fl) fl.textContent=factor>1?`${factor}×`:'Preview';
  const res=document.querySelector('#enhanceResolution');
  if(res){ const w=right.naturalWidth||right.width,h=right.naturalHeight||right.height; res.textContent=`${w} × ${h}px`; }
}

function render(){
  if(!current)return;
  renderEnhancerCompare();
  const w=current.naturalWidth||current.width,h=current.naturalHeight||current.height;
  const portrait=rotation%180!==0;
  canvas.width=portrait?h:w; canvas.height=portrait?w:h;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(bg!=="transparent") fillCanvasBackground(ctx,bg,canvas.width,canvas.height);
  ctx.save();
  ctx.filter=`brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) blur(${adjustments.blur}px) grayscale(${adjustments.grayscale}%)`;
  ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(rotation*Math.PI/180);
  ctx.drawImage(current,-w/2,-h/2,w,h);ctx.restore();
  ctx.filter="none";
  canvas.style.width=`${canvas.width}px`;
  canvas.style.height=`${canvas.height}px`;
  canvas.style.maxWidth="calc(100vw - 390px)";
  canvas.style.maxHeight="calc(100vh - 190px)";
  canvas.style.transform=`scale(${zoom})`;

  // Keep the selected background visible behind the cutout as well as in
  // the exported canvas. This makes every background tile immediately
  // visible, even when the PNG contains transparent pixels.
  if(bg==="transparent"){
    canvas.style.backgroundColor="transparent";
    canvas.style.backgroundImage="linear-gradient(45deg,#e2e5e7 25%,transparent 25%),linear-gradient(-45deg,#e2e5e7 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e2e5e7 75%),linear-gradient(-45deg,transparent 75%,#e2e5e7 75%)";
    canvas.style.backgroundSize="24px 24px";
    canvas.style.backgroundPosition="0 0,0 12px,12px -12px,-12px 0";
  }else{
    canvas.style.backgroundImage="none";
    canvas.style.backgroundColor=(typeof bg==="string" && bg.startsWith("#")) ? bg : "transparent";
  }
  canvasWrap?.style.setProperty("--image-ratio", `${canvas.width}/${canvas.height}`);
}

$$("[data-bg]").forEach(b=>b.addEventListener("click",()=>{
  bg=b.dataset.bg;
  $$("[data-bg]").forEach(x=>x.classList.remove("selected"));
  b.classList.add("selected");
  saveActiveToRecent();
  render();
}));
$("#bgColor").addEventListener("input",e=>{
  bg=e.target.value;
  $$("[data-bg]").forEach(x=>x.classList.remove("selected"));
  $("#bgColor").closest(".bg-tile").classList.add("selected");
  saveActiveToRecent();
  render();
});
$$("[data-scale]").forEach(b=>b.addEventListener("click",()=>{scale=+b.dataset.scale;$$("[data-scale]").forEach(x=>x.classList.remove("selected"));b.classList.add("selected")}));
$$("[data-format]").forEach(b=>b.addEventListener("click",()=>{
  format=b.dataset.format;
  $$("[data-format]").forEach(x=>x.classList.remove("selected"));
  $$("[data-format]").filter(x=>x.dataset.format===format).forEach(x=>x.classList.add("selected"));
  const dl=$("#downloadBtn");
  if(dl) dl.title=`Download ${format.toUpperCase()}`;
}));
$$("[data-bg-group]").forEach(tab=>tab.addEventListener("click",()=>{
  const group=tab.dataset.bgGroup;
  $$('[data-bg-group]').forEach(x=>x.classList.toggle('active',x.dataset.bgGroup===group));
  $$('[data-bg-group-panel]').forEach(x=>x.classList.toggle('active',x.dataset.bgGroupPanel===group));
}));

$("#rotateLeft").addEventListener("click",()=>{rotation=(rotation+270)%360;render();saveActiveToRecent()});
$("#rotateRight").addEventListener("click",()=>{rotation=(rotation+90)%360;render();saveActiveToRecent()});
$("#resetRotate").addEventListener("click",()=>{rotation=0;zoom=1;const zl=$("#zoomLabel"); if(zl) zl.textContent="100%";render();saveActiveToRecent()});
$("#zoomIn").addEventListener("click",()=>{zoom=Math.min(2,zoom+.1);$("#zoomLabel").textContent=Math.round(zoom*100)+"%";render()});
$("#zoomOut").addEventListener("click",()=>{zoom=Math.max(.5,zoom-.1);$("#zoomLabel").textContent=Math.round(zoom*100)+"%";render()});

$("#beforeBtn").addEventListener("click",()=>{showBefore=true;$("#beforeBtn").classList.add("selected");$("#afterBtn").classList.remove("selected");current=original;render()});
$("#afterBtn").addEventListener("click",()=>{showBefore=false;$("#afterBtn").classList.add("selected");$("#beforeBtn").classList.remove("selected");current=processed||original;render()});

$$(".tool").forEach(b=>b.addEventListener("click",async()=>{
  $$(".tool").forEach(x=>x.classList.remove("active"));b.classList.add("active");
  if(!original)return;
  if(b.dataset.tool==="remove") await removeBackground();
  else await enhance();
}));

async function removeBackground(){
  if(!original) return;
  showProcessing("Loading AI background remover...","First use may download the AI model");
  try{
    const resultBlob = await removeBackgroundAI(original, (current,total)=>{
      if(total){ const pct=Math.round(current/total*100); processingSub.textContent=`AI model: ${pct}%`; }
    });
    const url = URL.createObjectURL(resultBlob);
    const out = new Image();
    out.onload = ()=>{
      current=out;
      processed=out;
      showBefore=false;
      $("#afterBtn").classList.add("selected");
      $("#beforeBtn").classList.remove("selected");
      hideProcessing();
      statusEl.textContent="Background removed";
      bg="transparent";
      // Background Remover opens directly on the Background tools after the cutout is ready.
      const bgTab=document.querySelector('.editor-tab[data-panel="background"]');
      if(bgTab) bgTab.click();
      const active=recentItems.find(x=>x.id===activeRecentId);
      if(active) active.processing=false;
      render();
      if(typeof saveActiveToRecent==="function") saveActiveToRecent();
    };
    out.onerror=()=>{ throw new Error("The AI result could not be loaded."); };
    out.src=url;
  }catch(err){
    console.error(err);
    hideProcessing();
    statusEl.textContent="Background removal failed";
    const active=recentItems.find(x=>x.id===activeRecentId);
    if(active) active.processing=false;
    renderRecent();
    alert("AI background removal could not be completed. Please try again or use a smaller image.");
    throw err;
  }
}

async function removeBackgroundAI(im, progress){
  if(typeof imglyRemoveBackground !== "function"){
    throw new Error("AI background-removal module did not load.");
  }

  // Convert the HTMLImageElement to a real PNG Blob before passing it
  // to the neural-network library. This avoids input-type incompatibilities.
  const sourceCanvas=document.createElement("canvas");
  const maxSide=1024;
  const ratio=Math.min(1,maxSide/Math.max(im.naturalWidth,im.naturalHeight));
  sourceCanvas.width=Math.max(1,Math.round(im.naturalWidth*ratio));
  sourceCanvas.height=Math.max(1,Math.round(im.naturalHeight*ratio));
  const sourceCtx=sourceCanvas.getContext("2d",{willReadFrequently:false});
  sourceCtx.drawImage(im,0,0,sourceCanvas.width,sourceCanvas.height);

  const inputBlob=await new Promise((resolve,reject)=>{
    sourceCanvas.toBlob(blob=>{
      if(blob) resolve(blob);
      else reject(new Error("Could not prepare image for AI processing."));
    },"image/png");
  });

  const baseConfig={
    publicPath:"https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/",
    model:"isnet_quint8",
    output:{format:"image/png",quality:0.9,type:"foreground"},
    debug:false,
    progress:(key,current,total)=>{
      if(progress) progress(current,total);
    }
  };
  let blob;
  try{
    // WebGPU can be much faster on supported browsers/devices.
    blob=await imglyRemoveBackground(inputBlob,{...baseConfig,device:"cpu"});
  }catch(gpuError){
    console.warn("AI warm-up/model initialization will use CPU mode.",gpuError);
    blob=await imglyRemoveBackground(inputBlob,{...baseConfig,device:"cpu"});
  }

  if(!(blob instanceof Blob) || blob.size===0){
    throw new Error("AI model returned an empty image.");
  }
  return blob;
}

async function enhance(){
  if(!current || enhancementBusy) return;
  enhancementBusy=true;
  const source=current;
  const factor=scale===4?4:2;
  enhancementBaseline=current;
  showBefore=false;
  if($("#afterBtn")) $("#afterBtn").click();
  showProcessing(`Enhancing image ${factor}×…`,"Fast browser enhancement");
  await new Promise(requestAnimationFrame);

  const sw=source.naturalWidth||source.width;
  const sh=source.naturalHeight||source.height;

  // Cap processing work so large photos do not freeze low-RAM PCs.
  const MAX_PIXELS=3000000;
  const pixels=sw*sh;
  const k=pixels>MAX_PIXELS ? Math.sqrt(MAX_PIXELS/pixels) : 1;
  const ww=Math.max(1,Math.round(sw*k));
  const wh=Math.max(1,Math.round(sh*k));

  const work=document.createElement("canvas");
  work.width=ww; work.height=wh;
  const wx=work.getContext("2d");
  wx.imageSmoothingEnabled=true;
  wx.imageSmoothingQuality="high";
  wx.filter="contrast(1.06) saturate(1.05) brightness(1.01)";
  wx.drawImage(source,0,0,ww,wh);
  wx.filter="none";

  // Export at a practical maximum while preserving the requested 2x/4x ratio
  // as much as possible without allocating huge canvases.
  const MAX_OUTPUT=4096;
  const ow=Math.min(Math.max(1,Math.round(sw*factor)),MAX_OUTPUT);
  const oh=Math.min(Math.max(1,Math.round(sh*factor)),MAX_OUTPUT);

  const out=document.createElement("canvas");
  out.width=ow; out.height=oh;
  const ox=out.getContext("2d");
  ox.imageSmoothingEnabled=true;
  ox.imageSmoothingQuality="high";
  ox.filter="contrast(1.06) saturate(1.05) brightness(1.01)";
  ox.drawImage(work,0,0,ow,oh);
  ox.filter="none";

  await new Promise(requestAnimationFrame);

  const outImg=new Image();
  outImg.src=out.toDataURL("image/jpeg",.94);
  await outImg.decode();

  current=outImg;
  processed=outImg;
  enhancementScale=factor;
  showBefore=false;
  const ef=document.querySelector("#enhancedFactorLabel");
  if(ef) ef.textContent=`${factor}×`;
  hideProcessing();
  statusEl.textContent=`Enhanced ${factor}× • Fast detail improvement`;
  renderEnhancerCompare();
  render();
  saveActiveToRecent();
  enhancementBusy=false;
}

async function aiEnhance(){
  if(!current || enhancementBusy) return;
  enhancementBusy=true;
  showBefore=false;
  if($("#afterBtn")) $("#afterBtn").click();
  showProcessing("AI Enhance…","Smart clarity, lighting and color optimization");
  await new Promise(requestAnimationFrame);

  const source=current;
  const sw=source.naturalWidth||source.width;
  const sh=source.naturalHeight||source.height;
  const MAX_PIXELS=2500000;
  const pixels=sw*sh;
  const k=pixels>MAX_PIXELS ? Math.sqrt(MAX_PIXELS/pixels) : 1;
  const ww=Math.max(1,Math.round(sw*k));
  const wh=Math.max(1,Math.round(sh*k));

  const out=document.createElement("canvas");
  out.width=ww; out.height=wh;
  const x=out.getContext("2d");
  x.imageSmoothingEnabled=true;
  x.imageSmoothingQuality="high";
  // Fast local smart-enhancement pipeline. It is intentionally lightweight
  // so the browser remains responsive on low-RAM computers.
  x.filter="contrast(1.10) saturate(1.08) brightness(1.025)";
  x.drawImage(source,0,0,ww,wh);
  x.filter="none";

  // Tiny unsharp pass only for manageable images.
  if(ww*wh<=1800000){
    const image=x.getImageData(0,0,ww,wh);
    const d=image.data, copy=new Uint8ClampedArray(d);
    for(let y=1;y<wh-1;y++){
      for(let xx=1;xx<ww-1;xx++){
        const p=(y*ww+xx)*4;
        for(let c=0;c<3;c++){
          const avg=(copy[p-4+c]+copy[p+4+c]+copy[p-ww*4+c]+copy[p+ww*4+c])/4;
          d[p+c]=Math.max(0,Math.min(255,copy[p+c]+(copy[p+c]-avg)*0.22));
        }
      }
    }
    x.putImageData(image,0,0);
  }

  await new Promise(requestAnimationFrame);
  const outImg=new Image();
  outImg.src=out.toDataURL("image/jpeg",.95);
  await outImg.decode();
  current=outImg;
  processed=outImg;
  enhancementScale=1;
  const ef=document.querySelector("#enhancedFactorLabel");
  if(ef) ef.textContent="AI";
  hideProcessing();
  statusEl.textContent="AI Enhance complete • Smart clarity + color";
  renderEnhancerCompare();
  render();
  saveActiveToRecent();
  enhancementBusy=false;
}

$("#downloadBtn").addEventListener("click",()=>{
  if(!current)return;
  const c=document.createElement("canvas"),w=current.naturalWidth||current.width,h=current.naturalHeight||current.height;
  c.width=rotation%180?h:w;c.height=rotation%180?w:h;const x=c.getContext("2d");
  if(format==="jpg"){fillCanvasBackground(x,bg==="transparent"?"#ffffff":bg,c.width,c.height)} else if(bg!=="transparent"){fillCanvasBackground(x,bg,c.width,c.height)}
  x.save();x.filter=`brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) blur(${adjustments.blur}px) grayscale(${adjustments.grayscale}%)`;x.translate(c.width/2,c.height/2);x.rotate(rotation*Math.PI/180);x.drawImage(current,-w/2,-h/2,w,h);x.restore();x.filter="none";
  const a=document.createElement("a");a.href=c.toDataURL(format==="jpg"?"image/jpeg":"image/png",.95);a.download=`palia-image-studio-edited.${format}`;document.body.appendChild(a);a.click();a.remove();
});


["brightness","contrast","saturation","blur","grayscale"].forEach(k=>{
  const el=$("#"+k), out=$("#"+k+"Value");
  if(!el)return;
  el.addEventListener("input",()=>{
    adjustments[k]=+el.value;
    out.textContent=k==="blur"?adjustments[k]+"px":adjustments[k]+"%";
    render();
    clearTimeout(el._saveTimer);
    el._saveTimer=setTimeout(saveActiveToRecent,250);
  });
});

$("#resetAdjustments").addEventListener("click",()=>{
  adjustments={brightness:100,contrast:100,saturation:100,blur:0,grayscale:0};
  syncAdjustmentUI(); render(); saveActiveToRecent();
});



// Top editor navigation: show the corresponding side panel.
$$(".editor-tab").forEach(tab=>tab.addEventListener("click",()=>{
  $$(".editor-tab").forEach(t=>t.classList.remove("active"));
  tab.classList.add("active");
  const target=tab.dataset.panel;
  $$("[data-panel-content]").forEach(p=>p.classList.toggle("hidden",p.dataset.panelContent!==target));
}));

$("#removeBgTop").addEventListener("click",async()=>{
  if(!original)return;
  try{await removeBackground();}catch(e){}
});
$("#enhance2").addEventListener("click",async()=>{scale=2;await enhance()});
$("#enhance4").addEventListener("click",async()=>{scale=4;await enhance()}); $("#aiEnhanceBtn")?.addEventListener("click",aiEnhance);

$("#undoBtn").addEventListener("click",()=>{
  if(!original)return;
  current=original; showBefore=true;
  $("#beforeBtn").classList.add("selected"); $("#afterBtn").classList.remove("selected");
  statusEl.textContent="Showing original";
  render();
});
$("#redoBtn").addEventListener("click",()=>{
  if(!processed)return;
  current=processed; showBefore=false;
  $("#afterBtn").classList.add("selected"); $("#beforeBtn").classList.remove("selected");
  statusEl.textContent="Showing edited result";
  render();
});

$("#recentStrip").addEventListener("click",e=>{
  const card=e.target.closest(".recent-card");
  if(!card)return;
});
$("#newImageCard").addEventListener("click",()=>fileInput.click());

$("#aboutBtn").addEventListener("click",()=>alert("Palia Image Studio\nBy Hafsa Traders\n\nAI background removal, background colors, adjustments and image enhancement."));

$("#aboutBtn").addEventListener("click",()=>alert("Palia Image Studio\nBy Hafsa Traders\n\nA browser-based image editing studio."));


window.addEventListener("error", e => {
  if (e && e.message) console.error("Palia Image Studio:", e.message);
});


canvasWrap?.addEventListener("wheel",e=>{
  if(!e.ctrlKey && !e.metaKey) return;
  e.preventDefault();
  zoom=Math.max(.5,Math.min(3,zoom+(e.deltaY<0?.1:-.1)));
  const zl=$("#zoomLabel"); if(zl) zl.textContent=Math.round(zoom*100)+"%";
  render();
},{passive:false});

// Keep all recent thumbnails fitted inside their tiles.

// Initial state: show the upload screen and keep the editor/recent area hidden.
workspace.classList.add("hidden");




function applyHomeMode(mode){
  document.querySelectorAll(".header-mode-btn").forEach(btn=>{
    const active=btn.dataset.mode===mode;
    btn.classList.toggle("active",active);
    btn.setAttribute("aria-selected",active?"true":"false");
  });
  document.querySelectorAll(".mode-card").forEach(card=>{
    const active=card.dataset.mode===mode;
    card.classList.toggle("active",active);
    card.setAttribute("aria-hidden",active?"false":"true");
  });

  const title=document.querySelector("[data-home-title]");
  const desc=document.querySelector("[data-home-desc]");
  const status=document.querySelector("[data-upload-status]");
  const upload=document.querySelector(".upload-card");
  if(mode==="enhance"){
    if(title) title.textContent="Enhance Your Image";
    if(desc) desc.textContent="Improve image quality with fast 2× and 4× enhancement.";
    if(status) status.textContent="Fast image enhancement";
    if(upload) upload.dataset.mode="enhance";
  }else{
    if(title) title.textContent="Remove Image Background";
    if(desc) desc.textContent="Remove backgrounds automatically with fast AI.";
    if(status) status.textContent="Fast automatic background removal";
    if(upload) upload.dataset.mode="remove";
  }
}
// Dedicated pages use normal links. The current page decides the workflow.
applyHomeMode(document.body.dataset.page==="enhance" ? "enhance" : "remove");

document.querySelectorAll(".mode-card").forEach(card=>{
  card.addEventListener("click",()=>{
    const mode=card.dataset.mode;
    if(mode) applyHomeMode(mode);
  });
});


/* Reliable canvas zoom controls */
(function setupZoomControls(){
  let zoomLevel = 1;
  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 4;

  function getCanvas(){
    return document.querySelector("#editorCanvas, #canvas, canvas.editor-canvas, .editor-canvas-area canvas") ||
           document.querySelector(".editor-canvas-area canvas");
  }

  function applyZoom(){
    const canvas = getCanvas();
    if(!canvas) return;

    canvas.style.transformOrigin = "center center";
    canvas.style.transform = `scale(${zoomLevel})`;
    canvas.style.transition = "transform .12s ease";

    document.querySelectorAll("[data-zoom-value], #zoomValue, .zoom-value").forEach(el=>{
      el.textContent = Math.round(zoomLevel * 100) + "%";
    });
  }

  function changeZoom(delta){
    zoomLevel = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(zoomLevel + delta).toFixed(2)));
    applyZoom();
  }

  function resetZoom(){
    zoomLevel = 1;
    applyZoom();
  }

  document.addEventListener("click", e=>{
    const btn=e.target.closest("[data-zoom], #zoomInBtn, #zoomOutBtn, #zoomResetBtn");
    if(!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const action=btn.dataset.zoom || btn.id;
    if(action==="in" || action==="zoomIn" || action==="zoomInBtn") changeZoom(.25);
    else if(action==="out" || action==="zoomOut" || action==="zoomOutBtn") changeZoom(-.25);
    else if(action==="reset" || action==="zoomReset" || action==="zoomResetBtn") resetZoom();
  }, true);

  document.addEventListener("wheel", e=>{
    const area=e.target.closest(".editor-canvas-area");
    if(!area || !e.ctrlKey) return;
    e.preventDefault();
    changeZoom(e.deltaY < 0 ? .1 : -.1);
  }, {passive:false});

  window.addEventListener("resize", applyZoom);
  window.PaliaZoom = {applyZoom, changeZoom, resetZoom};
  setTimeout(applyZoom, 100);
  setTimeout(applyZoom, 500);
})();
