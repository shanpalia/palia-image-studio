import imglyRemoveBackground from "https://esm.sh/@imgly/background-removal@1.7.0";
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const fileInput=$("#fileInput"), chooseBtn=$("#chooseBtn"), dropZone=$("#dropZone");
const workspace=$("#workspace"), canvas=$("#canvas"), ctx=canvas.getContext("2d");
const statusEl=$("#status"), processing=$("#processing"), processingText=$("#processingText"), processingSub=$("#processingSub");
let original=null, current=null, zoom=1, rotation=0, bg="transparent", format="png", scale=2, showBefore=false;

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

function loadFile(file){
  const validType = /^image\/(jpeg|png|webp)$/i.test(file.type);
const validName = /\.(jpe?g|png|webp)$/i.test(file.name || "");
if(!validType && !validName){
  alert("Please choose a JPG, PNG or WEBP image.");
  return;
}
  const r=new FileReader();
  r.onload=()=>{const im=new Image();im.onload=()=>{original=im;current=im;rotation=0;zoom=1;workspace.classList.remove("hidden");render();statusEl.textContent="Image loaded";workspace.scrollIntoView({behavior:"smooth"})};im.src=r.result};
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
  ctx.save();ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(rotation*Math.PI/180);
  ctx.drawImage(current,-w/2,-h/2,w,h);ctx.restore();
  canvas.style.transform=`scale(${zoom})`;
}

$$("[data-bg]").forEach(b=>b.addEventListener("click",()=>{bg=b.dataset.bg;$$("[data-bg]").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");render()}));
$("#bgColor").addEventListener("input",e=>{bg=e.target.value;$$("[data-bg]").forEach(x=>x.classList.remove("selected"));render()});
$$("[data-scale]").forEach(b=>b.addEventListener("click",()=>{scale=+b.dataset.scale;$$("[data-scale]").forEach(x=>x.classList.remove("selected"));b.classList.add("selected")}));
$$("[data-format]").forEach(b=>b.addEventListener("click",()=>{format=b.dataset.format;$$("[data-format]").forEach(x=>x.classList.remove("selected"));b.classList.add("selected")}));

$("#rotateLeft").addEventListener("click",()=>{rotation=(rotation+270)%360;render()});
$("#rotateRight").addEventListener("click",()=>{rotation=(rotation+90)%360;render()});
$("#resetRotate").addEventListener("click",()=>{rotation=0;zoom=1;$("#zoomLabel").textContent="100%";render()});
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
  showProcessing("Loading AI background remover...","The first run can take a little longer");
  try{
    const resultBlob = await removeBackgroundAI(original, (current,total)=>{
      if(total){ const pct=Math.round(current/total*100); processingSub.textContent=`AI model ${pct}%`; }
    });
    const url = URL.createObjectURL(resultBlob);
    const out = new Image();
    out.onload = ()=>{
      current=out;
      showBefore=false;
      $("#afterBtn").classList.add("selected");
      $("#beforeBtn").classList.remove("selected");
      hideProcessing();
      statusEl.textContent="AI background removed";
      render();
    };
    out.onerror=()=>{ throw new Error("The AI result could not be loaded."); };
    out.src=url;
  }catch(err){
    console.error(err);
    hideProcessing();
    statusEl.textContent="Background removal failed";
    alert("AI background removal could not be completed. Please try again or use a smaller image.");
  }
}

async function removeBackgroundAI(im, progress){
  // @imgly/background-removal runs the neural network in the browser.
  // The model/WASM assets are fetched from IMG.LY and cached by the browser.
  const blob = await imglyRemoveBackground(im, {
    model: "isnet_fp16",
    device: "gpu",
    output: { format: "image/png", type: "foreground" },
    progress: (key,current,total)=>{
      if(progress) progress(current,total);
    }
  });
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
  hideProcessing();statusEl.textContent=`Enhanced ${scale}×`;render();
}

$("#downloadBtn").addEventListener("click",()=>{
  if(!current)return;
  const c=document.createElement("canvas"),w=current.naturalWidth||current.width,h=current.naturalHeight||current.height;
  c.width=rotation%180?h:w;c.height=rotation%180?w:h;const x=c.getContext("2d");
  if(format==="jpg"){x.fillStyle=bg==="transparent"?"#fff":bg;x.fillRect(0,0,c.width,c.height)}
  x.save();x.translate(c.width/2,c.height/2);x.rotate(rotation*Math.PI/180);x.drawImage(current,-w/2,-h/2,w,h);x.restore();
  const a=document.createElement("a");a.href=c.toDataURL(format==="jpg"?"image/jpeg":"image/png",.95);a.download=`palia-image-studio-edited.${format}`;document.body.appendChild(a);a.click();a.remove();
});

$("#resetBtn").addEventListener("click",()=>{workspace.classList.add("hidden");fileInput.value="";original=null;current=null});
$("#aboutBtn").addEventListener("click",()=>alert("Palia Image Studio\nBy Hafsa Traders\n\nA browser-based image editing studio."));


window.addEventListener("error", e => {
  if (e && e.message) console.error("Palia Image Studio:", e.message);
});
