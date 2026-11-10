import { useMemo, useState, useEffect } from "react";
import {
  getTotalUsuariosCount,
  getPagosConRelaciones,
  getTotalIngresos,
  getPagosParaGrafica,
  PagoGrafica,
  getTotalSuscripcionesActivas,
} from "../data/services";

type Section =
  | "Resumen"
  | "Ingresos"
  | "Suscripciones"
  | "Pagos"
  | "Usuarios"
  | "Informes";

const sections: Section[] = [
  "Resumen",
  "Ingresos",
  "Suscripciones",
  "Pagos",
  "Usuarios",
  "Informes",
];

const data: Record<Section, number[]> = {
  Resumen: [18, 24, 22, 34, 31, 45, 43, 55, 62, 58, 73, 84],
  Ingresos: [20, 27, 26, 38, 35, 49, 47, 61, 67, 65, 79, 91],
  Suscripciones: [12, 17, 21, 25, 29, 36, 39, 46, 52, 58, 63, 71],
  Pagos: [28, 23, 31, 35, 32, 43, 48, 51, 59, 56, 66, 78],
  Usuarios: [15, 18, 23, 30, 28, 38, 45, 48, 57, 64, 70, 76],
  Informes: [16, 21, 19, 29, 35, 33, 44, 50, 48, 62, 69, 80],
};

// Interfaz para mapear los pagos reales de Supabase
interface PagoReal {
  id: number;
  tipo_pago: string;
  monto: number;
  estado: string;
  created_at: string;
  suscripciones?: {
    estado?: string;
    usuarios?: {
      nombre?: string;
      telegram_id?: number;
    };
  };
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [section, setSection] = useState<Section>("Resumen");
  const [period, setPeriod] = useState<"7D" | "1M" | "3M" | "1A">("1A");

  // Estados para guardar los datos recibidos de Supabase
  const [totalUsuarios, setTotalUsuarios] = useState<number | string>("...");
  const [totalIngresos, setTotalIngresos] = useState<number>(0.0);
  const [paymentsList, setPaymentsList] = useState<PagoReal[]>([]);
  const [loading, setLoading] = useState(true);
  const [suscripciones, setsuscripciones] = useState<number>(0.0);

  const [rawPagos, setRawPagos] = useState<PagoGrafica[]>([]);
  var pagoscomp = 0;
  useEffect(() => {
    async function initSupabaseData() {
      try {
        // 1. Obtener conteo de usuarios y validar conexión
        const countUsuarios = await getTotalUsuariosCount();
        alert("¡Conexión a Supabase realizada con éxito!");
        setTotalUsuarios(countUsuarios);

        const ingresos = await getTotalIngresos();

        setTotalIngresos(ingresos);

        // 2. Traer los pagos asociando las tablas
        const dataPagos = await getPagosConRelaciones();
        setPaymentsList(dataPagos as unknown as PagoReal[]);
        pagoscomp = dataPagos.length;
        const suscription = await getTotalSuscripcionesActivas();
        setsuscripciones(suscription);

        try {
          const pagosGrafica = await getPagosParaGrafica();
          setRawPagos(pagosGrafica);
        } catch (err) {
          console.error("Error al cargar gráfica:", err);
        }
      } catch (err: any) {
        console.error("Error al consultar Supabase:", err);
        // Imprime err.message o el objeto serializado si viene de Supabase
        alert(
          "Error de conexión con Supabase: " +
            (err.message || JSON.stringify(err)),
        );
      } finally {
        setLoading(false);
      }
    }

    initSupabaseData();
  }, []);

  // 1. Calcular las etiquetas del eje X y los datos agrupados por período
  const { labels, values, totalPeriodo } = useMemo(() => {
    const now = new Date();

    // --- OPCIÓN 1: 1 AÑO (1A) ---
    if (period === "1A") {
      const mesesLabels = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
      ];
      const mesesValores = new Array(12).fill(0);
      let suma = 0;

      rawPagos.forEach((pago) => {
        if (!pago.created_at) return;
        const fecha = new Date(pago.created_at);
        if (fecha.getFullYear() === now.getFullYear()) {
          const mesIndex = fecha.getMonth();
          if (mesIndex >= 0 && mesIndex < 12) {
            const monto = Number(pago.monto) || 0;
            mesesValores[mesIndex] += monto;
            suma += monto;
          }
        }
      });

      return { labels: mesesLabels, values: mesesValores, totalPeriodo: suma };
    }

    // --- OPCIÓN 2: 3 MESES (3M) ---
    else if (period === "3M") {
      const mesesNombres = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
      ];
      const labels3M: string[] = [];
      const values3M = [0, 0, 0];
      let suma = 0;

      // Obtener los nombres de los últimos 3 meses (ej: Sep, Oct, Nov)
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels3M.push(mesesNombres[d.getMonth()]);
      }

      const hace3Meses = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      hace3Meses.setHours(0, 0, 0, 0);

      rawPagos.forEach((pago) => {
        if (!pago.created_at) return;
        const fecha = new Date(pago.created_at);
        if (fecha >= hace3Meses) {
          // Calcular a cuál de los 3 meses pertenece
          const diffMeses =
            (now.getFullYear() - fecha.getFullYear()) * 12 +
            (now.getMonth() - fecha.getMonth());
          const idx = 2 - diffMeses;
          if (idx >= 0 && idx < 3) {
            const monto = Number(pago.monto) || 0;
            values3M[idx] += monto;
            suma += monto;
          }
        }
      });

      return { labels: labels3M, values: values3M, totalPeriodo: suma };
    }

    // --- OPCIÓN 3: 1 MES (1M) ---
    else if (period === "1M") {
      const semanasLabels = ["Sem 1", "Sem 2", "Sem 3", "Sem 4"];
      const semanasValores = [0, 0, 0, 0];
      let suma = 0;
      const limite30Dias = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      rawPagos.forEach((pago) => {
        if (!pago.created_at) return;
        const fecha = new Date(pago.created_at);
        if (fecha >= limite30Dias) {
          const diffDias = Math.floor(
            (now.getTime() - fecha.getTime()) / (1000 * 3600 * 24),
          );
          const idx = Math.min(3, Math.max(0, 3 - Math.floor(diffDias / 7.5)));
          const monto = Number(pago.monto) || 0;
          semanasValores[idx] += monto;
          suma += monto;
        }
      });

      return {
        labels: semanasLabels,
        values: semanasValores,
        totalPeriodo: suma,
      };
    }

    // --- OPCIÓN 4: 7 DÍAS (7D) ---
    else {
      const diasLabels: string[] = [];
      const diasValores = new Array(7).fill(0);
      let suma = 0;

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        diasLabels.push(d.toLocaleDateString("es-MX", { weekday: "short" }));
      }

      const limite7Dias = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      limite7Dias.setHours(0, 0, 0, 0);

      rawPagos.forEach((pago) => {
        if (!pago.created_at) return;
        const fecha = new Date(pago.created_at);
        if (fecha >= limite7Dias) {
          const diffMs = now.getTime() - fecha.getTime();
          const diffDias = Math.floor(diffMs / (1000 * 3600 * 24));
          const idx = 6 - diffDias;
          if (idx >= 0 && idx < 7) {
            const monto = Number(pago.monto) || 0;
            diasValores[idx] += monto;
            suma += monto;
          }
        }
      });

      return { labels: diasLabels, values: diasValores, totalPeriodo: suma };
    }
  }, [period, rawPagos]);

  const totalPeriodoFormateado = useMemo(() => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(totalPeriodo);
  }, [totalPeriodo]);

  // 2. Convertir los valores agrupados a puntos del SVG
  // Cálculo de coordenadas SVG perfectamente alineadas al eje Y
  const points = useMemo(() => {
    if (!values || values.length === 0) return "0,220";

    const maxVal = Math.max(...values);

    // Si el valor máximo es 0, dibuja una línea plana en la base (y = 220)
    if (maxVal === 0) {
      return values
        .map((_, index) => {
          const x = (index / (values.length - 1)) * 760;
          return `${x},220`;
        })
        .join(" ");
    }

    // Mapeo proporcional exacto:
    // y = 220 es el 0, y = 20 es el maxVal (recorre exactamente 200px)
    return values
      .map((val, index) => {
        const x = (index / (values.length - 1)) * 760;
        const y = 220 - (val / maxVal) * 200;
        return `${x},${y}`;
      })
      .join(" ");
  }, [values]);

  const yAxisScale = useMemo(() => {
    if (!values || values.length === 0) return ["$0", "$0", "$0", "$0", "$0"];

    const maxVal = Math.max(...values);
    // Si no hay ingresos en el período, mostramos $0 en todas las marcas
    if (maxVal === 0) return ["$0", "$0", "$0", "$0", "$0"];

    // 5 marcas alineadas con las líneas del SVG (y: 20, 70, 120, 170, 220)
    const step = maxVal / 4;
    const scale = [
      maxVal, // Corresponde a y = 20 (Top)
      maxVal - step, // Corresponde a y = 70
      maxVal - step * 2, // Corresponde a y = 120
      maxVal - step * 3, // Corresponde a y = 170
      0, // Corresponde a y = 220 (Base)
    ];

    // Formato oficial en pesos mexicanos (MXN)
    return scale.map((val) =>
      new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
      }).format(val),
    );
  }, [values]);

  const selectSection = (item: Section) => {
    setSection(item);
    setMenuOpen(false);
  };

  // Construimos las métricas dinámicas
  const metrics = [
    ["Ingresos totales", `$${totalIngresos.toFixed(2)} MXN.`, "+18,2%"],
    ["Numero de Suscripciones Activas", `${suscripciones}`, "+12,8%"],
    ["Usuarios Activos", `${totalUsuarios}`, "+4,6%"], // Total de la tabla usuarios
    ["Pagos completados", `${pagoscomp}`, "+9,1%"],
  ];

  return (
    <div className="min-vh-100 bg-body-tertiary">
      <button
        className={`btn btn-primary menu-toggle shadow ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
      >
        {menuOpen ? "×" : "☰"}
      </button>

      <aside
        className={`sidebar bg-white border-end ${menuOpen ? "show" : ""}`}
      >
        <div className="p-4 border-bottom">
          <h4 className="mb-1 text-primary fw-bold">Telegram</h4>
          <small className="text-secondary">Panel de datos</small>
        </div>
        <nav className="nav nav-pills flex-column gap-2 p-3">
          {sections.map((item) => (
            <button
              key={item}
              className={`nav-link text-start ${section === item ? "active" : "text-secondary"}`}
              onClick={() => selectSection(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="mt-auto p-3 border-top">
          <div className="small fw-semibold">Sag Nando</div>
          <div className="small text-secondary">Administradora</div>
        </div>
      </aside>

      {menuOpen && (
        <button
          className="sidebar-backdrop border-0"
          onClick={() => setMenuOpen(false)}
          aria-label="Cerrar menú"
        />
      )}

      <main className="container py-5">
        <header className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4 ps-5">
          <div>
            <div className="text-primary small fw-bold text-uppercase">
              Panel de control
            </div>
            <h1 className="h2 fw-bold mb-1">{section}</h1>
            <p className="text-secondary mb-0">
              Consulta el crecimiento de tu negocio.
            </p>
          </div>
          <button className="btn btn-outline-primary btn-sm">
            Exportar informe
          </button>
        </header>

        <section className="row g-3 mb-4">
          {metrics.map(([label, value, change]) => (
            <div className="col-12 col-sm-6 col-xl-3" key={label}>
              <article className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-secondary small">{label}</div>
                  <div className="h4 fw-bold my-2">{value}</div>
                  <span className="badge text-bg-success">{change}</span>
                  <small className="text-secondary ms-2">este período</small>
                </div>
              </article>
            </div>
          ))}
        </section>
        {/* SECCION DE LA GRAFICA */}

        <section className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
              <div>
                <small className="text-secondary">
                  Resumen acumulado ({period})
                </small>
                {/* Muestra el total acumulado real del período seleccionado */}
                <h2 className="h4 fw-bold mb-0">
                  ${totalPeriodo.toFixed(2)} MXN.
                </h2>
              </div>

              {/* Selector con las 4 opciones incluyendo 3M */}
              <div className="btn-group btn-group-sm" role="group">
                {(["7D", "1M", "3M", "1A"] as const).map((item) => (
                  <button
                    key={item}
                    className={`btn ${period === item ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setPeriod(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Contenedor Eje Y + SVG */}
            <div className="d-flex align-items-stretch gap-3">
              <div
                className="d-flex flex-column justify-content-between text-end text-secondary small pe-2"
                style={{ height: "240px", minWidth: "65px" }}
              >
                {yAxisScale.map((label, idx) => (
                  <span
                    key={idx}
                    className="lh-1"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div className="flex-grow-1">
                <div
                  className="chart-container"
                  style={{ position: "relative", height: "240px" }}
                >
                  <svg
                    viewBox="0 0 760 240"
                    preserveAspectRatio="none"
                    className="w-100 h-100"
                  >
                    {[20, 70, 120, 170, 220].map((y) => (
                      <line
                        key={y}
                        x1="0"
                        y1={y}
                        x2="760"
                        y2={y}
                        className="chart-grid"
                      />
                    ))}
                    <polyline points={points} className="chart-line" />
                  </svg>
                </div>

                {/* Eje X */}
                <div className="d-flex justify-content-between text-secondary chart-months mt-2">
                  {labels.map((label, idx) => (
                    <span key={idx}>{label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* TERMINA SECCION DE LA GRAFICA */}

        <section className="card border-0 shadow-sm">
          <div className="card-header bg-white p-4">
            <h2 className="h5 fw-bold mb-1">Últimos pagos</h2>
            <p className="small text-secondary mb-0">
              Detalle de las transacciones recientes.
            </p>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  {["Usuario", "Plan", "Fecha", "Importe", "Estado"].map(
                    (heading) => (
                      <th
                        className="px-4 py-3 small text-secondary"
                        key={heading}
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-secondary">
                      Cargando registros desde Supabase...
                    </td>
                  </tr>
                ) : paymentsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-secondary">
                      No se encontraron registros de pagos.
                    </td>
                  </tr>
                ) : (
                  paymentsList.map((pago) => {
                    const usuarioNombre =
                      pago.suscripciones?.usuarios?.nombre ||
                      pago.suscripciones?.usuarios?.telegram_id ||
                      "Usuario sin nombre";
                    const planNombre = pago.tipo_pago || "Verificado";
                    const fechaFormateada = new Date(
                      pago.created_at,
                    ).toLocaleDateString();

                    return (
                      <tr key={pago.id}>
                        <td className="px-4 fw-semibold">{usuarioNombre}</td>
                        <td>{planNombre}</td>
                        <td className="text-secondary">{fechaFormateada}</td>
                        <td className="fw-semibold">
                          ${pago.monto.toFixed(2)} MXN.
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              pago.estado === "Pendiente"
                                ? "text-bg-warning"
                                : "text-bg-success"
                            }`}
                          >
                            {pago.estado}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-center text-secondary small mt-4">
          Datos de demostración. Conecta Supabase para utilizar datos reales.
        </p>
      </main>
    </div>
  );
}

export default App;
