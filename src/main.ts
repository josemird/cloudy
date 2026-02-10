import './style.css'
import './scss/main.scss'
import type { AemetResponse } from './types/aemet'

// --- ESTADO ---
let municipiosLocal: { nombre: string; id: string }[] = []

// --- 1. CARGA DE MUNICIPIOS (A TRAVÉS DEL PROXY) ---
async function registrarMunicipios() {
  try {
    const response = await fetch('/api/clima?type=maestro')
    const metaData = await response.json()

    const finalRes = await fetch(metaData.datos)
    const buffer = await finalRes.arrayBuffer()
    const decodedText = new TextDecoder('iso-8859-15').decode(buffer)
    const data = JSON.parse(decodedText)

    municipiosLocal = data.map((m: any) => ({
      nombre: m.nombre,
      id: m.id.replace('id', '')
    }))

    setupBuscador()
  } catch (error) {
    console.error('❌ Error cargando municipios:', error)
  }
}

// --- 2. BUSCADOR ---
function setupBuscador() {
  const input = document.querySelector<HTMLInputElement>('#city-search')!
  const list = document.querySelector<HTMLUListElement>('#suggestions')!

  input.addEventListener('input', () => {
    const query = input.value.toLowerCase().trim()
    list.innerHTML = ''

    if (query.length < 3) return

    municipiosLocal
      .filter(m => m.nombre.toLowerCase().includes(query))
      .slice(0, 10)
      .forEach(m => {
        const li = document.createElement('li')
        li.textContent = m.nombre
        li.onclick = () => {
          input.value = m.nombre
          list.innerHTML = ''
          consultarClima(m.id)
        }
        list.appendChild(li)
      })
  })

  document.addEventListener('click', e => {
    if (!input.contains(e.target as Node)) {
      list.innerHTML = ''
    }
  })
}

// --- 3. PETICIÓN DE CLIMA ---
async function consultarClima(id: string = '29067') {
  try {
    const response = await fetch(`/api/clima?id=${id}`)
    const metaData = await response.json()

    const finalRes = await fetch(metaData.datos)
    const buffer = await finalRes.arrayBuffer()
    const decodedText = new TextDecoder('iso-8859-15').decode(buffer)
    const data: AemetResponse[] = JSON.parse(decodedText)

    renderWeather(data[0])
  } catch (error) {
    console.error('❌ Error obteniendo clima:', error)
  }
}

// --- 4. ICONOS ---
function getIcon(valor: string, descripcion: string): string {
  const icons: Record<string, string> = {
    '11': '☀️', '11n': '🌙', '12': '🌤️', '13': '⛅', '14': '☁️',
    '15': '☁️', '16': '☁️', '16n': '🌙', '17': '🌤️',
    '22': '☁️', '23': '🌦️', '24': '🌧️', '25': '🌧️', '26': '🌧️',
    '43': '🌦️', '44': '🌧️', '45': '🌧️', '46': '🌧️',
    '51': '🌩️', '52': '⛈️', '71': '🌨️', '81': '🌫️', '82': '🌫️'
  }

  if (icons[valor]) return icons[valor]

  const d = descripcion.toLowerCase()
  if (d.includes('despejado')) return '☀️'
  if (d.includes('cubierto') || d.includes('nubes')) return '☁️'
  if (d.includes('lluvia')) return '🌧️'
  if (d.includes('tormenta')) return '⛈️'

  return '🌈'
}

// --- 5. RENDER ---
function renderWeather(data: AemetResponse) {
  const hoy = data.prediccion.dia[0]
  const estado = hoy.estadoCielo.find(e => e.value) || hoy.estadoCielo[0]
  const icono = getIcon(estado.value, estado.descripcion)

  document.querySelector<HTMLDivElement>('#weather-result')!.innerHTML = `
    <div class="weather-card">
      <div class="icon-main">${icono}</div>
      <h1>${data.nombre}</h1>
      <p class="temp">${hoy.temperatura.maxima}°C</p>
      <div class="range">
        <span>Min: ${hoy.temperatura.minima}°C</span> |
        <span>Max: ${hoy.temperatura.maxima}°C</span>
      </div>
      <p class="desc">${estado.descripcion}</p>
    </div>
  `
}

// --- INIT ---
registrarMunicipios()
consultarClima()