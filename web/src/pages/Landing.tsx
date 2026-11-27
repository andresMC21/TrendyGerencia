import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { Header } from '../components/Brand';
import { useSession } from '../lib/session';

/** Objetos de la portada: [imagen, categoría, posición escritorio, posición celular, ancho, giro, profundidad]. */
type Obj = [string, string, string, [string, string], [string, string, string] | null, string, number, number];
const OBJS: Obj[] = [
  ['bici', 'deportes', 'Deportes', ['70%', '8%'], ['58%', 'auto', 'bottom:20%'], 'clamp(70px,8vw,118px)', -4, 10],
  ['camara', 'tecnologia', 'Tecnología', ['max(56%,620px)', '16%'], null, 'clamp(48px,5vw,76px)', 6, 14],
  ['chaqueta', 'ropa', 'Ropa y accesorios', ['90%', '14%'], null, 'clamp(44px,4.4vw,66px)', 5, 8],
  ['libros', 'libros', 'Libros', ['max(56%,640px)', '52%'], ['6%', 'auto', 'bottom:6%'], 'clamp(50px,5.2vw,78px)', -3, 12],
  ['planta', 'hogar', 'Hogar', ['83%', '38%'], ['74%', 'auto', 'bottom:4%'], 'clamp(48px,5vw,74px)', 3, 9],
  ['silla', 'muebles', 'Muebles', ['69%', '44%'], null, 'clamp(58px,6vw,90px)', -2, 6],
  ['audifonos', 'tecnologia', 'Tecnología', ['60%', '76%'], ['40%', 'auto', 'bottom:9%'], 'clamp(44px,4.4vw,66px)', 8, 13],
  ['lampara', 'hogar', 'Hogar', ['79%', '70%'], ['8%', 'auto', 'bottom:24%'], 'clamp(44px,4.4vw,66px)', -6, 7],
  ['guitarra', 'otros', 'Instrumentos', ['92%', '66%'], null, 'clamp(42px,4.2vw,62px)', 12, 11],
  ['zapatos', 'ropa', 'Ropa y accesorios', ['max(45%,520px)', '86%'], null, 'clamp(46px,4.6vw,68px)', -5, 9],
  ['camara', 'tecnologia', 'Tecnología', ['3%', '5%'], null, 'clamp(38px,3.6vw,54px)', -8, 5],
  ['planta', 'hogar', 'Hogar', ['22%', '3%'], null, 'clamp(34px,3.2vw,48px)', 5, 4],
  ['guitarra', 'otros', 'Instrumentos', ['40%', '6%'], null, 'clamp(32px,3vw,44px)', -12, 6],
  ['libros', 'libros', 'Libros', ['3%', '87%'], null, 'clamp(42px,4vw,60px)', 4, 5],
  ['lampara', 'hogar', 'Hogar', ['16%', '90%'], null, 'clamp(34px,3.2vw,48px)', 8, 4],
  ['audifonos', 'tecnologia', 'Tecnología', ['32%', '91%'], null, 'clamp(32px,3vw,44px)', -6, 6],
].map(([img, id, cat, d, m, w, r, depth]) => [img, id, cat, d, m, w, r, depth] as unknown as Obj);

const CATS: [string, string, string, string][] = [
  ['bici', 'deportes', 'Deportes', 'Bicis, patines, pesas'],
  ['silla', 'muebles', 'Muebles', 'Sillas, mesas, repisas'],
  ['libros', 'libros', 'Libros', 'Novelas, textos, cómics'],
  ['chaqueta', 'ropa', 'Ropa', 'Chaquetas, tenis, bolsos'],
  ['camara', 'tecnologia', 'Tecnología', 'Cámaras, audífonos'],
  ['planta', 'hogar', 'Hogar', 'Plantas, lámparas, cocina'],
  ['guitarra', 'otros', 'Instrumentos', 'Guitarras, teclados'],
  ['zapatos', 'ropa', 'Calzado', 'Tenis, botas, sandalias'],
];

export default function Landing() {
  const { user } = useSession();
  const hero = useRef<HTMLElement>(null);
  const objs = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width:600px)').matches);
  const publicar = user ? '/publicar' : '/registro';

  useEffect(() => {
    const mq = window.matchMedia('(max-width:600px)');
    const on = () => setMobile(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver((es) => {
      for (const en of es) {
        if (!en.isIntersecting) continue;
        en.target.classList.add('in');
        if (en.target.id === 'receipt') window.setTimeout(() => document.getElementById('stamp')?.classList.add('on'), 450);
        io.unobserve(en.target);
      }
    }, { threshold: 0.25 });
    document.querySelectorAll('.pg-land .rv').forEach((el, i) => {
      if (el.classList.contains('cat')) (el as HTMLElement).style.transitionDelay = `${(i % 4) * 60}ms`;
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const move = (e: React.MouseEvent) => {
    if (mobile || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !hero.current || !objs.current) return;
    const r = hero.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    for (const o of Array.from(objs.current.children) as HTMLElement[]) {
      const d = Number(o.dataset.d);
      o.style.setProperty('--px', `${(-x * d).toFixed(1)}px`);
      o.style.setProperty('--py', `${(-y * d).toFixed(1)}px`);
    }
  };
  const leave = () => objs.current?.querySelectorAll<HTMLElement>('.obj').forEach((o) => { o.style.setProperty('--px', '0px'); o.style.setProperty('--py', '0px'); });

  return (
    <div className="pg-land">
      <Header land />
      <main id="contenido">
        <section className="hero" ref={hero} onMouseMove={move} onMouseLeave={leave}>
          <svg className="grain" aria-hidden="true"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves={2} stitchTiles="stitch" /><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .4 0" /></filter><rect width="100%" height="100%" filter="url(#g)" /></svg>
          <div className="glow" />
          <div className="stage">
            <div className="objs" ref={objs}>
              {OBJS.map(([img, id, cat, d, m, w, r, depth], i) => {
                const pos = mobile && m
                  ? { left: m[0], top: m[1], bottom: m[2].replace('bottom:', ''), '--w': img === 'bici' ? '96px' : '60px' }
                  : { left: d[0], top: d[1], '--w': w };
                return (
                  <Link key={i} className={`obj${m ? '' : ' m-hide'}`} to={`/explorar?categoria=${id}`} data-d={depth} style={{ ...pos, ['--r' as string]: `${r}deg` } as CSSProperties} aria-label={`Ver ${cat}`}>
                    <span className="tip">Ver {cat.toLowerCase()} →</span>
                    <img src={`/img/${img}.webp`} alt="" />
                  </Link>
                );
              })}
            </div>
            <div className="copy">
              <p className="kick">De Cali, para Cali</p>
              <h1>Las buenas cosas merecen <em>otra vida.</em></h1>
              <p className="lead">Eso que ya no usas puede ser justo lo que alguien busca. Vende, encuentra e intercambia cerca de ti.</p>
              <div className="acts">
                <a className="btn" href="#categorias">Encuentra algo tuyo <span className="ar" aria-hidden="true">→</span></a>
                <Link className="btn2" to={publicar}>Quiero publicar <span className="ar" aria-hidden="true">↗</span></Link>
              </div>
            </div>
            <a className="scrollcue" href="#categorias">Explora por categoría<span aria-hidden="true">↓</span></a>
          </div>
        </section>

        <section className="band" id="categorias">
          <div className="wrap">
            <div className="sh rv"><div><h2>¿Qué te gustaría encontrar?</h2><p className="sub">Entra directo a lo que buscas.</p></div></div>
            <div className="cats">
              {CATS.map(([img, id, n, s]) => (
                <Link key={n} className="cat rv" to={`/explorar?categoria=${id}`}>
                  <img src={`/img/${img}.webp`} alt="" />
                  <span><b>{n}</b><small>{s}</small></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="band how">
          <div className="wrap">
            <div className="sh rv" style={{ justifyContent: 'center', textAlign: 'center' }}><div><h2>Así de sencillo</h2><p className="sub" style={{ marginInline: 'auto' }}>Tres pasos y tu objeto sigue su historia.</p></div></div>
            <div className="receipt rv" id="receipt">
              <div className="rh">
                <div><span className="rk">Recibo de trueque</span><span className="rn">Nº 0127 · Cali</span></div>
                <span className="stamp" id="stamp"><span aria-hidden="true">✓</span> Acordado</span>
              </div>
              <ol className="steps">
                <li><span className="n">1</span><div><h3>Haz espacio</h3><p>Describe lo que ya no usas, ponle precio y decide si aceptas trueque.</p></div></li>
                <li><span className="n">2</span><div><h3>Pónganse de acuerdo</h3><p>Elijan un punto seguro y un horario que les funcione a los dos.</p></div></li>
                <li><span className="n">3</span><div><h3>Que siga su historia</h3><p>Revisen el objeto en persona, confirmen el intercambio y califíquense.</p></div></li>
              </ol>
            </div>
          </div>
        </section>

        <section className="band close">
          <div className="wrap rv">
            <h2>Tu próximo hallazgo <em>puede estar en tu barrio.</em></h2>
            <p className="sub">Granada, San Antonio, El Ingenio, Ciudad Jardín… Explora lo que hay cerca de ti.</p>
            <a className="btn" href="#categorias">Empieza a explorar <span className="ar" aria-hidden="true">→</span></a>
          </div>
          <img className="deco" src="/img/bici.webp" alt="" aria-hidden="true" />
          <div className="wrap">
            <footer className="foot">
              <span><strong>Trendy</strong> · De Cali, para Cali</span>
              <nav aria-label="Pie de página"><Link to="/explorar">Explorar</Link><Link to={publicar}>Publicar</Link>{!user && <Link to="/ingresar">Ingresar</Link>}</nav>
              <span>© 2026</span>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
