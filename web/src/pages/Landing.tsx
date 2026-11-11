import { Link } from 'react-router';
import { Footer, Header } from '../components/Brand';
import { useSession } from '../lib/session';

const CATEGORIES = [
  { id: 'hogar', title: 'Hogar', detail: 'Un nuevo lugar para lo cotidiano' },
  { id: 'libros', title: 'Libros', detail: 'Historias que siguen su camino' },
  { id: 'ropa', title: 'Ropa', detail: 'Otra forma de llevar tu estilo' },
  { id: 'tecnologia', title: 'Tecnología', detail: 'Mucho más por hacer' },
];
const STEPS = [
  { title: 'Haz espacio.', text: 'Describe lo que ya no usas, ponle precio y decide si aceptas trueque.' },
  { title: 'Pónganse de acuerdo.', text: 'Elijan un punto de encuentro y un horario que les funcione a ambos.' },
  { title: 'Que siga su historia.', text: 'Revisen el objeto en persona y confirmen juntos el intercambio.' },
];

export default function Landing() {
  const { user } = useSession();
  return (
    <>
      <Header />
      <main className="landing">
        <section className="hero">
          <div className="container hero-inner">
            <div className="hero-copy">
              <p className="eyebrow"><span className="live-dot" /> De Cali, para Cali</p>
              <h1>Las buenas cosas<br />merecen <em>otra vida.</em></h1>
              <p className="hero-lead">Eso que ya no usas puede ser justo lo que alguien busca. Vende, encuentra e intercambia cerca de ti.</p>
              <div className="hero-actions">
                <Link viewTransition to="/explorar" className="btn btn-primary btn-lg">Encuentra algo tuyo <span aria-hidden="true">↗</span></Link>
                <Link viewTransition to={user ? '/publicar' : '/registro'} className="btn btn-outline btn-lg">Quiero publicar</Link>
              </div>
              <p className="hero-note">Sin costo por publicar. Con mucho por descubrir.</p>
            </div>
            <div className="hero-showcase" aria-label="Explora objetos para darles una segunda vida">
              <div className="showcase-orbit" aria-hidden="true" />
              <Link viewTransition to="/explorar?categoria=libros" className="showcase-card showcase-book">
                <div className="book-art" aria-hidden="true"><span>OTRAS<br />FORMAS<br /><i>de vivir.</i></span></div>
                <div className="showcase-caption"><span>Una lectura pendiente</span><span aria-hidden="true">↗</span></div>
              </Link>
              <Link viewTransition to="/explorar?categoria=hogar" className="showcase-note"><span className="eyebrow">Un nuevo comienzo</span><strong>Menos guardado.<br /><em>Más vivido.</em></strong><span>Explora objetos para tu hogar ↗</span></Link>
              <span className="showcase-seal">Cerca de ti · Cali</span>
            </div>
          </div>
        </section>
        <section className="section category-section">
          <div className="container">
            <div className="section-heading"><div><p className="eyebrow">A tu manera</p><h2 className="section-title">¿Qué te gustaría encontrar?</h2></div><Link viewTransition to="/explorar" className="text-link">Ver todo <span aria-hidden="true">↗</span></Link></div>
            <div className="category-grid">
              {CATEGORIES.map((category, index) => <Link viewTransition key={category.id} to={'/explorar?categoria=' + category.id} className="category-card"><span className="category-number">0{index + 1}<span aria-hidden="true">↗</span></span><h3>{category.title}</h3><p>{category.detail}</p></Link>)}
            </div>
          </div>
        </section>
        <section className="section section--panel">
          <div className="container">
            <p className="eyebrow">Así de sencillo</p><h2 className="section-title">De tus manos a una nueva historia.</h2>
            <div className="steps">{STEPS.map((step, index) => <article className="step" key={step.title}><span className="step-label">0{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
            <div className="landing-invite"><p>Tu próximo hallazgo<br /><em>puede estar en tu barrio.</em></p><Link viewTransition to="/explorar" className="btn btn-primary btn-lg">Empieza a explorar <span aria-hidden="true">↗</span></Link></div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
