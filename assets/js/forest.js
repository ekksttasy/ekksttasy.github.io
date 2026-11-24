window.Forest = (() => {
    const modes = {};

    const lerp = (a, b, t) => a + (b - a) * t;

    const parse = hex => {
        const h = hex.replace('#', '');
        const full = h.length === 3 ? [...h].map(c => c + c).join('') : h;
        return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
    };

    const mix = (a, b, t) => {
        const [ca, cb] = [parse(a), parse(b)];
        return '#' + ca.map((v, i) => Math.round(lerp(v, cb[i], t)).toString(16).padStart(2, '0')).join('');
    };

    const rgba = (hex, a) => `rgba(${parse(hex).join(',')},${a})`;

    const rng = seed => () => {
        seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const tokens = el => {
        const css = getComputedStyle(el);
        const get = name => css.getPropertyValue(name).trim();
        const page = get('--color-page');
        const accent = get('--color-accent');
        const trunk = get('--color-border-secondary');
        const [r, g, b] = parse(page);
        const dark = (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;

        return {
            dark,
            page,
            accent,
            accent2: get('--color-accent-secondary'),
            near: mix(trunk, '#000000', 0.45),
            far: dark ? mix(page, accent, 0.28) : mix(page, trunk, 0.25),
            mist: dark ? mix(page, accent, 0.18) : mix(page, '#ffffff', 0.6),
            light: dark ? mix(accent, '#ffffff', 0.45) : get('--color-accent-secondary'),
        };
    };

    const start = () => {
        const root = document.querySelector('.forest');
        const name = new URLSearchParams(location.search).get('forest') || 'trees';
        if (!root || !modes[name]) return;

        root.dataset.forest = name;
        const scene = modes[name](root, tokens(root));
        const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const coarse = matchMedia('(pointer: coarse)').matches;
        const target = { x: 0, y: 0, on: 0 };
        const pointer = { x: 0, y: 0, on: 0 };
        let size = '';
        let last = 0;
        let raf = 0;
        let timer = 0;

        const resize = () => {
            const { width, height } = root.getBoundingClientRect();
            const next = `${Math.round(width)}x${Math.round(height)}`;
            if (next === size) return;
            size = next;
            scene.resize(Math.round(width), Math.round(height));
            if (still) scene.frame(0, 0, pointer);
        };

        const tick = now => {
            const dt = Math.min(now - last, 64);
            last = now;
            if (coarse) {
                target.x = Math.sin(now / 5000);
                target.y = Math.cos(now / 7000) * 0.5;
            }
            const k = 1 - Math.exp(-dt / 180);
            for (const key of ['x', 'y', 'on']) pointer[key] += (target[key] - pointer[key]) * k;
            scene.frame(now, dt, pointer);
            raf = requestAnimationFrame(tick);
        };

        const play = () => {
            last = performance.now();
            raf = requestAnimationFrame(tick);
        };

        root.addEventListener('pointermove', e => {
            if (e.pointerType !== 'mouse') return;
            const r = root.getBoundingClientRect();
            target.x = ((e.clientX - r.left) / r.width) * 2 - 1;
            target.y = ((e.clientY - r.top) / r.height) * 2 - 1;
            target.on = 1;
        });

        root.addEventListener('pointerleave', () => {
            target.x = 0;
            target.y = 0;
            target.on = 0;
        });

        document.addEventListener('visibilitychange', () => {
            if (still) return;
            if (document.hidden) cancelAnimationFrame(raf);
            else play();
        });

        new ResizeObserver(() => {
            clearTimeout(timer);
            timer = setTimeout(resize, 150);
        }).observe(root);

        resize();
        if (!still) play();
    };

    document.addEventListener('DOMContentLoaded', start);

    return { modes, lerp, mix, rgba, rng };
})();
