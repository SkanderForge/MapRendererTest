import * as d3 from 'd3';
import provinces from './geooutput.json';

import simplify from "@turf/simplify";


let provincesFullRender = provinces;

let provincesHalfRender = {...provincesFullRender};

provincesHalfRender.features = provincesHalfRender.features= provincesHalfRender.features.map((province)=>{
  try {
    let foo = simplify(province, {tolerance: 10, highQuality: false})
    return foo;
  }catch(err){
    return province;
  }
})




const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext("2d", { willReadFrequently: true });


ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;


let rect = ctx.canvas.getBoundingClientRect();


// State variables
let viewport = {
  x: 0, y: 0, // Viewport's top-left within the larger world
  scale: 1
};
d3.select(ctx.canvas).call(d3.zoom()
  .scaleExtent([-150, 150])
  .on("zoom", ({transform}) => render(transform)));

let isDragging = false;
let lastDragX, lastDragY;

// Sample objects (you might fetch these from data)
const objects = [
  { x: 50, y: 100, width: 20, height: 30, color: 'red' },
  { x: 200, y: 50, width: 50, height: 10, color: 'blue' },
  // ... more objects
];

const projection = d3.geoIdentity()
    .reflectY(true)
  //.fitSize([8192,3616], provinces)

const path = d3.geoPath(projection).context(ctx);
//const path = d3.geoPath().projection(d3.reflectY()).context(ctx);
let shapes = provinces.features;

console.log(JSON.stringify(provincesHalfRender.features[5].geometry))
console.log(JSON.stringify(provincesFullRender.features[5].geometry))

provincesHalfRender.features.map((feature)=>{
  let centroid = path.centroid(feature)
  let bounds = path.bounds(feature)
  feature.centroid = centroid
  feature.bounds = bounds
  return feature
})

provincesFullRender.features.map((feature)=>{
  let centroid = path.centroid(feature)
  let bounds = path.bounds(feature)
  feature.centroid = centroid
  feature.bounds = bounds
  return feature
})

function render(transform) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.drawImage(document.getElementById('source'
  ), transform.x, transform.y, 8192*transform.k,3616*transform.k);

  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.k, transform.k);


  ctx.strokeStyle = "#000"
  ctx.lineWidth = 0.02;
  let shapesDrawn = 0;
  shapes = provincesFullRender.features;

  const viewportLeft = -transform.x;
  const viewportRight = viewportLeft + window.innerWidth;
  const viewportTop = -transform.y;
  const viewportBottom = viewportTop + window.innerHeight;

  ctx.fillStyle = "#aaa";
  for(let shape of shapes){
    if(
      shape.bounds[1][0] < viewportLeft / transform.k ||
      shape.bounds[0][0] > viewportRight / transform.k ||
      shape.bounds[1][1] < viewportTop / transform.k ||
      shape.bounds[0][1] > viewportBottom / transform.k
  ) continue
    ctx.fillStyle = shape.properties.hex;

    shapesDrawn++;
      ctx.beginPath()
      path(shape);
      ctx.fill();
      ctx.stroke();
    ctx.closePath();
  }
  console.log(shapesDrawn)
  ctx.restore(); // Restore the original canvas state

}


function isWithinViewport(obj) {
  return (
    obj.x + obj.width >= 0 &&
    obj.x <= canvas.width &&
    obj.y + obj.height >= 0 &&
    obj.y <= canvas.height
  );
}

// Event Listeners
canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('mousemove', handleDrag);
canvas.addEventListener('mouseup', endDrag);
canvas.addEventListener('wheel', handleZoom);

// Event Handlers (Modify viewport based on interaction)
function startDrag(e) {
  isDragging = true;
  lastDragX = e.clientX;
  lastDragY = e.clientY;
}

function handleDrag(e) {
  if (isDragging) {
    const dx = (e.clientX - lastDragX); // Inverse scaling
    const dy = (e.clientY - lastDragY);
    viewport.x += dx;
    viewport.y += dy;
    lastDragX = e.clientX;
    lastDragY = e.clientY;
    render(e);
  }
}

function endDrag() {
  isDragging = false;
}

function handleZoom(e) {
  // Zoom based on mouse position (more complex, omitted here) ...

  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
  viewport.scale *= zoomFactor;

  // Clamp zoom level if needed
  viewport.scale = Math.max(0.1, Math.min(viewport.scale, 8));

  render(e);
}

// Initial render
render();
