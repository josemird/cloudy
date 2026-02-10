export default async function handler(req: any, res: any) {
  const { id, type } = req.query;
  const API_KEY = process.env.AEMET_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'API KEY no definida' });
  }

  let url = '';

  if (type === 'maestro') {
    url = `https://opendata.aemet.es/opendata/api/maestro/municipios?api_key=${API_KEY}`;
  } else {
    url = `https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/${id}?api_key=${API_KEY}`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
}