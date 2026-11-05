import { useEffect, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { hoyISO } from './productos';

// Cada cuánto se revisa si cambió el día
const REVISAR_CADA_MS = 60 * 1000;

// "Hoy" que se actualiza solo si la pestaña queda abierta de un día para otro
export function useHoy() {
  const [hoy, setHoy] = useState(hoyISO);
  useEffect(() => {
    const revisar = () => setHoy(hoyISO());
    const intervalo = setInterval(revisar, REVISAR_CADA_MS);
    document.addEventListener('visibilitychange', revisar);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', revisar);
    };
  }, []);
  return hoy;
}

// Fecha elegida en las pantallas de carga. Si el usuario la dejó en "hoy" y pasa la medianoche, avanza sola.
// fechaInicial se usa cuando otra pantalla manda directo a un día (ej: "Falta la carga de ayer").
export function useFechaDeCarga(fechaInicial) {
  const hoy = useHoy();
  const [elegida, setElegida] = useState(fechaInicial ?? null);
  // Elegir el día de hoy es lo mismo que no haber elegido: mañana sigue siendo "hoy"
  const elegir = (fecha) => setElegida(fecha === hoy ? null : fecha);
  return [elegida ?? hoy, elegir, hoy];
}

// Avisa antes de salir de la pantalla si hay datos sin guardar
export function useAvisoSinGuardar(hayCambios, mensaje = 'Tenés datos sin guardar. ¿Salir igual?') {
  const bloqueo = useBlocker(({ currentLocation, nextLocation }) =>
    hayCambios && currentLocation.pathname !== nextLocation.pathname);

  useEffect(() => {
    if (bloqueo.state !== 'blocked') return;
    if (window.confirm(mensaje)) bloqueo.proceed();
    else bloqueo.reset();
  }, [bloqueo, mensaje]);

  // Cerrar la pestaña o recargar
  useEffect(() => {
    if (!hayCambios) return undefined;
    const alSalir = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', alSalir);
    return () => window.removeEventListener('beforeunload', alSalir);
  }, [hayCambios]);
}
