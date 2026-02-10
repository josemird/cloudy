export interface AemetResponse {
  nombre: string;
  provincia: string;
  prediccion: {
    dia: Array<{
      fecha: string;
      temperatura: {
        maxima: number;
        minima: number;
      };
      estadoCielo: Array<{
        value: string;       
        descripcion: string; 
        periodo?: string;
      }>;
    }>;
  };
}