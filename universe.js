// The story of the universe: chapters, looks and the fragment shader that draws them.
// Shared by index.html (the opening act) and universe-timeline.html (the standalone page).

export const USTAGES = [
  {t: '13.8 billion years ago', b: 'The Big Bang', c: 'Everything, everywhere, at once',
    d: 'Not an explosion in space but the expansion of space itself. Everything we can see today was packed into a region smaller than an atom.'},
  {t: 'The first trillionth of a second', b: 'Inflation', c: 'Space stretches faster than light',
    d: 'In a fraction of a second the universe grew by a factor of at least 10²⁶. Tiny quantum ripples were stretched into the seeds of every galaxy.'},
  {t: 'Three minutes in', b: 'First nuclei', c: 'Hydrogen and helium are forged in the heat',
    d: 'At a billion degrees, protons and neutrons fused into the first helium. The mix set then, three parts hydrogen to one part helium, is still the recipe of the cosmos.'},
  {t: '380,000 years in', b: 'First light', c: 'The fog clears and light runs free',
    d: 'The universe cooled enough for atoms to form, and light could finally travel freely. We still see that light today as the cosmic microwave background.'},
  {t: '100 million years in', b: 'The first stars', c: 'The dark ages end',
    d: 'Hundreds of times heavier than the Sun, the first stars burned fast and died young, seeding space with the first carbon, oxygen and iron.'},
  {t: '1 billion years in', b: 'First galaxies', c: 'Gravity gathers stars into islands',
    d: 'Dark matter pulled gas into clumps, and clumps into the first galaxies. The James Webb telescope has photographed some of them.'},
  {t: '9 billion years in', b: 'The Milky Way', c: 'A spiral disc settles around a black hole',
    d: 'Our galaxy grew by swallowing smaller ones. Its disc and spiral arms settled into shape, with a black hole four million times the mass of the Sun at the centre.'},
  {t: '4.6 billion years ago', b: 'The Sun is born', c: 'A cloud collapses in a quiet arm', link: 'sun-timeline.html', label: 'Follow the Sun',
    d: 'A shock from a nearby supernova may have squeezed a cloud of gas and dust into collapse. Within a few million years it had a star at its centre and a disc of rubble that became the planets.'},
  {t: 'Today', b: 'The cosmic web', c: 'Two trillion galaxies strung on filaments',
    d: 'Galaxies sit on a web of filaments with vast voids between. The expansion is speeding up, driven by something we call dark energy and do not yet understand.'},
  {t: '100 trillion years from now', b: 'The last stars', c: 'The sky goes dark, one ember at a time',
    d: 'Star formation ends when the gas runs out. The last red dwarfs will glow for trillions of years before the sky finally goes dark.'}
];

// one look per chapter. colours are linear and tone-mapped in the shader
export const ULOOK = [
  {c0: [.0,.0,.0],     c1: [1.2,.9,.7],   c2: [8,7,6],       point: 1,   pointR: .035, plasma: 0,   cmb: 0,  stars: 0,   web: 0,  gal: 0,  zoom: .3,  fog: 0,   boil: .6},
  {c0: [.06,.02,.14],  c1: [.7,.4,1],     c2: [3,2.6,3.4],   point: .5,  pointR: .22,  plasma: 1,   cmb: 0,  stars: 0,   web: 0,  gal: 0,  zoom: .6,  fog: .06, boil: 1.8},
  {c0: [.2,.04,0],     c1: [1.3,.45,.06], c2: [4,3,1.6],     point: 0,   pointR: .3,   plasma: 1,   cmb: 0,  stars: 0,   web: 0,  gal: 0,  zoom: 1.6, fog: .05, boil: 1.4},
  {c0: [.05,.08,.35],  c1: [.9,.4,.1],    c2: [2.2,1.6,.9],  point: 0,   pointR: .3,   plasma: .15, cmb: 1,  stars: 0,   web: 0,  gal: 0,  zoom: 1,   fog: .1,  boil: .4},
  {c0: [.01,.005,.01], c1: [.25,.08,.04], c2: [2.5,2.2,2],   point: 0,   pointR: .3,   plasma: .1,  cmb: 0,  stars: .3,  web: 0,  gal: 0,  zoom: 1.4, fog: .05, boil: .5},
  {c0: [.01,.01,.02],  c1: [.3,.2,.5],    c2: [2.4,2,1.5],   point: 0,   pointR: .3,   plasma: 0,   cmb: 0,  stars: .6,  web: .5, gal: .5, zoom: 1.6, fog: 0,   boil: .5},
  {c0: [.01,.01,.03],  c1: [.5,.35,.6],   c2: [3,2.4,1.6],   point: .25, pointR: .09,  plasma: 0,   cmb: 0,  stars: .9,  web: .9, gal: .9, zoom: 2,   fog: 0,   boil: .5},
  {c0: [.01,.01,.03],  c1: [.5,.35,.6],   c2: [3,2.4,1.6],   point: .7,  pointR: .04,  plasma: 0,   cmb: 0,  stars: .9,  web: .9, gal: .9, zoom: 2,   fog: 0,   boil: .5},
  {c0: [.005,.01,.03], c1: [.35,.45,.9],  c2: [2.6,2.6,3],   point: 0,   pointR: .3,   plasma: 0,   cmb: 0,  stars: 1,   web: 1,  gal: 1,  zoom: 2.4, fog: 0,   boil: .4},
  {c0: [.004,.001,0],  c1: [.18,.03,.01], c2: [1.2,.3,.08],  point: 0,   pointR: .3,   plasma: 0,   cmb: 0,  stars: .08, web: .3, gal: .3, zoom: 3.2, fog: 0,   boil: .2}
];
export const UNIFORMS = ['point','pointR','plasma','cmb','stars','web','gal','zoom','fog'];

// withAlpha: write the fade into alpha (for a transparent quad in a Three.js scene) instead of darkening the colour.
export const universeFS = (withAlpha = false) => `precision highp float;
  uniform vec2 res;
  uniform float fade, t, evo, blur, rush, point, pointR, plasma, cmb, stars, web, gal, zoom, fog, flick;
  uniform vec3 c0, c1, c2;
  float h(vec3 p){ p = fract(p*.3183099 + .1); p *= 17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.-2.*f);
    return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x), mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x), f.y),
               mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x), mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x), f.y), f.z); }
  float fbm(vec3 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*n3(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=.5; } return s; }
  // a star field; stars streak away from the centre while time is being thrown
  vec3 starField(vec2 uv, float dens, float sc){
    vec2 q = uv*sc, id = floor(q), f = fract(q)-.5;
    float r = h2(id);
    vec2 o = vec2(fract(r*17.3), fract(r*91.7))-.5;
    vec2 g = f - o*.7;
    vec2 rd = normalize(uv + 1e-4);
    float gr = dot(g, rd), gt = dot(g, vec2(-rd.y, rd.x));
    g = vec2(gr/(1.+blur*6.), gt);
    float tw = .6+.4*sin(t*(.7+r*1.8)+r*40.);
    float on = smoothstep(1.-dens*.07, 1., r);
    return vec3(on*smoothstep(.07,.0,length(g))*tw) * mix(vec3(1.,.95,.9), vec3(.8,.9,1.), h2(id+3.));
  }
  // galaxies: little tilted glows, one per cell, brighter where the web is dense
  vec3 galaxies(vec2 q, float fil){
    vec3 acc = vec3(0.);
    for(int k=0;k<2;k++){
      float sc = 2.2 + float(k)*1.9;
      vec2 p = q*sc + float(k)*7.1, id = floor(p), f = fract(p)-.5;
      float r = h2(id + float(k)*9.);
      vec2 o = vec2(fract(r*13.7), fract(r*57.3))-.5;
      vec2 g = f - o*.8;
      float ang = r*6.28; mat2 m = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
      g = m*g; g.y *= 2.2 + r*2.;
      float d = dot(g,g);
      float core = exp(-d*90.) + exp(-d*18.)*.35;
      core *= smoothstep(.5, .32, max(abs(f.x), abs(f.y)));
      float on = step(.55, h2(id+1.)) * (.4 + .6*fil);
      vec3 col = mix(vec3(1.,.85,.6), vec3(.7,.8,1.), h2(id+5.));
      acc += col * core * on / (1.+float(k)*.8);
    }
    return acc;
  }
  void main(){
    vec2 uv = (gl_FragCoord.xy - .5*res)/res.y;
    float d = length(uv);
    vec2 q = uv * zoom * (1. - rush*.12) + vec2(evo*.01, 0.);
    vec3 col = vec3(0.);

    // hot plasma
    float n = fbm(vec3(q*2.2, evo*.08));
    float n2 = fbm(vec3(q*4.5 + 11., evo*.12));
    vec3 pl = mix(c0, c1, smoothstep(.35,.72,n)) * .6 + c2 * pow(smoothstep(.5,.95,n*.6 + n2*.5), 2.2) * .45;
    col += pl * plasma;

    // the first light: a mottled sky in two temperatures
    float m = fbm(vec3(q*5.5 + 31., evo*.02));
    vec3 cm = mix(c0*4., c1*1.1, smoothstep(.38,.62,m)) + c2 * .2 * pow(smoothstep(.5,.8,m), 2.);
    col += cm * cmb;

    // cosmic web filaments, and galaxies strung along them
    float w1 = fbm(vec3(q*1.1, 5. + evo*.01)), w2 = fbm(vec3(q*1.3 + 9., evo*.012));
    float ridge = 1. - abs(2.*fbm(vec3(q*1.6 + 1.8*vec2(w1, w2), 2.)) - 1.);
    float fil = pow(ridge, 11.);
    col += mix(c1, c2, fil) * fil * .5 * web;
    col += c1 * .1 * pow(ridge, 3.) * web;
    col += galaxies(q, pow(ridge, 3.)) * c2 * .75 * gal;

    // stars
    col += starField(uv, stars, 34.) * (.6 + .5*stars) * stars;
    col += starField(uv + 7., stars, 60.) * .35 * stars;

    // the singularity, or the newborn Sun
    col += c2 * exp(-d*d/(pointR*pointR)) * point * flick;
    col += c1 * exp(-d/(pointR*2.5)) * point * .6;

    // haze and vignette, with the bottom kept dark for the caption
    col += c1 * fog * (.6 + .4*n);
    col *= 1. - smoothstep(.45, 1.1, d) * .55;
    col *= 1. - smoothstep(-.04, -.42, uv.y) * .82;

    col = 1. - exp(-col*1.1);
    ${withAlpha ? 'gl_FragColor = vec4(pow(col, vec3(.4545)), fade);' : 'gl_FragColor = vec4(pow(col, vec3(.4545))*fade, 1.);'}
  }`;
