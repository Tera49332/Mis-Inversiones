// Calculate total invested for a list of purchases
export function calcularTotalInvertido(compras) {
  if (!compras || compras.length === 0) return 0;
  return compras.reduce((total, compra) => total + (parseFloat(compra.importe) || 0), 0);
}

// Calculate total shares for a list of purchases
export function calcularTotalParticipaciones(compras) {
  if (!compras || compras.length === 0) return 0;
  return compras.reduce((total, compra) => total + (parseFloat(compra.participaciones) || 0), 0);
}

// Calculate weighted average price
export function calcularPrecioMedio(compras) {
  const totalInvertido = calcularTotalInvertido(compras);
  const totalParticipaciones = calcularTotalParticipaciones(compras);
  if (totalParticipaciones === 0) return 0;
  return totalInvertido / totalParticipaciones;
}

// Calculate current value given shares and current price per share
export function calcularValorActual(totalParticipaciones, precioActual) {
  if (!totalParticipaciones || !precioActual) return 0;
  return (parseFloat(totalParticipaciones) || 0) * (parseFloat(precioActual) || 0);
}

// Calculate profit/loss
export function calcularGanancia(valorActual, totalInvertido) {
  return (parseFloat(valorActual) || 0) - (parseFloat(totalInvertido) || 0);
}

// Calculate return percentage
export function calcularRentabilidad(valorActual, totalInvertido) {
  const invertido = parseFloat(totalInvertido) || 0;
  if (invertido === 0) return 0;
  return (calcularGanancia(valorActual, totalInvertido) / invertido) * 100;
}

// Calculate the third value given two of: importe, participaciones, precioUnitario
export function calcularCampoFaltante(importe, participaciones, precioUnitario) {
  const imp = parseFloat(importe);
  const part = parseFloat(participaciones);
  const precio = parseFloat(precioUnitario);

  if (isNaN(imp) && !isNaN(part) && !isNaN(precio)) {
    return (part * precio).toFixed(2);
  }
  if (!isNaN(imp) && isNaN(part) && !isNaN(precio)) {
    return precio === 0 ? "0" : (imp / precio).toFixed(4);
  }
  if (!isNaN(imp) && !isNaN(part) && isNaN(precio)) {
    return part === 0 ? "0" : (imp / part).toFixed(4);
  }
  return null;
}

// Format currency to EUR
export function formatearMoneda(valor) {
  const val = parseFloat(valor) || 0;
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
}

// Format percentage
export function formatearPorcentaje(valor) {
  const val = parseFloat(valor) || 0;
  return new Intl.NumberFormat('es-ES', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val / 100);
}

// Format date to Spanish locale
export function formatearFecha(fecha) {
  if (!fecha) return '';
  const date = new Date(fecha);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

// Export data to CSV
export function exportarCSV(compras, etfs) {
  if (!compras || compras.length === 0) return;

  const etfMap = (etfs || []).reduce((acc, etf) => {
    acc[etf.id] = etf.ticker;
    return acc;
  }, {});

  const headers = ['ID', 'ETF', 'Fecha', 'Importe (EUR)', 'Participaciones', 'Precio Unitario (EUR)', 'Comision (EUR)', 'Notas'];
  const rows = compras.map(c => [
    c.id,
    etfMap[c.etfId] || c.etfId,
    c.fecha,
    c.importe,
    c.participaciones,
    c.precioUnitario,
    c.comision || 0,
    `"${(c.notas || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `exportacion_compras_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
