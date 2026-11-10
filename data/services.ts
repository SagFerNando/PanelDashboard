import { supabase } from "./supabase";

// Obtener el conteo total de usuarios registrados
export async function getTotalUsuariosCount() {
  const { count, error } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

// Obtener la lista de pagos con las relaciones (suscripciones -> usuarios)
export async function getPagosConRelaciones() {
  const { data, error } = await supabase
    .from("pagos")
    .select(
      `
      id,
      tipo_pago,
      monto,
      estado,
      created_at,
      suscripciones (
        estado,
        usuarios (
          nombre,
          telegram_id
        )
      )
    `,
    )
    .eq("estado", "aprobado")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}
// 2. Obtener la suma total de ingresos (columna 'monto' en la tabla 'pagos')
export async function getTotalIngresos(): Promise<number> {
  // Consultamos la columna 'monto' de los pagos
  const { data, error } = await supabase
    .from("pagos")
    .select("monto")
    .eq("estado", "aprobado");

  if (error) throw error;

  // Sumamos los montos del array recibido
  const total =
    data?.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0) ?? 0;
  return total;
}

export interface PagoGrafica {
  created_at: string;
  monto: number;
}

//funcion de pagos para la grafica
export async function getPagosParaGrafica(): Promise<PagoGrafica[]> {
  const { data, error } = await supabase
    .from("pagos")
    .select("created_at, monto")
    .eq("estado", "aprobado"); // Cambia por tu estado (ej: "Aceptado")

  if (error) throw error;
  return data ?? [];
}

export async function getTotalSuscripcionesActivas(): Promise<number> {
  const { count, error } = await supabase
    .from("suscripciones")
    .select("*", { count: "exact", head: true })
    .eq("estado", "activa");

  if (error) throw error;

  return count ?? 0;
}
