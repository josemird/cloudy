export default async function handler(req: any, res: any) {
  const { id } = req.query;
  const API_KEY = process.env.AEMET_API_KEY; 

  const url = `https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/${id}?api_key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    // Devolvemos la respuesta de AEMET a nuestra App
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
}