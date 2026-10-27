import { Link } from 'react-router';
import { Dot, Footer, Header } from '../components/Brand';
import { useSession } from '../lib/session';

const BENEFICIOS = [
  'Reduce desorden y ansiedad en el hogar.',
  'Disminuye exposición a estafas y robos.',
  'Extiende la vida útil de objetos y baja el impacto ambiental.',
];

const PROPUESTA = [
  {
    tag: 'Seguridad y cercanía',
    color: 'blue',
    texto:
      'Puntos de encuentro seguros recomendados según la ubicación de ambas partes y el riesgo de la zona, con objetos del mismo barrio, cerca de ti.',
  },
  {
    tag: 'Confianza y agilidad',
    color: 'green',
    texto:
      'Usuarios verificados y con reputación, y la capacidad de publicar un objeto en menos de un minuto.',
  },
  {
    tag: 'Accesibilidad y sostenibilidad',
    color: 'purple',
    texto:
      'Publicar e intercambiar sin costo, lo que contribuye a generar menos desorden en casa y menos residuos.',
  },
];

const PASOS = [
  {
    n: '1',
    titulo: 'Publica',
    texto: 'Sube tu objeto con descripción, precio y fotos. Indica si aceptas trueque.',
  },
  {
    n: '2',
    titulo: 'Elige un punto seguro',
    texto: 'Trendy te recomienda puntos de encuentro con su nivel de riesgo y la distancia.',
  },
  {
    n: '3',
    titulo: 'Encuéntrate y califica',
    texto: 'Concreta la venta o el intercambio y deja una reseña para construir confianza.',
  },
];

export default function Landing() {
  const { user } = useSession();

  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container hero-inner">
            <p className="hero-lead">
              Para los caleños que quieren vender o intercambiar objetos en desuso pero temen ser
              víctimas de robos o estafas al reunirse con desconocidos, un espacio digital local:
              donde cualquier persona publique objetos en desuso con descripción, precio y fotos, y
              que recomiende automáticamente puntos de encuentro seguros según la ubicación de
              comprador/vendedor y el nivel de riesgo de la zona.
            </p>
            <ul className="benefits">
              {BENEFICIOS.map((b) => (
                <li key={b}>
                  <Dot />
                  {b}
                </li>
              ))}
            </ul>
            <div className="hero-actions">
              {user ? (
                <Link to="/inicio" className="btn btn-primary btn-lg">
                  Ir a mi Trendy
                </Link>
              ) : (
                <>
                  <Link to="/registro" className="btn btn-primary btn-lg">
                    Crear mi cuenta
                  </Link>
                  <Link to="/ingresar" className="btn btn-outline btn-lg">
                    Ya tengo cuenta
                  </Link>
                </>
              )}
            </div>
          </div>
          <span className="hero-bar" aria-hidden="true" />
        </section>

        <section className="section">
          <div className="container">
            <h2 className="section-title">Propuesta de valor</h2>
            <p className="section-sub">
              Una experiencia de intercambio y venta segura y ágil para el «ciudadano práctico» de
              Cali.
            </p>
            <div className="test-cards">
              {PROPUESTA.map((p) => (
                <article key={p.tag} className={`test-card test-card--${p.color}`}>
                  <h3>{p.tag}</h3>
                  <p>{p.texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--panel">
          <div className="container">
            <h2 className="section-title">¿Cómo funciona?</h2>
            <div className="steps">
              {PASOS.map((p) => (
                <div key={p.n} className="step">
                  <span className="step-label">PASO {p.n}</span>
                  <h3>{p.titulo}</h3>
                  <p>{p.texto}</p>
                </div>
              ))}
            </div>
            <div className="risk-demo">
              <span className="risk-demo-title">Puntos de encuentro recomendados</span>
              <div className="risk-row">
                <span className="risk-num risk-num--low">1</span>
                <div>
                  <strong>Parque Panamericano</strong>
                  <small>Mismo barrio · a 1,2 km de ti</small>
                </div>
                <span className="risk risk--low">Riesgo BAJO</span>
              </div>
              <div className="risk-row">
                <span className="risk-num risk-num--mid">2</span>
                <div>
                  <strong>Centro Comercial Centenario</strong>
                  <small>Zona comercial · a 2,5 km</small>
                </div>
                <span className="risk risk--mid">Riesgo MEDIO</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
