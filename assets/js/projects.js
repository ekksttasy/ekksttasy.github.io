document.addEventListener('DOMContentLoaded', () => {
    const cards = [...document.querySelectorAll('.project')];
    const tags = [...document.querySelectorAll('.skill')];
    let active = '';

    const apply = () => {
        tags.forEach(tag => {
            const on = tag.dataset.skill === active;
            tag.classList.toggle('is-active', on);
            tag.setAttribute('aria-pressed', on);
        });
        cards.forEach(card => {
            const match = [...card.querySelectorAll('.skill')].some(tag => tag.dataset.skill === active);
            card.classList.toggle('is-match', !!active && match);
            card.classList.toggle('is-dim', !!active && !match);
        });
    };

    tags.forEach(tag => tag.addEventListener('click', () => {
        active = active === tag.dataset.skill ? '' : tag.dataset.skill;
        apply();
    }));
});
