import { setCors, auth, deductAndLog } from './_lib/helpers.js';

// Free: Open-Meteo (no API key, 10K req/day)
const METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });
  setCors(res);

  const { city, lat, lon, units = 'celsius' } = req.query;

  if (!city && (!lat || !lon)) {
    return res.status(400).json({ error: 'Provide "city" or "lat" + "lon"', example: '/api/weather?city=Paris' });
  }

  const start = Date.now();

  try {
    const user = await auth(req, res);
    if (!user) return;

    let latitude = parseFloat(lat);
    let longitude = parseFloat(lon);
    let cityName = city;

    // Geocode city name
    if (city && (!lat || !lon)) {
      const geoRes = await fetch(`${GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=en`);
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        return res.status(404).json({ error: `City not found: ${city}` });
      }
      latitude = geoData.results[0].latitude;
      longitude = geoData.results[0].longitude;
      cityName = geoData.results[0].name;
    }

    const tempUnit = units === 'fahrenheit' ? 'fahrenheit' : 'celsius';
    const windUnit = units === 'fahrenheit' ? 'mph' : 'kmh';

    const meteoRes = await fetch(
      `${METEO_URL}?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,sunrise,sunset` +
      `&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&timezone=auto&forecast_days=7`
    );
    const meteo = await meteoRes.json();

    if (!meteo.current) throw new Error('No weather data returned');

    // Weather code descriptions
    const WMO = {
      0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',
      45:'Foggy',48:'Rime fog',51:'Light drizzle',53:'Moderate drizzle',55:'Dense drizzle',
      61:'Slight rain',63:'Moderate rain',65:'Heavy rain',
      71:'Slight snow',73:'Moderate snow',75:'Heavy snow',
      80:'Slight showers',81:'Moderate showers',82:'Violent showers',
      95:'Thunderstorm',96:'Thunderstorm + hail',99:'Thunderstorm + heavy hail',
    };

    const current = meteo.current;
    const daily = meteo.daily;

    // Build forecast array
    const forecast = daily.time.map((date, i) => ({
      date,
      temp_max: daily.temperature_2m_max[i],
      temp_min: daily.temperature_2m_min[i],
      precipitation_mm: daily.precipitation_sum[i],
      condition: WMO[daily.weather_code[i]] || 'Unknown',
      sunrise: daily.sunrise[i],
      sunset: daily.sunset[i],
    }));

    await deductAndLog(user.userId, '/api/weather', cityName || `${latitude},${longitude}`);

    return res.status(200).json({
      location: {
        city: cityName,
        latitude,
        longitude,
        timezone: meteo.timezone,
      },
      current: {
        temperature: current.temperature_2m,
        feels_like: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        precipitation_mm: current.precipitation,
        wind_speed: current.wind_speed_10m,
        wind_direction: current.wind_direction_10m,
        condition: WMO[current.weather_code] || 'Unknown',
        unit: tempUnit,
      },
      forecast,
      credits_remaining: user.credits - 1,
      latency_ms: Date.now() - start,
    });
  } catch (e) {
    console.error('[AmineAPI] weather error:', e);
    return res.status(500).json({ error: 'Weather service temporarily unavailable' });
  }
}
