import { useMemo, useState, useEffect } from "react";
import {
  getTotalUsuariosCount,
  getPagosConRelaciones,
  getTotalIngresos,
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
  const [period, setPeriod] = useState("1A");

  // Estados para guardar los datos recibidos de Supabase
  const [totalUsuarios, setTotalUsuarios] = useState<number | string>("...");
  const [totalIngresos, setTotalIngresos] = useState<number | string>("...");
  const [paymentsList, setPaymentsList] = useState<PagoReal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initSupabaseData() {
      try {
        // 1. Obtener conteo de usuarios y validar conexión
        const countUsuarios = await getTotalUsuariosCount();
        alert("¡Conexión a Supabase realizada con éxito!");
        setTotalUsuarios(countUsuarios);

        const ingresos = await getTotalIngresos();
        const ingresosFormateados = new Intl.NumberFormat("es-ES", {
          style: "currency",
          currency: "MXN",
        }).format(ingresos);
        setTotalIngresos(ingresosFormateados);

        // 2. Traer los pagos asociando las tablas
        const dataPagos = await getPagosConRelaciones();
        setPaymentsList(dataPagos as unknown as PagoReal[]);
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

  const points = useMemo(() => {
    const count = { "7D": 5, "1M": 7, "3M": 9, "1A": 12 }[period] ?? 12;
    const values = data[section].slice(-count);
    return values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * 760;
        const y = 220 - (value / 100) * 200;
        return `${x},${y}`;
      })
      .join(" ");
  }, [period, section]);

  const selectSection = (item: Section) => {
    setSection(item);
    setMenuOpen(false);
  };

  // Construimos las métricas dinámicas
  const metrics = [
    ["Ingresos totales", `${totalIngresos}`, "+18,2%"],
    ["Numero de Suscripciones", "2.842", "+12,8%"],
    ["Usuarios Activos", `${totalUsuarios}`, "+4,6%"], // Total de la tabla usuarios
    ["Pagos completados", "1.429", "+9,1%"],
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

        <section className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
              <div>
                <small className="text-secondary">
                  Crecimiento de {section.toLowerCase()}
                </small>
                <h2 className="h4 fw-bold mb-0">
                  {section === "Usuarios" ? `${totalUsuarios}` : "€84.240"}
                </h2>
              </div>
              <div
                className="btn-group btn-group-sm"
                role="group"
                aria-label="Período"
              >
                {["7D", "1M", "3M", "1A"].map((item) => (
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

            <div className="chart-container">
              <svg
                viewBox="0 0 760 240"
                preserveAspectRatio="none"
                aria-label={`Gráfica de ${section}`}
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
            <div className="d-flex justify-content-between text-secondary chart-months">
              {["Ene", "Mar", "May", "Jul", "Sep", "Nov", "Dic"].map(
                (month) => (
                  <span key={month}>{month}</span>
                ),
              )}
            </div>
          </div>
        </section>

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
