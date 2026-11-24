Forest.modes.glyphs = (root, tk) => {
    const { rng, mix, rgba, lerp } = Forest;
    const SPREAD = 0.12;
    const CH = 16;
    const BRANCH_ZONE = 0.3;
    const FONT = '14px "Courier New", Menlo, Consolas, monospace';
    const RAMP = ['·', ':', '░', '▒'];
    const MOSS = ['"', "'", ',', ';', '`', '^', 'v', 'w'];
    const CONFIG = [
        { width: [1, 1], count: 44, min: 12, lone: ['│', '┆', '╎', '│'] },
        { width: [2, 2], count: 22, min: 6, left: '▒', body: '▒', right: '░', alt: ['░', '▓'] },
        { width: [3, 4], count: 13, min: 4, branches: 0.14, left: '▓', body: '▒', right: '░', alt: ['░', '▓'] },
        { width: [5, 8], count: 7, min: 3, branches: 0.22, left: '▓', body: '█', right: '▒', alt: ['▓', '▓', '▒'] },
    ];

    const probe = document.createElement('canvas').getContext('2d');
    probe.font = FONT;
    const CW = Math.ceil(probe.measureText('M').width);

    const layers = CONFIG.map((config, i) => {
        const depth = i / (CONFIG.length - 1);
        return { canvas: document.createElement('canvas'), config, depth, shift: lerp(0.008, 0.06, depth) };
    });

    const fx = document.createElement('canvas');
    const fxCtx = fx.getContext('2d');
    layers.forEach(l => { l.canvas.className = 'forest-layer'; });
    fx.className = 'forest-fx';

    const stage = document.createElement('div');
    stage.className = 'forest-stage';
    stage.append(...layers.map(l => l.canvas), fx);
    root.prepend(stage);

    let w = 0;
    let h = 0;
    let acc = 0;
    let shafts = [];

    const pick = (rand, list) => list[Math.floor(rand() * list.length)];

    const drawLayer = ({ canvas, config, depth }, i) => {
        const ctx = canvas.getContext('2d');
        const cols = Math.ceil(canvas.width / CW);
        const rows = Math.ceil(h / CH);
        const rand = rng(7919 * (i + 1));
        const twig = rng(104729 * (i + 1));
        const count = Math.max(config.min, Math.round((config.count * cols) / 190));
        const color = mix(tk.far, tk.near, depth ** 0.9);

        ctx.font = FONT;
        ctx.textBaseline = 'top';
        ctx.fillStyle = color;

        for (let k = 0; k < count; k++) {
            const x = Math.floor(((k + rand()) / count) * cols);
            const tw = config.width[0] + Math.floor(rand() * (config.width[1] - config.width[0] + 1));
            const slope = (rand() - 0.5) * 0.04;

            for (let row = 0; row < rows; row++) {
                const cx = x + Math.round(slope * (row - rows / 2));
                for (let c = 0; c < tw; c++) {
                    let glyph;
                    if (config.lone) glyph = pick(rand, config.lone);
                    else if (c === 0) glyph = config.left;
                    else if (c === tw - 1) glyph = config.right;
                    else glyph = rand() < 0.12 ? pick(rand, config.alt) : config.body;
                    ctx.fillText(glyph, (cx + c) * CW, row * CH);
                }
            }

            if (!config.branches) continue;
            for (let row = 2; row < Math.floor(rows * BRANCH_ZONE); row++) {
                if (twig() > config.branches) continue;
                const dir = twig() < 0.5 ? -1 : 1;
                const len = 2 + Math.floor(twig() * 4);
                const cx = x + Math.round(slope * (row - rows / 2));
                const edge = dir < 0 ? cx - 1 : cx + tw;
                for (let n = 0; n < len && row - n >= 0; n++) {
                    ctx.fillText(dir < 0 ? '╲' : '╱', (edge + dir * n) * CW, (row - n) * CH);
                }
            }
        }

        ctx.fillStyle = rgba(tk.mist, 0.5);
        for (let row = 0; row < rows; row++) {
            const bottom = Math.max(0, (row / rows - 0.65) / 0.35);
            for (let col = 0; col < cols; col++) {
                const roll = rand();
                if (roll < 0.04 * (1 - depth)) ctx.fillText('·', col * CW, row * CH);
                else if (roll < 0.04 * (1 - depth) + bottom * 0.4 * (1 - depth)) ctx.fillText('░', col * CW, row * CH);
            }
        }

        if (i === layers.length - 1) {
            for (let row = rows - 7; row < rows; row++) {
                const density = 0.15 + 0.7 * ((row - (rows - 7)) / 7);
                for (let col = 0; col < cols; col++) {
                    if (rand() > density) continue;
                    ctx.fillStyle = rand() < 0.5 ? tk.accent : tk.accent2;
                    ctx.fillText(pick(rand, MOSS), col * CW, row * CH);
                }
            }
        }
    };

    const drawLight = (now, p) => {
        const cols = Math.ceil(w / CW);
        const rows = Math.ceil(h / CH);
        const px = ((p.x + 1) / 2) * cols;
        const py = ((p.y + 1) / 2) * rows;
        const slope = 0.45 + p.x * 0.25;
        const pulses = shafts.map(s => 0.65 + 0.35 * Math.sin(now * 0.0004 + s.phase));
        const buckets = RAMP.map(() => []);
        const lights = [
            [px, py, 0.7, 110],
            [cols - px, rows - py, 0.45, 90],
            [cols - px, py, 0.3, 70],
        ];

        for (let row = 0; row < rows; row++) {
            const fade = 1 - (row / rows) * 0.6;
            for (let col = 0; col < cols; col++) {
                let v = 0;
                shafts.forEach((s, i) => {
                    const hw = s.width * cols * (0.5 + (0.8 * row) / rows);
                    const dist = Math.abs(col - (s.x * cols + slope * row));
                    if (dist < hw) v += (1 - dist / hw) * pulses[i];
                });
                v *= 0.8 * fade;
                if (p.on > 0.01) {
                    lights.forEach(([lx, ly, k, r]) => {
                        const dx = (col - lx) * CW;
                        const dy = (row - ly) * CH;
                        v += p.on * k * Math.exp(-(dx * dx + dy * dy) / (r * r));
                    });
                }
                if (v < 0.1) continue;
                const idx = Math.min(RAMP.length - 1, Math.floor(((Math.min(v, 1) - 0.1) / 0.9) * RAMP.length));
                buckets[idx].push(col, row);
            }
        }

        fxCtx.clearRect(0, 0, w, h);
        fxCtx.globalCompositeOperation = tk.dark ? 'lighter' : 'source-over';
        fxCtx.font = FONT;
        fxCtx.textBaseline = 'top';
        buckets.forEach((cells, i) => {
            fxCtx.fillStyle = rgba(tk.light, 0.3 + i * 0.18);
            for (let n = 0; n < cells.length; n += 2) fxCtx.fillText(RAMP[i], cells[n] * CW, cells[n + 1] * CH);
        });
    };

    return {
        resize(nextW, nextH) {
            w = nextW;
            h = nextH;
            const cw = Math.round(w * (1 + 2 * SPREAD));
            layers.forEach(l => { l.canvas.width = cw; l.canvas.height = h; });
            fx.width = w;
            fx.height = h;
            layers.forEach(drawLayer);

            const rand = rng(99);
            shafts = Array.from({ length: 4 }, () => ({
                x: rand(),
                width: 0.04 + rand() * 0.05,
                phase: rand() * 6.28,
            }));
        },

        frame(now, dt, p) {
            layers.forEach(({ canvas, shift }) => {
                canvas.style.transform = `translate3d(${-p.x * w * shift}px, ${-p.y * h * shift * 0.4}px, 0)`;
            });
            acc += dt;
            if (dt && acc < 33) return;
            acc = 0;
            drawLight(now, p);
        },
    };
};
