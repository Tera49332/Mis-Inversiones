import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import * as calc from '../services/calculations';

export function usePortfolio() {
  const etfs = useLiveQuery(() => db.etfs.toArray());
  const compras = useLiveQuery(() => db.compras.orderBy('fecha').reverse().toArray());
  const valoraciones = useLiveQuery(() => db.valoraciones.orderBy('fecha').reverse().toArray());

  // Add purchase
  async function agregarCompra(compra) {
    return await db.compras.add({
      ...compra,
      importe: parseFloat(compra.importe),
      participaciones: parseFloat(compra.participaciones),
      precioUnitario: parseFloat(compra.precioUnitario),
      comision: parseFloat(compra.comision || 0)
    });
  }
  
  // Delete purchase
  async function eliminarCompra(id) {
    return await db.compras.delete(id);
  }
  
  // Update valuation
  async function actualizarValoracion(etfId, valorPorParticipacion) {
    const fecha = new Date().toISOString().split('T')[0];
    const comprasETF = await db.compras.where({ etfId }).toArray();
    const totalParticipaciones = calc.calcularTotalParticipaciones(comprasETF);
    const valorTotal = calc.calcularValorActual(totalParticipaciones, valorPorParticipacion);
    
    return await db.valoraciones.add({
      etfId,
      fecha,
      valorPorParticipacion: parseFloat(valorPorParticipacion),
      valorTotal
    });
  }
  
  // Get summary per ETF
  function getResumenPorETF(etfId) {
    if (!compras || !valoraciones) return null;
    
    const comprasETF = compras.filter(c => c.etfId === etfId);
    const valoracionesETF = valoraciones.filter(v => v.etfId === etfId);
    const ultimaValoracion = valoracionesETF[0] ? valoracionesETF[0].valorPorParticipacion : 0;
    
    const totalInvertido = calc.calcularTotalInvertido(comprasETF);
    const totalParticipaciones = calc.calcularTotalParticipaciones(comprasETF);
    const precioMedio = calc.calcularPrecioMedio(comprasETF);
    
    // If we have a valuation, use it. Otherwise, use average price as fallback so current value equals invested.
    const valorActual = calc.calcularValorActual(totalParticipaciones, ultimaValoracion || precioMedio); 
    const ganancia = calc.calcularGanancia(valorActual, totalInvertido);
    const rentabilidad = calc.calcularRentabilidad(valorActual, totalInvertido);

    return {
      etfId,
      totalInvertido,
      totalParticipaciones,
      precioMedio,
      valorActual,
      ganancia,
      rentabilidad,
      ultimaValoracion
    };
  }
  
  // Get global summary
  function getResumenGlobal() {
    if (!etfs || !compras || !valoraciones) return null;
    
    let totalInvertidoGlobal = 0;
    let valorActualGlobal = 0;

    etfs.forEach(etf => {
      const resumen = getResumenPorETF(etf.id);
      if (resumen) {
        totalInvertidoGlobal += resumen.totalInvertido;
        valorActualGlobal += resumen.valorActual;
      }
    });

    const gananciaGlobal = calc.calcularGanancia(valorActualGlobal, totalInvertidoGlobal);
    const rentabilidadGlobal = calc.calcularRentabilidad(valorActualGlobal, totalInvertidoGlobal);

    return {
      totalInvertido: totalInvertidoGlobal,
      valorActual: valorActualGlobal,
      ganancia: gananciaGlobal,
      rentabilidad: rentabilidadGlobal
    };
  }
  
  // Get chart data (evolution over time)
  function getDatosGrafico() {
    if (!compras || compras.length === 0) return [];
    
    // Simple running total of invested amount sorted by date
    const sortedCompras = [...compras].reverse(); // oldest first
    let invertidoAcumulado = 0;
    
    const data = sortedCompras.map(c => {
      invertidoAcumulado += c.importe;
      return {
        fecha: c.fecha,
        invertido: invertidoAcumulado
      };
    });

    return data;
  }

  return { 
    etfs, 
    compras, 
    valoraciones, 
    agregarCompra, 
    eliminarCompra, 
    actualizarValoracion, 
    getResumenPorETF, 
    getResumenGlobal, 
    getDatosGrafico, 
    isLoading: !etfs || !compras || !valoraciones 
  };
}
