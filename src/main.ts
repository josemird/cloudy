import './style.css'
import './scss/main.scss'
import type { AemetResponse } from './types/aemet';

// --- CONFIGURACIÓN ---
const API_KEY = import.meta.env.VITE_AEMET_API_KEY; 
let municipiosLocal: { nombre: string, id: string }[] = [];

// Detectamos el entorno para decidir la ruta de la API
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// --- 1. REGISTRO LOCAL DE MUNICIPIOS (AEMET) ---
async function registrarMunicipiosLocalmente() {
  // En local va directo a AEMET, en Vercel pasa por nuestro "túnel" seguro
  const urlMaestro = isLocal 
    ? `https://opendata.aemet.es/opendata/api/maestro/municipios?api_key=${API_KEY}`
    : `/api/clima?type=maestro`;

  try {
    const response = await fetch(urlMaestro);
    const metaData = await response.json();
    
    // AEMET nos da una URL temporal en el campo 'datos'
    const finalRes = await fetch(metaData.datos);
    const buffer = await finalRes.arrayBuffer();
    const decoder = new TextDecoder('iso-8859-15');
    const decodedText = decoder.decode(buffer);
    
    const data = JSON.parse(decodedText);

    municipiosLocal = data.map((m: any) => ({
      nombre: m.nombre,
      id: m.id.replace('id', '') 
    }));

    console.log(`✅ Registro completado: ${municipiosLocal.length} municipios listos.`);
    setupBuscador();
  } catch (error) {
    console.error("❌ Error al registrar municipios:", error);
  }
}

// --- 2. LÓGICA DEL BUSCADOR ---
function setupBuscador() {
  const inputSearch = document.querySelector<HTMLInputElement>('#city-search')!;
  const suggestionsUl = document.querySelector<HTMLUListElement>('#suggestions')!;

  inputSearch.addEventListener('input', () => {
    const query = inputSearch.value.toLowerCase().trim();
    suggestionsUl.innerHTML = '';

    if (query.length < 3) return;

    const coincidencias = municipiosLocal
      .filter(m => m.nombre.toLowerCase().includes(query))
      .slice(0, 10);

    coincidencias.forEach(m => {
      const li = document.createElement('li');
      li.textContent = m.nombre;
      li.onclick = () => {
        inputSearch.value = m.nombre;
        suggestionsUl.innerHTML = '';
        consultarClimaAEMET(m.id);
      };
      suggestionsUl.appendChild(li);
    });
  });

  document.addEventListener('click', (e) => {
    if (!inputSearch.contains(e.target as Node)) {
      suggestionsUl.innerHTML = '';
    }
  });
}

// --- 3. PETICIÓN DE CLIMA A AEMET ---
async function consultarClimaAEMET(id: string = '29067') {
  const urlClima = isLocal
    ? `https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/${id}?api_key=${API_KEY}`
    : `/api/clima?id=${id}`;

  try {
    const response = await fetch(urlClima);
    const metaData = await response.json();

    const finalRes = await fetch(metaData.datos);
    const buffer = await finalRes.arrayBuffer();
    const decodedText = new TextDecoder('iso-8859-15').decode(buffer);

    const data: AemetResponse[] = JSON.parse(decodedText); 
    renderWeather(data[0]);
  } catch (error) {
    console.error("❌ Error al obtener el clima:", error);
  }
}

// --- 4. TRADUCCIÓN DE CÓDIGOS A ICONOS ---
function getIcon(valor: string, descripcion: string): string {
  const icons: { [key: string]: string } = {
    "11": "☀️", "11n": "🌙", "12": "🌤️", "13": "⛅", "14": "☁️", 
    "15": "☁️", "16": "☁️", "16n": "🌙", "17": "🌤️",
    "43": "🌦️", "44": "🌧️", "45": "🌧️", "46": "🌧️",
    "23": "🌦️", "24": "🌧️", "25": "🌧️", "26": "🌧️",
    "51": "🌩️", "52": "⛈️", "71": "🌨️", "81": "🌫️", "82": "🌫️"
  };

  const cleanValor = valor.trim();
  if (icons[cleanValor]) return icons[cleanValor];

  const desc = descripcion.toLowerCase();
  if (desc.includes("despejado")) return "☀️";
  if (desc.includes("cubierto") || desc.includes("nubes")) return "☁️";
  if (desc.includes("lluvia")) return "🌧️";
  if (desc.includes("tormenta")) return "⛈️";
  
  return "🌈"; 
}

// --- 5. RENDERIZADO DEL CLIMA ---
function renderWeather(data: AemetResponse) {
  const hoy = data.prediccion.dia[0];
  const estadoActual = hoy.estadoCielo.find(e => e.value !== "") || hoy.estadoCielo[0];
  const icono = getIcon(estadoActual.value, estadoActual.descripcion);

  const resultDiv = document.querySelector<HTMLDivElement>('#weather-result')!;
  
  resultDiv.innerHTML = `
    <div class="weather-card">
      <div class="icon-main">${icono}</div>
      <h1>${data.nombre}</h1>
      <p class="temp">${hoy.temperatura.maxima}°C</p>
      <div class="range">
         <span>Min: ${hoy.temperatura.minima}°C</span> | 
         <span>Max: ${hoy.temperatura.maxima}°C</span>
      </div>
      <p class="desc">${estadoActual.descripcion || 'Cielo'}</p>
    </div>
  `;
}

// --- ARRANQUE ---
registrarMunicipiosLocalmente(); 
consultarClimaAEMET();