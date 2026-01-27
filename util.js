
export const params = { };
export const randomInt = n => Math.floor(Math.random() * n);
export const rgb = (r, g, b) => `rgba(${r}, ${g}, ${b})`;
export const rgba = (r, g, b, a) => `rgba(${r}, ${g}, ${b}, ${a})`;
export const hsl = (h, s, l) => `hsl(${h}, ${s}%, ${l}%)`;
export const requestAnimFrame = (() => {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        ((callback, element) => {
            window.setTimeout(callback, 1000 / 60);
        });
})();
export const getDistance = (p1, p2) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};