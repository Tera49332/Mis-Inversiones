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
      comision: parseFloat(compra.comision || 0),
      divisa: compra.divisa || 'EUR',
      tipoCambioAEUR: parseFloat(compra.tipoCambioAEUR || 1)
    });
  }
  
  // Delete purchase
  async function eliminarCompra(id) {
    return await db.compras.delete(id);
  }
  
  // Update valuation
  async function actualizarValoracion(etfId, valorPorParticipacion, divisa = 'EUR', tipoCambioAEUR = 1, fuente = 'Manual') {
    const fechaActual = new Date();
    const fechaHora = fechaActual.toISOString();
    const fecha = fechaActual.toISOString().split('T')[0];
    
    const comprasETF = await db.compras.where({ etfId }).toArray();
    const totalParticipaciones = calc.calcularTotalParticipaciones(comprasETF);
    const valorTotal = calc.calcularValorActual(totalParticipaciones, valorPorParticipacion) * tipoCambioAEUR;
    
    return await db.valoraciones.add({
      etfId,
      fechaHora,
      fecha,
      valorPorParticipacion: parseFloat(valorPorParticipacion),
      valorTotal, // En euros
      divisa,
      tipoCambioAEUR,
      fuente
    });
  }

  // Delete valuation
  async function eliminarValoracion(id) {
    return await db.valoraciones.delete(id);
  }
  
  // Get summary per ETF
  function getResumenPorETF(etfId) {
    if (!compras || !valoraciones) return null;
    
    const comprasETF = compras.filter(c => c.etfId === etfId);
    
    // Conseguir la valoración más reciente de este ETF
    const valoracionesETF = valoraciones.filter(v => v.etfId === etfId).sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
    const ultimaValoracion = valoracionesETF[0];
    
    const totalInvertido = calc.calcularTotalInvertido(comprasETF);
    const totalParticipaciones = calc.calcularTotalParticipaciones(comprasETF);
    const precioMedio = calc.calcularPrecioMedio(comprasETF);
    
    // Si tenemos una valoración, usamos su valorTotal. Si no, tomamos el capital aportado.
    let valorActual = totalInvertido;
    let fechaUltimaValoracion = null;

    if (ultimaValoracion) {
      valorActual = ultimaValoracion.valorTotal;
      fechaUltimaValoracion = ultimaValoracion.fechaHora;
    }
    
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
      ultimaValoracion: ultimaValoracion?.valorPorParticipacion || 0,
      fechaUltimaValoracion
    };
  }
  
  // Get global summary
  function getResumenGlobal() {
    if (!etfs || !compras || !valoraciones) return null;
    
    let totalInvertidoGlobal = 0;
    let valorActualGlobal = 0;
    let valoracionesFaltantes = false;
    let fechaUltimaValoracionGlobal = null;

    etfs.forEach(etf => {
      const resumen = getResumenPorETF(etf.id);
      if (resumen) {
        totalInvertidoGlobal += resumen.totalInvertido;
        valorActualGlobal += resumen.valorActual;
        
        if (resumen.totalInvertido > 0 && !resumen.fechaUltimaValoracion) {
          valoracionesFaltantes = true;
        }

        if (resumen.fechaUltimaValoracion) {
          if (!fechaUltimaValoracionGlobal || resumen.fechaUltimaValoracion > fechaUltimaValoracionGlobal) {
            fechaUltimaValoracionGlobal = resumen.fechaUltimaValoracion;
          }
        }
      }
    });

    const gananciaGlobal = calc.calcularGanancia(valorActualGlobal, totalInvertidoGlobal);
    const rentabilidadGlobal = calc.calcularRentabilidad(valorActualGlobal, totalInvertidoGlobal);

    return {
      totalInvertido: totalInvertidoGlobal,
      valorActual: valorActualGlobal,
      ganancia: gananciaGlobal,
      rentabilidad: rentabilidadGlobal,
      valoracionesFaltantes,
      fechaUltimaValoracion: fechaUltimaValoracionGlobal
    };
  }
  
  // Get chart data (evolution over time) mapping invested vs real valuation
  function getDatosGrafico() {
    if (!compras || compras.length === 0) return [];
    
    // Crear una línea de tiempo ordenada de eventos (compras y valoraciones)
    const eventos = [];
    
    compras.forEach(c => {
      eventos.push({ tipo: 'compra', fecha: c.fecha, data: c });
    });
    
    valoraciones.forEach(v => {
      // Usar solo la fecha en formato YYYY-MM-DD para combinar eventos del mismo día
      eventos.push({ tipo: 'valoracion', fecha: v.fecha, data: v });
    });
    
    // Ordenar cronológicamente
    eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));
    
    const data = [];
    let invertidoAcumulado = 0;
    
    // Agrupar por día
    const eventosPorDia = {};
    eventos.forEach(ev => {
      if (!eventosPorDia[ev.fecha]) eventosPorDia[ev.fecha] = { invertidoAcumulado: 0, valorReal: null, etfsValues: {} };
      
      if (ev.tipo === 'compra') {
        invertidoAcumulado += ev.data.importe;
      } else if (ev.tipo === 'valoracion') {
        eventosPorDia[ev.fecha].etfsValues[ev.data.etfId] = ev.data.valorTotal;
      }
      
      eventosPorDia[ev.fecha].invertidoAcumulado = invertidoAcumulado;
    });

    // Calcular el valor real total para cada día que tiene valoraciones
    let ultimoValorConocidoGlobal = 0;
    let ultimosValoresETF = {};

    Object.keys(eventosPorDia).sort().forEach(fecha => {
      const dia = eventosPorDia[fecha];
      let valorDia = 0;
      let huboValoracion = false;
      
      // Actualizamos los últimos valores conocidos para cada ETF
      Object.keys(dia.etfsValues).forEach(etfId => {
        ultimosValoresETF[etfId] = dia.etfsValues[etfId];
        huboValoracion = true;
      });

      // Si no hubo valoración este día, asumimos que el valor de la cartera es el invertido acumulado
      // (a menos que tengamos valoraciones antiguas, en cuyo caso podríamos interpolar, pero para simplificar 
      // usaremos el invertido como base de los ETFs sin valorar)
      if (huboValoracion) {
        valorDia = Object.values(ultimosValoresETF).reduce((a, b) => a + b, 0);
        ultimoValorConocidoGlobal = valorDia;
      } else {
        valorDia = ultimoValorConocidoGlobal > 0 ? ultimoValorConocidoGlobal : dia.invertidoAcumulado;
      }
      
      data.push({
        fecha,
        invertido: dia.invertidoAcumulado,
        valorActual: valorDia
      });
    });

    return data;
  }

  // Wipe Data safely
  async function wipeData() {
    await db.compras.clear();
    await db.valoraciones.clear();
    await db.evaluaciones.clear();
  }

  return { 
    etfs, 
    compras, 
    valoraciones, 
    agregarCompra, 
    eliminarCompra, 
    actualizarValoracion,
    eliminarValoracion,
    getResumenPorETF, 
    getResumenGlobal, 
    getDatosGrafico,
    wipeData,
    isLoading: !etfs || !compras || !valoraciones 
  };
}
