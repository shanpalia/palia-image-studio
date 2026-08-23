import { removeBackground as imglyRemoveBackground } from "https://esm.sh/@imgly/background-removal@1.7.0?target=es2022";
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const fileInput=$("#fileInput"), chooseBtn=$("#chooseBtn"), dropZone=$("#dropZone");
const workspace=$("#workspace"), canvas=$("#canvas"), ctx=canvas.getContext("2d");
const statusEl=$("#status"), processing=$("#processing"), processingText=$("#processingText"), processingSub=$("#processingSub");
let original=null, current=null, zoom=1, rotation=0, bg="transparent", format="png", scale=2, showBefore=false;
let recentItems=[], activeRecentId=null;
let adjustments={brightness:100,contrast:100,saturation:100,blur:0,grayscale:0};
let viewMode="fit";

chooseBtn.addEventListener("click",()=>fileInput.click());
fileInput.addEventListener("change",e=>e.target.files[0]&&loadFile(e.target.files[0]));
// Robust drag & drop support for desktop browsers and GitHub Pages.
let dragDepth = 0;

function hasFiles(e){
  return e.dataTransfer && e.dataTransfer.types &&
    Array.from(e.dataTransfer.types).includes("Files");
}

document.addEventListener("dragenter", e => {
  if(!hasFiles(e)) return;
  e.preventDefault();
  dragDepth++;
  dropZone.classList.add("drag");
});

document.addEventListener("dragover", e => {
  if(!hasFiles(e)) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
  dropZone.classList.add("drag");
});

document.addEventListener("dragleave", e => {
  if(!hasFiles(e)) return;
  e.preventDefault();
  dragDepth = Math.max(0, dragDepth - 1);
  if(dragDepth === 0) dropZone.classList.remove("drag");
});

document.addEventListener("drop", e => {
  if(!hasFiles(e)) return;
  e.preventDefault();
  dragDepth = 0;
  dropZone.classList.remove("drag");

  const files = e.dataTransfer.files;
  if(files && files.length){
    loadFile(files[0]);
  }
});

// Also support dropping directly on the upload card.
dropZone.addEventListener("drop", e => {
  e.preventDefault();
  e.stopPropagation();
  dragDepth = 0;
  dropZone.classList.remove("drag");
  if(e.dataTransfer.files && e.dataTransfer.files.length){
    loadFile(e.dataTransfer.files[0]);
  }
});


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
  const newCard=document.createElement("button");
  newCard.type="button"; newCard.className="recent-card new-image-card"; newCard.id="newImageCard";
  newCard.innerHTML='<div class="new-image-plus">+</div><strong>New Image</strong><span>Click or Drop</span>';
  newCard.addEventListener("click",()=>fileInput.click());
  strip.appendChild(newCard);
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
    bg=item.bg || "transparent";
    viewMode="fit"; zoom=1;
    const orig=new Image();
    orig.onload=()=>{
      original=orig;
      adjustments={...item.adjustments};
      bg=item.bg||"transparent"; rotation=item.rotation||0; scale=item.scale||2; zoom=1;
      syncAdjustmentUI(); syncBackgroundUI(); syncScaleUI();
      workspace.classList.remove("hidden");
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
    $("#bgColor").value=bg;
    $("#bgColor").closest(".bg-tile").classList.add("selected");
  }
}

function syncScaleUI(){
  $$("[data-scale]").forEach(x=>x.classList.toggle("selected",+x.dataset.scale===scale));
}

function loadFile(file){
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
      original=im; current=im; rotation=0; zoom=1; bg="transparent"; viewMode="fit";
      adjustments={brightness:100,contrast:100,saturation:100,blur:0,grayscale:0};
      syncAdjustmentUI();
      // Show a clean processing state first; the editor appears after AI removal.
      workspace.classList.remove("hidden");
      workspace.scrollIntoView({behavior:"smooth",block:"start"});
      // Show the uploaded image immediately in the center while AI processing starts.
      statusEl.textContent="Preparing image…";
      render();
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        const center=$("#canvasWrap");
        if(center) center.scrollIntoView({behavior:"smooth",block:"center"});
      }));
      showProcessing("Removing background…","Fast AI mode • first use downloads a small model");
      addRecentItem(file,im);
      try{
        await removeBackground();
      }catch(err){
        console.error(err);
        hideProcessing();
        statusEl.textContent="Could not remove background";
      }
    };
    im.onerror=()=>alert("The selected image could not be opened.");
    im.src=r.result;
  };
  r.readAsDataURL(file);
}

function showProcessing(title,sub){processing.classList.remove("hidden");processingText.textContent=title;processingSub.textContent=sub}
function hideProcessing(){processing.classList.add("hidden")}

function render(){
  if(!current)return;
  const w=current.naturalWidth||current.width,h=current.naturalHeight||current.height;
  const portrait=rotation%180!==0;
  canvas.width=portrait?h:w; canvas.height=portrait?w:h;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(bg!=="transparent"){ctx.fillStyle=bg==="white"?"#fff":bg==="black"?"#000":bg;ctx.fillRect(0,0,canvas.width,canvas.height)}
  ctx.save();
  ctx.filter=`brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) blur(${adjustments.blur}px) grayscale(${adjustments.grayscale}%)`;
  ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(rotation*Math.PI/180);
  ctx.drawImage(current,-w/2,-h/2,w,h);ctx.restore();
  ctx.filter="none";
  if(viewMode==="fit"){
    canvas.style.width="auto"; canvas.style.height="auto"; canvas.style.maxWidth="94%"; canvas.style.maxHeight="500px";
  }else{
    canvas.style.width="100%"; canvas.style.height="500px"; canvas.style.maxWidth="none"; canvas.style.maxHeight="none";
  }
  canvas.style.transform=`scale(${zoom})`;
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
$$("[data-format]").forEach(b=>b.addEventListener("click",()=>{format=b.dataset.format;$$("[data-format]").forEach(x=>x.classList.remove("selected"));b.classList.add("selected")}));

$("#rotateLeft").addEventListener("click",()=>{rotation=(rotation+270)%360;render();saveActiveToRecent()});
$("#rotateRight").addEventListener("click",()=>{rotation=(rotation+90)%360;render();saveActiveToRecent()});
$("#resetRotate").addEventListener("click",()=>{rotation=0;zoom=1;$("#zoomLabel").textContent="100%";render();saveActiveToRecent()});
$("#zoomIn").addEventListener("click",()=>{zoom=Math.min(2,zoom+.1);$("#zoomLabel").textContent=Math.round(zoom*100)+"%";render()});
$("#zoomOut").addEventListener("click",()=>{zoom=Math.max(.5,zoom-.1);$("#zoomLabel").textContent=Math.round(zoom*100)+"%";render()});

$("#beforeBtn").addEventListener("click",()=>{showBefore=true;$("#beforeBtn").classList.add("selected");$("#afterBtn").classList.remove("selected");current=original;render()});
$("#afterBtn").addEventListener("click",()=>{showBefore=false;$("#afterBtn").classList.add("selected");$("#beforeBtn").classList.remove("selected");current=original;render()});

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
      showBefore=false;
      $("#afterBtn").classList.add("selected");
      $("#beforeBtn").classList.remove("selected");
      hideProcessing();
      statusEl.textContent="Background removed";
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
  const maxSide=1280;
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
    blob=await imglyRemoveBackground(inputBlob,{...baseConfig,device:"gpu"});
  }catch(gpuError){
    console.warn("GPU background removal unavailable, using CPU fallback.",gpuError);
    blob=await imglyRemoveBackground(inputBlob,{...baseConfig,device:"cpu"});
  }

  if(!(blob instanceof Blob) || blob.size===0){
    throw new Error("AI model returned an empty image.");
  }
  return blob;
}

async function enhance(){
  if(showBefore){showBefore=false;current=original;$("#afterBtn").click()}
  showProcessing("Enhancing image...",scale+"× output");
  await new Promise(r=>setTimeout(r,250));
  // High-quality canvas resampling; this is real upscaling, not a fake result.
  const c=document.createElement("canvas");c.width=(current.naturalWidth||current.width)*scale;c.height=(current.naturalHeight||current.height)*scale;
  const x=c.getContext("2d");x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";x.drawImage(current,0,0,c.width,c.height);
  const out=new Image();out.src=c.toDataURL("image/png");await out.decode();current=out;
  hideProcessing();statusEl.textContent=`Enhanced ${scale}×`;render();saveActiveToRecent();
}

$("#downloadBtn").addEventListener("click",()=>{
  if(!current)return;
  const c=document.createElement("canvas"),w=current.naturalWidth||current.width,h=current.naturalHeight||current.height;
  c.width=rotation%180?h:w;c.height=rotation%180?w:h;const x=c.getContext("2d");
  if(format==="jpg"){x.fillStyle=bg==="transparent"?"#fff":bg;x.fillRect(0,0,c.width,c.height)}
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


$("#recentSearch").addEventListener("input",()=>renderRecent());
$("#gridViewBtn").addEventListener("click",()=>{
  $("#recentStrip").classList.toggle("list-view");
});

$("#cropBtn").addEventListener("click",()=>{
  alert("Crop tool: use Fit/Fill for the current canvas view. A full freeform crop can be added without changing the original image.");
});
$("#sharpenBtn").addEventListener("click",()=>{
  // Small contrast/saturation boost as a real canvas-based sharpening-style preset.
  adjustments.contrast=Math.min(150,adjustments.contrast+8);
  adjustments.saturation=Math.min(180,adjustments.saturation+4);
  syncAdjustmentUI(); render(); saveActiveToRecent();
});
$("#autoFixBtn").addEventListener("click",()=>{
  adjustments={brightness:106,contrast:108,saturation:106,blur:0,grayscale:0};
  syncAdjustmentUI(); render(); saveActiveToRecent();
});
$("#compareBtn").addEventListener("click",()=>{
  if(showBefore) $("#afterBtn").click(); else $("#beforeBtn").click();
});

$("#clearRecentBtn").addEventListener("click",()=>{
  recentItems=[];activeRecentId=null;$("#recentSection").classList.add("hidden");
});


$("#fitBtn").addEventListener("click",()=>{
  viewMode="fit"; $("#fitBtn").classList.add("selected"); $("#fillBtn").classList.remove("selected"); render();
});
$("#fillBtn").addEventListener("click",()=>{
  viewMode="fill"; $("#fillBtn").classList.add("selected"); $("#fitBtn").classList.remove("selected"); render();
});
$("#newImageCard").addEventListener("click",()=>fileInput.click());

$("#resetBtn").addEventListener("click",()=>{
  workspace.classList.add("hidden");
  fileInput.value="";
  original=null; current=null; activeRecentId=null;
  $("#recentSection").classList.add("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
});
$("#aboutBtn").addEventListener("click",()=>alert("Palia Image Studio\nBy Hafsa Traders\n\nA browser-based image editing studio."));


window.addEventListener("error", e => {
  if (e && e.message) console.error("Palia Image Studio:", e.message);
});

// Keep all recent thumbnails fitted inside their tiles.

// Initial state: show the upload screen and keep the editor/recent area hidden.
workspace.classList.add("hidden");
if($("#recentSection")) $("#recentSection").classList.add("hidden");
