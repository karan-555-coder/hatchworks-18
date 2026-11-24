// Variant: Tangerine Cobalt (cream, cobalt, navy, tangerine).
//
// A light, editorial identity: white and grey surfaces land on sand steps, the dark surfaces on
// espresso and deep olive. Brand accent fills become tangerine (teal) and olive (mint); the
// orange call-to-action fills become saffron with espresso text. Surface-aware custom
// properties (--tg-*) let text follow the surface it sits on.
// Table format: see scripts/variants/neobrutal.mjs.
export const PALETTE = {
  ivory: '#ffffff', sand: '#fffaf4', sand2: '#fbf0e2', sand3: '#f5e3cd', clay: '#ead0b2',
  tangerine: '#1b45d6', terraDeep: '#1536a8',
  olive: '#12309a', oliveDeep: '#12309a', oliveDark: '#0b1533', oliveCream: '#e6edff',
  saffron: '#ff6a1a', saffronPale: '#ffd9bf', burnt: '#d9480f',
  espresso: '#0b1533', espresso2: '#1c2850', cocoa: '#5a6585',
};
const P = PALETTE;

const vars = o => Object.entries(o).map(([k, v]) => `--tg-${k}:${v}`).join(';');
const LIGHT = {
  fg: P.espresso, fg2: P.espresso2, white: P.espresso, muted: P.cocoa, accent: P.terraDeep, accent2: P.oliveDeep,
  deep: P.oliveDeep, hot: P.burnt, line: 'rgba(11,21,51,.14)', line2: 'rgba(11,21,51,.3)', glow: P.tangerine,
};
const DARK = {
  fg: P.sand, fg2: '#f6ecdf', white: P.sand, muted: '#c9c2b8', accent: P.saffron, accent2: P.saffronPale,
  deep: '#d6e0ff', hot: P.saffron, line: 'rgba(255,250,244,.16)', line2: 'rgba(255,250,244,.32)', glow: P.saffron,
};

// text-like entry: the surface variable when opaque, the same variable at the token's opacity
// (color-mix) when translucent
const t = (v, fallback, alpha) => ({ solid: `var(${v},${fallback})`, alpha: alpha === undefined ? fallback : alpha, mix: true });
const accentVar = { solid: `var(--tg-accent,${P.terraDeep})`, alpha: P.tangerine };

// the original site is mostly dark: every surface, dark or light, lands on a sand step, and the
// sections drawn over video or dark photography get the DARK set from tangerine.js (.tc-darkzone)
export const DARK_CTX = DARK;

export default {
  name: 'tangerine',
  dist: 'dist',
  port: 4321,
  prefix: '--tg-',
  styles: ['/styles/tangerine.css'],
  scripts: ['/scripts/tangerine.js'],

  ctx: {
    dark: vars(LIGHT),
    light: vars(LIGHT),
    // tangerine / olive fills: sand ink on top
    accent: vars({ fg: P.sand, fg2: '#fffcf8', white: P.sand, muted: 'rgba(255,250,244,.82)', accent: '#ffffff', accent2: P.saffronPale,
      deep: P.sand, hot: P.saffronPale, line: 'rgba(255,250,244,.3)', line2: 'rgba(255,250,244,.5)', glow: P.tangerine }),
    // saffron fills (were orange call-to-actions): espresso ink on top
    orange: vars({ fg: P.espresso, fg2: P.espresso, white: P.espresso, muted: 'rgba(11,21,51,.75)', accent: P.espresso, accent2: P.espresso,
      deep: P.espresso, hot: P.espresso, line: 'rgba(11,21,51,.25)', line2: 'rgba(11,21,51,.45)', glow: P.saffron }),
  },
  // rules that set white text without painting a surface sit on dark artwork
  whiteTextCtx: '',
  lineVar: 'var(--tg-line,rgba(11,21,51,.14))',
  varRoles: true,
  // off-palette pale tints (lavender bands, creams) join the sand family
  refineOther: (h, s, l) => (l >= 0.86 ? 'paper' : null),

  map: {
    bg: { white: P.ivory, paper: P.sand2, silver: P.sand3, grey: P.clay, ink: P.sand, ink2: P.sand2,
      teal: P.tangerine, blue: P.tangerine, mint: P.olive, mintPale: P.oliveCream, deep: P.sand3, orange: P.saffron },
    grad: { white: P.ivory, paper: P.sand2, silver: P.sand3, grey: P.clay, ink: P.sand, ink2: P.sand2,
      teal: P.tangerine, blue: P.tangerine, mint: P.olive, mintPale: P.sand2, deep: P.sand3, orange: P.saffron },
    // gradients clipped to text (background-clip: text): warm, readable on sand
    gradText: { white: P.espresso, paper: P.espresso2, silver: P.cocoa, grey: P.cocoa, ink: P.espresso, ink2: P.espresso2,
      teal: P.tangerine, blue: P.tangerine, mint: P.olive, mintPale: P.olive, deep: P.oliveDeep, orange: P.saffron },
    text: {
      white: t('--tg-white', P.espresso), paper: t('--tg-white', P.espresso),
      silver: t('--tg-muted', P.cocoa), grey: t('--tg-muted', P.cocoa),
      ink: t('--tg-fg', P.espresso), ink2: t('--tg-fg2', P.espresso2),
      teal: t('--tg-accent', P.terraDeep, P.tangerine), blue: t('--tg-accent', P.terraDeep, P.tangerine),
      mint: t('--tg-accent2', P.oliveDeep, P.olive), mintPale: t('--tg-accent2', P.oliveDeep, P.olive),
      deep: t('--tg-deep', P.oliveDeep), orange: t('--tg-hot', P.burnt, P.saffron),
    },
    border: {
      white: { solid: 'var(--tg-line2,rgba(11,21,51,.3))', alpha: P.espresso },
      paper: { solid: 'var(--tg-line,rgba(11,21,51,.14))', alpha: null },
      silver: { solid: 'var(--tg-line,rgba(11,21,51,.14))', alpha: null },
      mintPale: { solid: 'var(--tg-line,rgba(11,21,51,.14))', alpha: null },
      grey: { solid: 'rgba(11,21,51,.22)', alpha: P.espresso },
      ink: { solid: 'var(--tg-line2,rgba(11,21,51,.3))', alpha: P.espresso },
      ink2: { solid: 'var(--tg-line2,rgba(11,21,51,.3))', alpha: P.espresso },
      teal: accentVar, mint: { solid: `var(--tg-accent2,${P.oliveDeep})`, alpha: P.olive }, blue: accentVar,
      deep: P.oliveDeep, orange: P.saffron,
    },
    svg: { white: P.espresso, paper: P.sand3, silver: P.clay, grey: P.cocoa, ink: P.sand2, ink2: P.sand3,
      teal: P.tangerine, blue: P.tangerine, mint: P.olive, mintPale: P.oliveCream, deep: P.oliveDark, orange: P.saffron },
    // custom properties read both as text and as a surface (or never read)
    var: { white: P.ivory, paper: P.sand2, silver: P.sand3, grey: P.clay, ink: P.sand, ink2: P.sand2,
      teal: accentVar, blue: accentVar, mint: P.olive, mintPale: P.oliveCream, deep: P.oliveDeep, orange: P.saffron },
    canvas: { white: P.espresso, ink: P.sand, ink2: P.sand2, teal: P.tangerine, mint: P.olive, mintPale: P.oliveCream,
      deep: P.sand3, blue: P.tangerine, orange: P.saffron },
  },
};
