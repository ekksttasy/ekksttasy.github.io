Forest.modes.trees = (root, tk) => {
    const { rng, mix, rgba, lerp } = Forest;
    const LAYERS = 5;
    const SPREAD = 0.12;
    const EXTRA = 0.04;
    const GLOW_RES = 0.25;
    const FX_RES = 0.5;
    const lamp = tk.dark ? tk.light : '#ffffff';
    const dust = tk.dark ? tk.light : tk.accent2;
    const moss = mix(tk.accent2, tk.near, 0.4);

    const glow = document.createElement('canvas');
    const fx = document.createElement('canvas');
    const fxCtx = fx.getContext('2d');

    const layers = Array.from({ length: LAYERS }, (_, i) => {
        const depth = i / (LAYERS - 1);
        return {
            canvas: document.createElement('canvas'),
            depth,
            res: lerp(0.7, 0.2, depth),
            shift: lerp(0.008, 0.06, depth),
        };
    });

    const wide = [glow, ...layers.map(l => l.canvas)];
    wide.forEach(c => { c.className = 'forest-layer'; });
    fx.className = 'forest-fx';
    layers.forEach(({ canvas }) => {
        canvas.style.top = `${-EXTRA * 100}%`;
        canvas.style.height = `${(1 + 2 * EXTRA) * 100}%`;
    });

    const stage = document.createElement('div');
    stage.className = 'forest-stage';
    stage.append(...wide, fx);
    root.prepend(stage);

    let w = 0;
    let h = 0;
    let ph = 0;
    let acc = 0;
    let shafts = [];
    let motes = [];
    let bokeh = [];

    const size = (canvas, cw, ch, res) => {
        canvas.width = Math.round(cw * res);
        canvas.height = Math.round(ch * res);
    };

    const drawGlow = (cw, ch) => {
        const ctx = glow.getContext('2d');
        const rand = rng(11);
        ctx.setTransform(GLOW_RES, 0, 0, GLOW_RES, 0, 0);
        const sky = ctx.createLinearGradient(0, 0, 0, ch);
        sky.addColorStop(0, tk.mist);
        sky.addColorStop(1, tk.page);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, cw, ch);

        for (let i = 0; i < 8; i++) {
            const x = rand() * cw;
            const y = rand() * ch * 0.6;
            const r = ch * (0.1 + rand() * 0.18);
            const blob = ctx.createRadialGradient(x, y, 0, x, y, r);
            blob.addColorStop(0, rgba(lamp, 0.3));
            blob.addColorStop(1, rgba(lamp, 0));
            ctx.fillStyle = blob;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
    };

    const drawBark = (ctx, rand, wb, wt, depth) => {
        ctx.lineCap = 'round';
        for (let s = 0; s < Math.floor(wb / 6); s++) {
            const u = (rand() * 2 - 1) * 0.85;
            const f0 = rand();
            const f1 = Math.min(1, f0 + 0.08 + rand() * 0.35);
            ctx.strokeStyle = `rgba(0,0,0,${(0.12 + rand() * 0.14).toFixed(2)})`;
            ctx.lineWidth = 1 + rand() * depth * 2.5;
            ctx.beginPath();
            ctx.moveTo((u * lerp(wb, wt, f0)) / 2, -f0 * ph);
            ctx.lineTo((u * lerp(wb, wt, f1)) / 2, -f1 * ph);
            ctx.stroke();
        }
    };

    const drawLayer = ({ canvas, depth, res }, i) => {
        const ctx = canvas.getContext('2d');
        const cw = Math.round(w * (1 + 2 * SPREAD));
        const rand = rng(7919 * (i + 1));
        const scale = Math.max(0.6, Math.min(1.4, h / 700));
        const count = Math.max(3, Math.round((lerp(42, 5, depth ** 0.7) * cw) / 1736));
        const width = lerp(6, 100, depth ** 1.6) * scale;
        const base = mix(tk.far, tk.near, depth ** 0.9);
        const rim = tk.dark ? tk.light : '#ffffff';

        ctx.setTransform(res, 0, 0, res, 0, 0);

        for (let k = 0; k < count; k++) {
            const x = ((k + rand()) / count) * cw;
            const wb = width * (0.6 + rand() * 0.8);
            const wt = wb * (0.7 + rand() * 0.15);
            const lean = (rand() - 0.5) * 0.04;
            const shade = ctx.createLinearGradient(-wb / 2, 0, wb / 2, 0);
            shade.addColorStop(0, mix(base, '#000000', 0.3));
            shade.addColorStop(0.45, base);
            shade.addColorStop(1, mix(base, rim, 0.22));

            ctx.save();
            ctx.translate(x, ph);
            ctx.transform(1, 0, -lean, 1, 0, 0);
            ctx.fillStyle = shade;
            ctx.beginPath();
            ctx.moveTo(-wb / 2, 4);
            ctx.lineTo(-wt / 2, -ph - 4);
            ctx.lineTo(wt / 2, -ph - 4);
            ctx.lineTo(wb / 2, 4);
            ctx.fill();
            if (depth > 0.35) drawBark(ctx, rand, wb, wt, depth);
            ctx.restore();
        }

        const fog = ctx.createLinearGradient(0, ph * 0.35, 0, ph);
        fog.addColorStop(0, rgba(tk.mist, 0));
        fog.addColorStop(1, rgba(tk.mist, 0.6 * (1 - depth)));
        ctx.fillStyle = fog;
        ctx.fillRect(0, 0, cw, ph);
    };

    const seedFx = () => {
        const rand = rng(99);
        shafts = Array.from({ length: 5 }, () => ({
            x: rand() * 1.2 - 0.1,
            width: 0.04 + rand() * 0.08,
            phase: rand() * 6.28,
        }));
        motes = Array.from({ length: 30 }, () => ({
            x: rand() * w,
            y: rand() * h,
            r: 0.6 + rand() * 1.6,
            vx: (rand() - 0.5) * 0.01,
            vy: -0.005 - rand() * 0.015,
            phase: rand() * 6.28,
        }));
        bokeh = Array.from({ length: 6 }, () => ({
            x: rand() * w,
            y: rand() * h,
            r: 20 + rand() * 50,
            a: 0.04 + rand() * 0.06,
        }));
    };

    const drawFx = (now, dt, p) => {
        fxCtx.setTransform(FX_RES, 0, 0, FX_RES, 0, 0);
        fxCtx.globalCompositeOperation = 'source-over';
        fxCtx.clearRect(0, 0, w, h);

        const ground = fxCtx.createLinearGradient(0, h, 0, h * 0.7);
        ground.addColorStop(0, rgba(moss, 0.8));
        ground.addColorStop(1, rgba(moss, 0));
        fxCtx.fillStyle = ground;
        fxCtx.fillRect(0, h * 0.7, w, h * 0.3);

        fxCtx.globalCompositeOperation = tk.dark ? 'lighter' : 'source-over';

        shafts.forEach(s => {
            const a = (tk.dark ? 0.11 : 0.22) * (0.7 + 0.3 * Math.sin(now * 0.0004 + s.phase));
            const x0 = s.x * w - p.x * w * 0.05;
            const slant = h * (0.35 + p.x * 0.15);
            const hw0 = s.width * w * 0.3;
            const hw1 = s.width * w;
            const beam = fxCtx.createLinearGradient(0, 0, 0, h);
            beam.addColorStop(0, rgba(lamp, a));
            beam.addColorStop(0.7, rgba(lamp, a * 0.3));
            beam.addColorStop(1, rgba(lamp, 0));
            fxCtx.fillStyle = beam;
            fxCtx.beginPath();
            fxCtx.moveTo(x0 - hw0, 0);
            fxCtx.lineTo(x0 + hw0, 0);
            fxCtx.lineTo(x0 + slant + hw1, h);
            fxCtx.lineTo(x0 + slant - hw1, h);
            fxCtx.fill();
        });

        bokeh.forEach(b => {
            const x = b.x - p.x * w * 0.09;
            const orb = fxCtx.createRadialGradient(x, b.y, 0, x, b.y, b.r);
            orb.addColorStop(0, rgba(lamp, b.a));
            orb.addColorStop(1, rgba(lamp, 0));
            fxCtx.fillStyle = orb;
            fxCtx.fillRect(x - b.r, b.y - b.r, b.r * 2, b.r * 2);
        });

        motes.forEach(m => {
            m.x = (m.x + m.vx * dt + w) % w;
            m.y = (m.y + m.vy * dt + h) % h;
            const a = 0.25 + 0.35 * Math.abs(Math.sin(now * 0.002 + m.phase));
            fxCtx.fillStyle = rgba(dust, a);
            fxCtx.beginPath();
            fxCtx.arc(m.x - p.x * w * 0.03, m.y, m.r, 0, 6.283);
            fxCtx.fill();
        });
    };

    return {
        resize(nextW, nextH) {
            w = nextW;
            h = nextH;
            const cw = Math.round(w * (1 + 2 * SPREAD));
            size(glow, cw, h, GLOW_RES);
            ph = Math.round(h * (1 + 2 * EXTRA));
            layers.forEach(l => size(l.canvas, cw, ph, l.res));
            size(fx, w, h, FX_RES);
            drawGlow(cw, h);
            layers.forEach(drawLayer);
            seedFx();
        },

        frame(now, dt, p) {
            glow.style.transform = `translate3d(${-p.x * w * 0.004}px, 0, 0)`;
            layers.forEach(({ canvas, shift }) => {
                canvas.style.transform = `translate3d(${-p.x * w * shift}px, ${-p.y * h * shift * 0.4}px, 0)`;
            });
            acc += dt;
            if (dt && acc < 33) return;
            drawFx(now, acc, p);
            acc = 0;
        },
    };
};
