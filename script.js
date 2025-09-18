// Elements
const welcomePage = document.getElementById('welcome');
const mapPage = document.getElementById('mapPage');
const routeTitle = document.getElementById('routeTitle');
const busListItems = document.getElementById('busListItems');

// Map vars
let map;
let route = [];
let buses = []; // { id, idx, speedKmph, marker }

const exampleRoute = [
  [12.9716, 77.5946],
  [12.9748, 77.5974],
  [12.9796, 77.6008],
  [12.9870, 77.6045],
  [12.9945, 77.6078],
  [13.0010, 77.6100]
];

// When user submits from/to
document.getElementById('tripForm').addEventListener('submit', e => {
  e.preventDefault();
  const from = document.getElementById('fromPlace').value.trim();
  const to = document.getElementById('toPlace').value.trim();
  if (!from || !to) return;
  route = exampleRoute.slice();
  routeTitle.textContent = `From ${escapeHtml(from)} → To ${escapeHtml(to)}`;
  showMapPage();
  initBuses();
});

function showMapPage(){
  welcomePage.style.display = 'none';
  mapPage.style.display = 'block';
  if (!map) initMap();
}

function initMap(){
  map = L.map('map').setView(route[0], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  L.polyline(route, { color: '#1e90ff', weight: 4, opacity: 0.8 }).addTo(map);

  // stops
  route.forEach((r,i)=>{
    L.circleMarker(r, { radius:4, color:'#1e90ff', fill:true, fillColor:'#fff', fillOpacity:1 })
      .bindTooltip(`Stop ${i+1}`)
      .addTo(map);
  });
}

// Create multiple bus objects
function initBuses(){
  buses.forEach(b => b.marker && map.removeLayer(b.marker));
  buses = [];

  const baseIds = ['14d sivajinagar','13E MMroad','306 cleveland',' 16g MG road'];
  baseIds.forEach((id,i) => {
    const startIdx = (i * Math.floor(route.length / baseIds.length)) % route.length;
    const speedKmph = 20 + (i*5);
    const b = { id, idx: startIdx, speedKmph, marker: null };
    b.marker = L.marker(route[b.idx], { title: b.id }).addTo(map);
    b.marker.bindPopup(popupHtml(b));
    buses.push(b);
  });

  renderBusList();
  if (window.__busTick) clearInterval(window.__busTick);
  window.__busTick = setInterval(stepBuses, 2000);
}

function stepBuses(){
  buses.forEach(b => {
    b.idx = (b.idx + 1) % route.length;
    const latlng = route[b.idx];
    b.marker.setLatLng(latlng);
    b.marker.getPopup().setContent(popupHtml(b));
    b.marker.on('click', () => {
      b.marker.openPopup();
      map.panTo(latlng);
    });
  });
  renderBusList();
}

function popupHtml(bus){
  const now = new Date();
  const minsToNext = 2;
  const arrival = new Date(now.getTime() + minsToNext*60*1000);
  const remainingStops = (route.length - 1 - bus.idx + route.length) % route.length;
  const destETA = new Date(now.getTime() + (remainingStops * 2 + 2) * 60 * 1000);

  const lateChance = Math.max(0.05, 0.35 - (bus.speedKmph - 20) * 0.02);
  const isLate = Math.random() < lateChance;
  const statusHtml = isLate ? `<span class="late">Late</span>` : `<span style="color:green">On time</span>`;

  return `<div class="bus-popup">
    <strong>${escapeHtml(bus.id)}</strong><br/>
    Route: <em>Demo Express</em><br/>
    Arrival (next stop): ${arrival.toLocaleTimeString()}<br/>
    Destination ETA: ${destETA.toLocaleTimeString()}<br/>
    Status: ${statusHtml}<br/>
    Speed: ${bus.speedKmph} km/h<br/>
    <small>Source: Demo / Chalo / WhereIsMyTrain</small>
  </div>`;
}

function renderBusList(){
  busListItems.innerHTML = '';
  buses.forEach(b => {
    const remainingStops = (route.length - 1 - b.idx + route.length) % route.length;
    const mins = remainingStops * 2 + 2;
    const line = document.createElement('div');
    line.className = 'bus-item';
    line.innerHTML = `
      <div>
        <div><strong>${escapeHtml(b.id)}</strong></div>
        <div class="small">${mins} min to destination</div>
      </div>
      <div>
        <button onclick="focusBus('${b.id}')">Center</button>
      </div>
    `;
    busListItems.appendChild(line);
  });
}

function focusBus(id){
  const b = buses.find(x => x.id === id);
  if (!b) return;
  map.setView(route[b.idx], 15);
  b.marker.openPopup();
}
window.focusBus = focusBus;

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}
