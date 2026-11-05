// Datos y formatos compartidos por las pantallas.
// Los valores (UNIDAD, KG...) son los mismos que los enums del backend.

export const UNIDADES = [
  { valor: 'UNIDAD', etiqueta: 'Unidad', corta: 'unidades', singular: 'unidad' },
  { valor: 'KG', etiqueta: 'Kilogramo', corta: 'kg', singular: 'kg' },
  { valor: 'GRAMO', etiqueta: 'Gramo', corta: 'g', singular: 'g' },
  { valor: 'LITRO', etiqueta: 'Litro', corta: 'l', singular: 'l' },
  { valor: 'ML', etiqueta: 'Mililitro', corta: 'ml', singular: 'ml' },
];

export const MODALIDADES = [
  { valor: 'PRODUCIDO', etiqueta: 'Producido' },
  { valor: 'COMPRADO', etiqueta: 'Comprado' },
];

// Motivos de Desechos (enum MotivoDesecho)
export const MOTIVOS_DESECHO = [
  { valor: 'VENCIMIENTO', etiqueta: 'Fin de vida útil' },
  { valor: 'DANIADO', etiqueta: 'Producto dañado' },
  { valor: 'DEFECTO_ELABORACION', etiqueta: 'Defecto de cocción' },
  { valor: 'OTRO', etiqueta: 'Otro' },
];

// Motivos de un ajuste manual de stock (enum MotivoAjusteStock)
export const MOTIVOS_AJUSTE_STOCK = [
  { valor: 'CONTEO', etiqueta: 'Conteo: no coincidía' },
  { valor: 'MERMA', etiqueta: 'Merma' },
  { valor: 'ROBO', etiqueta: 'Robo o faltante' },
  { valor: 'OTRO', etiqueta: 'Otro' },
];

// Tipos de movimiento de stock (enum TipoMovimiento)
export const TIPOS_MOVIMIENTO = {
  STOCK_INICIAL: 'Stock inicial',
  INGRESO: 'Producido / comprado',
  VENTA: 'Venta',
  DESECHO: 'Desecho',
  CORRECCION: 'Corrección',
  AJUSTE_INVENTARIO: 'Ajuste de inventario',
};

export const RUBROS = [
  { valor: 'PANADERIA', etiqueta: 'Panadería' },
  { valor: 'CAFETERIA', etiqueta: 'Cafetería' },
  { valor: 'RESTAURANTE', etiqueta: 'Restaurante' },
];

export const PROVINCIAS = [
  'Ciudad Autónoma de Buenos Aires', 'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
  'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro',
  'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
];

// Cuánto se puede cargar hacia atrás y programar hacia adelante (igual que en el backend)
export const DIAS_MAX_ATRAS = 90;
export const DIAS_MAX_ADELANTE = 90;

export function unidadCorta(valor, cantidad) {
  const unidad = UNIDADES.find(u => u.valor === valor);
  if (!unidad) return valor?.toLowerCase() ?? '';
  return Number(cantidad) === 1 ? unidad.singular : unidad.corta;
}

export function etiquetaModalidad(valor) {
  return MODALIDADES.find(m => m.valor === valor)?.etiqueta ?? valor ?? '';
}

export function etiquetaMotivoDesecho(valor) {
  return MOTIVOS_DESECHO.find(m => m.valor === valor)?.etiqueta ?? valor ?? '';
}

// "ALTA" -> "Alta"
export function etiquetaConfianza(nivel) {
  if (nivel === 'ALTA') return 'Alta';
  if (nivel === 'MEDIA') return 'Media';
  return 'Baja';
}

// Colores de la etiqueta de confianza (Alta verde, Media amarilla, Baja roja)
export function colorConfianza(nivel) {
  if (nivel === 'ALTA') return { bg: '#E6F4EA', color: '#137333' };
  if (nivel === 'MEDIA') return { bg: '#FEF7E0', color: '#B06000' };
  return { bg: '#FCE8E6', color: '#C5221F' };
}

// 1500 -> "$ 1.500" ; 1500.5 -> "$ 1.500,50"
export function formatearPrecio(numero) {
  const n = Number(numero) || 0;
  return '$ ' + n.toLocaleString('es-AR', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
}

// 1800000 -> "$ 1,8 M" ; 18600 -> "$ 18.600"
export function formatearPrecioCorto(numero) {
  const n = Number(numero) || 0;
  if (Math.abs(n) >= 1000000) return '$ ' + (n / 1000000).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + ' M';
  return '$ ' + Math.round(n).toLocaleString('es-AR');
}

// 12 -> "12" ; 2.5 -> "2,5"
export function formatearCantidad(numero) {
  return (Number(numero) || 0).toLocaleString('es-AR', { maximumFractionDigits: 3 });
}

// (1, 'UNIDAD') -> "1 unidad" ; (2.5, 'KG') -> "2,5 kg"
export function cantidadConUnidad(numero, unidadMedida) {
  return `${formatearCantidad(numero)} ${unidadCorta(unidadMedida, numero)}`;
}

// No se suman kilos con unidades: [{cantidad:3, unidadMedida:'KG'}, {cantidad:2, unidadMedida:'UNIDAD'}] -> "3 kg · 2 unidades"
export function resumirPorUnidad(items) {
  const totales = {};
  items.forEach(({ cantidad, unidadMedida }) => {
    const n = Number(cantidad) || 0;
    if (n !== 0) totales[unidadMedida] = (totales[unidadMedida] || 0) + n;
  });
  const partes = UNIDADES.filter(u => totales[u.valor] !== undefined).map(u => cantidadConUnidad(totales[u.valor], u.valor));
  return partes.length ? partes.join(' · ') : 'Nada';
}

// 87.5 -> "87,5%"
export function formatearPorcentaje(numero) {
  return (Number(numero) || 0).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + '%';
}

// "2026-10-25" -> "Domingo, 25 de octubre"
export function formatearFechaLarga(fechaISO) {
  const [a, m, d] = fechaISO.split('-').map(Number);
  const texto = new Date(a, m - 1, d).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// "2026-10-25" -> "Dom"
export function diaCorto(fechaISO) {
  const [a, m, d] = fechaISO.split('-').map(Number);
  const texto = new Date(a, m - 1, d).toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// "2026-10-25" -> "25/10"
export function fechaCorta(fechaISO) {
  const [, m, d] = fechaISO.split('-');
  return `${d}/${m}`;
}

// "2026-10-31T09:30:00" -> "Hoy, 09:30" / "Ayer, 18:40" / "28/10, 11:05"
export function formatearMomento(fechaHoraISO) {
  if (!fechaHoraISO) return '';
  const [fecha, hora = ''] = fechaHoraISO.split('T');
  const hhmm = hora.slice(0, 5);
  const hoy = hoyISO();
  if (fecha === hoy) return `Hoy, ${hhmm}`;
  if (fecha === sumarDias(hoy, -1)) return `Ayer, ${hhmm}`;
  return `${fechaCorta(fecha)}, ${hhmm}`;
}

// Fecha de hoy en Argentina (AAAA-MM-DD), igual que el servidor, aunque el navegador esté en otra zona horaria
export function hoyISO() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
}

// Suma días a una fecha AAAA-MM-DD sin pasar por UTC
export function sumarDias(fechaISO, dias) {
  const [a, m, d] = fechaISO.split('-').map(Number);
  return new Date(a, m - 1, d + dias).toLocaleDateString('en-CA');
}

// Lunes de la semana de una fecha AAAA-MM-DD
export function lunesDe(fechaISO) {
  const [a, m, d] = fechaISO.split('-').map(Number);
  const diaSemana = new Date(a, m - 1, d).getDay(); // 0 = domingo
  return sumarDias(fechaISO, diaSemana === 0 ? -6 : 1 - diaSemana);
}

// Para comparar nombres sin que importen mayúsculas ni tildes: "Budín" y "budin" son lo mismo
export function normalizarNombre(nombre = '') {
  return nombre.trim().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ');
}
