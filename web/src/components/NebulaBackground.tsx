import { useEffect, useRef } from 'react';
import { useTheme } from '../lib/theme';

// One transparent photographic atlas, sampled as nine independent objects.
const ATLAS = '/images/nebula/objects-realistic-v1.png';
const ATLAS_COLUMNS = 3;
const ATLAS_ROWS = 3;

/** Layered light curtains, with a soft vertical falloff rather than solid waves. */
function drawAurora(context: CanvasRenderingContext2D, width: number, height: number, time: number, dark: boolean) {
  const palettes = ['74, 218, 166', '76, 182, 215', '153, 125, 218'];
  const step = width < 680 ? 8 : 10;
  context.save();
  context.globalCompositeOperation = dark ? 'screen' : 'source-over';
  for (let band = 0; band < palettes.length; band++) {
    const phase = time * .000055 + band * 1.9;
    for (let x = -step; x <= width; x += step) {
      const position = x / width;
      const wave = Math.sin(position * Math.PI * 2.2 + phase);
      const crest = height * (.07 + band * .16 + wave * .09 + Math.cos(position * 4 - phase * .7) * .035);
      const length = height * (.26 + Math.sin(position * 5 + phase) * .09);
      const edge = Math.pow(Math.max(0, Math.sin(Math.PI * Math.max(0, Math.min(1, position)))), .6);
      const strength = (dark ? .25 : .105) * edge * (.7 + Math.sin(position * 31 + band) * .3);
      const gradient = context.createLinearGradient(0, crest - 30, 0, crest + length);
      gradient.addColorStop(0, `rgba(${palettes[band]}, 0)`);
      gradient.addColorStop(.18, `rgba(${palettes[band]}, ${strength * .35})`);
      gradient.addColorStop(.32, `rgba(${palettes[band]}, ${strength})`);
      gradient.addColorStop(.52, `rgba(${palettes[band]}, ${strength * .45})`);
      gradient.addColorStop(1, `rgba(${palettes[band]}, 0)`);
      context.fillStyle = gradient;
      context.fillRect(x, crest - 30, step, length + 30);
    }
  }
  context.restore();
}

export function NebulaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const atlas = new Image();
    let disposed = false;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastFrame = 0;
    let elapsed = 0;
    let previousTime = 0;
    let targetX = 0;
    let targetY = 0;
    let pointerX = 0;
    let pointerY = 0;
    const dark = theme === 'dark';
    const colors = dark ? ['133, 193, 212', '158, 155, 219', '119, 190, 176', '204, 192, 157'] : ['67, 113, 142', '114, 111, 163', '65, 127, 123', '153, 133, 94'];
    // A fixed seed prevents the galaxy from jumping on a theme change.
    let seed = 42;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const objects = Array.from({ length: 68 }, (_, index) => ({
      radius: Math.sqrt((index + 6) / 74), angle: index * 2.39996 + random() * .45,
      size: 46 + random() * 40, rotation: (random() - .5) * 1.2,
      depth: .4 + random() * .6, sprite: index % (ATLAS_COLUMNS * ATLAS_ROWS),
    }));
    const stars = Array.from({ length: 180 }, () => ({ x: random(), y: random(), size: .45 + random() * 1.05, phase: random() * Math.PI * 2 }));

    const draw = () => {
      context.clearRect(0, 0, width, height);
      const small = width < 680;
      const orbit = Math.max(width * .58, height * .72);
      const time = media.matches ? 0 : elapsed;
      drawAurora(context, width, height, time, dark);
      pointerX += (targetX - pointerX) * .035;
      pointerY += (targetY - pointerY) * .035;
      for (const star of stars.slice(0, small ? 100 : stars.length)) {
        const alpha = (dark ? .26 : .15) * (.7 + Math.sin(time * .00045 + star.phase) * .3);
        context.fillStyle = `rgba(${colors[0]}, ${alpha})`;
        context.beginPath();
        context.arc(star.x * width + pointerX * .15, star.y * height + pointerY * .15, star.size, 0, Math.PI * 2);
        context.fill();
      }
      const count = small ? 36 : objects.length;
      for (let i = 0; i < count; i++) {
        const object = objects[i]!;
        const angle = object.angle + time * .000004 * object.depth;
        const x = width * .52 + Math.cos(angle) * orbit * object.radius + pointerX * object.depth;
        const y = height * .48 + Math.sin(angle) * orbit * object.radius * .65 + Math.sin(time * .0003 + object.angle) * 6 + pointerY * object.depth;
        if (!atlas.complete || !atlas.naturalWidth || x < -70 || x > width + 70 || y < -70 || y > height + 70) continue;
        context.save();
        context.translate(x, y);
        context.rotate(object.rotation + Math.sin(time * .00012 + object.angle) * .12);
        const size = object.size * (small ? .8 : 1);
        const cellWidth = atlas.naturalWidth / ATLAS_COLUMNS;
        const cellHeight = atlas.naturalHeight / ATLAS_ROWS;
        context.globalAlpha = (dark ? .55 : .38) * object.depth;
        context.drawImage(atlas, (object.sprite % ATLAS_COLUMNS) * cellWidth, Math.floor(object.sprite / ATLAS_COLUMNS) * cellHeight, cellWidth, cellHeight, -size / 2, -size / 2, size, size);
        context.restore();
      }
    };
    const animate = (now: number) => {
      if (previousTime) elapsed += Math.min(now - previousTime, 80);
      previousTime = now;
      if (now - lastFrame >= 1000 / 30) { draw(); lastFrame = now; }
      frame = requestAnimationFrame(animate);
    };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; previousTime = 0; };
    const start = () => { stop(); if (!document.hidden && !media.matches) frame = requestAnimationFrame(animate); else draw(); };
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || media.matches) return;
      targetX = (event.clientX / width - .5) * 18;
      targetY = (event.clientY / height - .5) * 14;
    };
    const leave = () => { targetX = 0; targetY = 0; };
    atlas.onload = () => { if (!disposed) draw(); };
    atlas.src = ATLAS;
    resize(); start();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', start);
    media.addEventListener('change', start);
    return () => {
      disposed = true;
      atlas.onload = null;
      stop();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', start);
      media.removeEventListener('change', start);
    };
  }, [theme]);

  return <div className="nebula-background" aria-hidden="true"><div className="nebula-haze" /><canvas ref={canvasRef} /></div>;
}
