/**
 * Módulo de consulta de clima — OpenWeatherMap Current Weather API.
 *
 * Requiere variable de entorno OPENWEATHER_API_KEY.
 * Documentación: https://openweathermap.org/current
 *
 * Condiciones de disparo de campaña:
 *   lluvia → weather.main en ['Rain', 'Drizzle', 'Thunderstorm']
 *   calor  → main.temp >= UMBRAL_CALOR_C (28 °C)
 */

export type TipoClima = 'lluvia' | 'calor'

export interface ResultadoClima {
  tipo:        TipoClima | null  // null = sin condición especial hoy
  tempC:       number
  descripcion: string            // descripción en español (lang=es)
  ciudad:      string            // nombre de ciudad devuelto por la API
}

const UMBRAL_CALOR_C = 28
const API_BASE       = 'https://api.openweathermap.org/data/2.5/weather'

const CONDICIONES_LLUVIA = new Set(['Rain', 'Drizzle', 'Thunderstorm'])

export async function fetchClima(ciudad: string): Promise<ResultadoClima> {
  const key = process.env.OPENWEATHER_API_KEY
  if (!key) throw new Error('OPENWEATHER_API_KEY no configurada')

  const url = `${API_BASE}?q=${encodeURIComponent(ciudad)}&appid=${key}&units=metric&lang=es`
  const res = await fetch(url, { next: { revalidate: 0 } })  // no cache en CRON

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`OpenWeatherMap error ${res.status}: ${body}`)
  }

  const data = await res.json() as {
    name: string
    main: { temp: number }
    weather: Array<{ main: string; description: string }>
  }

  const mainCondicion = data.weather[0]?.main ?? ''
  const tempC         = Math.round(data.main.temp * 10) / 10
  const descripcion   = data.weather[0]?.description ?? ''

  let tipo: TipoClima | null = null
  if (CONDICIONES_LLUVIA.has(mainCondicion)) {
    tipo = 'lluvia'
  } else if (tempC >= UMBRAL_CALOR_C) {
    tipo = 'calor'
  }

  return { tipo, tempC, descripcion, ciudad: data.name }
}
