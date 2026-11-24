document.addEventListener('DOMContentLoaded', () => {
    const cards = [...document.querySelectorAll('.project')];
    const tags = [...document.querySelectorAll('.skill')];
    const clear = document.querySelector('.clear-skills');
    const active = new Set();

    const apply = () => {
        tags.forEach(tag => {
            const on = active.has(tag.dataset.skill);
            tag.classList.toggle('is-active', on);
            tag.setAttribute('aria-pressed', on);
        });
        cards.forEach(card => {
            const match = [...card.querySelectorAll('.skill')].some(tag => active.has(tag.dataset.skill));
            card.classList.toggle('is-match', !!active.size && match);
            card.classList.toggle('is-dim', !!active.size && !match);
        });
        clear.disabled = !active.size;
    };

    tags.forEach(tag => tag.addEventListener('click', () => {
        const skill = tag.dataset.skill;
        if (!active.delete(skill)) active.add(skill);
        apply();
    }));

    clear.addEventListener('click', () => {
        active.clear();
        apply();
    });
});