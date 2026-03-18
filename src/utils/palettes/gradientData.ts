import type { GradientPalette } from '../../types/wled'

// Named gradient palettes (IDs 13–71)
// Each entry: [position 0–255, R, G, B]
// Fire palette (ID 35) uses exact data from WLED spec; others are representative approximations.

// ID 13: Sunset — dark red → orange → purple
const SUNSET: GradientPalette = [
  [0, 20, 0, 30],
  [64, 120, 0, 40],
  [128, 220, 80, 0],
  [192, 255, 140, 0],
  [255, 180, 0, 120],
]

// ID 14: Rivendell — greens and teals
const RIVENDELL: GradientPalette = [
  [0, 0, 40, 20],
  [64, 10, 80, 50],
  [128, 20, 120, 80],
  [192, 30, 160, 110],
  [255, 40, 200, 140],
]

// ID 15: Breeze — light blues and whites
const BREEZE: GradientPalette = [
  [0, 180, 220, 255],
  [85, 210, 240, 255],
  [170, 240, 250, 255],
  [255, 255, 255, 255],
]

// ID 16: Red & Blue — red ↔ blue gradient
const RED_BLUE: GradientPalette = [
  [0, 255, 0, 0],
  [85, 180, 0, 75],
  [170, 75, 0, 180],
  [255, 0, 0, 255],
]

// ID 17: Yellowout — yellow fading to black
const YELLOWOUT: GradientPalette = [
  [0, 255, 255, 0],
  [128, 128, 128, 0],
  [255, 0, 0, 0],
]

// ID 18: Analogous — analogous warm colors
const ANALOGOUS: GradientPalette = [
  [0, 255, 50, 0],
  [85, 255, 120, 0],
  [170, 255, 200, 0],
  [255, 200, 255, 50],
]

// ID 19: Splash — bright splashes
const SPLASH: GradientPalette = [
  [0, 255, 0, 0],
  [64, 0, 0, 255],
  [128, 0, 255, 0],
  [192, 255, 255, 0],
  [255, 255, 0, 255],
]

// ID 20: Pastel — soft pastel tones
const PASTEL: GradientPalette = [
  [0, 255, 180, 180],
  [64, 180, 255, 180],
  [128, 180, 180, 255],
  [192, 255, 255, 180],
  [255, 255, 180, 255],
]

// ID 21: Sunset 2 — alternate sunset
const SUNSET2: GradientPalette = [
  [0, 10, 0, 50],
  [80, 180, 20, 30],
  [160, 255, 100, 0],
  [220, 255, 180, 60],
  [255, 200, 80, 150],
]

// ID 22: Beach — sand and ocean colors
const BEACH: GradientPalette = [
  [0, 0, 100, 180],
  [100, 0, 160, 220],
  [160, 200, 200, 180],
  [210, 230, 220, 150],
  [255, 240, 235, 160],
]

// ID 23: Vintage — muted retro tones
const VINTAGE: GradientPalette = [
  [0, 100, 60, 40],
  [85, 140, 100, 60],
  [170, 160, 130, 80],
  [255, 180, 150, 100],
]

// ID 24: Departure — warm transitions
const DEPARTURE: GradientPalette = [
  [0, 0, 0, 0],
  [85, 80, 10, 0],
  [170, 200, 80, 0],
  [255, 255, 200, 100],
]

// ID 25: Landscape — green → cyan → purple
const LANDSCAPE: GradientPalette = [
  [0, 0, 100, 0],
  [85, 0, 180, 100],
  [170, 0, 200, 200],
  [255, 100, 0, 200],
]

// ID 26: Beech — earth tones
const BEECH: GradientPalette = [
  [0, 80, 50, 10],
  [85, 120, 80, 20],
  [170, 160, 110, 30],
  [255, 200, 150, 50],
]

// ID 27: Sherbet — rainbow sherbet colors
const SHERBET: GradientPalette = [
  [0, 255, 100, 100],
  [64, 255, 180, 80],
  [128, 180, 255, 80],
  [192, 80, 200, 255],
  [255, 255, 80, 180],
]

// ID 28: Hult — nature greens
const HULT: GradientPalette = [
  [0, 0, 80, 40],
  [85, 20, 140, 60],
  [170, 40, 190, 80],
  [255, 60, 230, 100],
]

// ID 29: Hult 64 — expanded Hult
const HULT64: GradientPalette = [
  [0, 0, 60, 30],
  [64, 10, 100, 50],
  [128, 30, 150, 70],
  [192, 50, 200, 90],
  [255, 70, 240, 110],
]

// ID 30: Drywet — desert to water
const DRYWET: GradientPalette = [
  [0, 180, 120, 40],
  [100, 200, 160, 60],
  [160, 100, 180, 180],
  [255, 0, 120, 220],
]

// ID 31: Jul — Christmas red/green
const JUL: GradientPalette = [
  [0, 200, 0, 0],
  [85, 100, 0, 0],
  [170, 0, 100, 0],
  [255, 0, 200, 0],
]

// ID 32: Grintage — gray vintage
const GRINTAGE: GradientPalette = [
  [0, 40, 60, 40],
  [85, 80, 100, 80],
  [170, 120, 140, 120],
  [255, 160, 180, 160],
]

// ID 33: Rewhi — red → white
const REWHI: GradientPalette = [
  [0, 255, 0, 0],
  [128, 255, 128, 128],
  [255, 255, 255, 255],
]

// ID 34: Tertiary — three color blend
const TERTIARY: GradientPalette = [
  [0, 255, 0, 0],
  [85, 0, 255, 0],
  [170, 0, 0, 255],
  [255, 255, 0, 0],
]

// ID 35: Fire — exact data from WLED spec (black → red → yellow → white)
const FIRE: GradientPalette = [
  [0, 0, 0, 0],
  [46, 77, 0, 0],
  [96, 177, 0, 0],
  [108, 196, 38, 9],
  [119, 215, 76, 19],
  [146, 235, 115, 29],
  [174, 255, 153, 41],
  [188, 255, 178, 41],
  [202, 255, 204, 41],
  [218, 255, 230, 41],
  [234, 255, 255, 41],
  [244, 255, 255, 143],
  [255, 255, 255, 255],
]

// ID 36: Icefire — blue ice → orange fire
const ICEFIRE: GradientPalette = [
  [0, 0, 0, 80],
  [80, 0, 80, 255],
  [128, 0, 0, 0],
  [180, 200, 80, 0],
  [255, 255, 200, 0],
]

// ID 37: Cyane — cyan variations
const CYANE: GradientPalette = [
  [0, 0, 100, 100],
  [85, 0, 180, 180],
  [170, 0, 220, 220],
  [255, 0, 255, 255],
]

// ID 38: Light Pink — soft pinks
const LIGHT_PINK: GradientPalette = [
  [0, 255, 180, 200],
  [85, 255, 200, 220],
  [170, 255, 220, 240],
  [255, 255, 240, 250],
]

// ID 39: Autumn — fall reds/oranges/yellows
const AUTUMN: GradientPalette = [
  [0, 180, 20, 0],
  [64, 220, 60, 0],
  [128, 255, 120, 0],
  [192, 255, 180, 0],
  [255, 200, 200, 0],
]

// ID 40: Magenta — magenta shades
const MAGENTA: GradientPalette = [
  [0, 80, 0, 80],
  [85, 150, 0, 150],
  [170, 200, 0, 200],
  [255, 255, 0, 255],
]

// ID 41: Magred — magenta → red
const MAGRED: GradientPalette = [
  [0, 255, 0, 255],
  [128, 255, 0, 128],
  [255, 255, 0, 0],
]

// ID 42: Yelmag — yellow → magenta
const YELMAG: GradientPalette = [
  [0, 255, 255, 0],
  [128, 255, 128, 128],
  [255, 255, 0, 255],
]

// ID 43: Yelblu — yellow → blue
const YELBLU: GradientPalette = [
  [0, 255, 255, 0],
  [128, 128, 128, 128],
  [255, 0, 0, 255],
]

// ID 44: Orange & Teal — complementary pair
const ORANGE_TEAL: GradientPalette = [
  [0, 255, 120, 0],
  [100, 200, 100, 40],
  [160, 40, 140, 140],
  [255, 0, 180, 180],
]

// ID 45: Tiamat — fantasy blues/purples
const TIAMAT: GradientPalette = [
  [0, 0, 0, 80],
  [64, 20, 0, 160],
  [128, 60, 0, 200],
  [192, 0, 100, 200],
  [255, 0, 200, 180],
]

// ID 46: April Night — dark blues
const APRIL_NIGHT: GradientPalette = [
  [0, 0, 0, 40],
  [85, 0, 0, 80],
  [170, 0, 20, 120],
  [255, 0, 40, 180],
]

// ID 47: Orangery — orange variations
const ORANGERY: GradientPalette = [
  [0, 100, 20, 0],
  [85, 180, 60, 0],
  [170, 240, 100, 0],
  [255, 255, 140, 20],
]

// ID 48: C9 — classic C9 Christmas lights
const C9: GradientPalette = [
  [0, 220, 20, 0],
  [64, 240, 120, 0],
  [128, 0, 180, 0],
  [192, 0, 0, 220],
  [255, 220, 20, 0],
]

// ID 49: Sakura — cherry blossom pinks
const SAKURA: GradientPalette = [
  [0, 255, 180, 200],
  [85, 240, 160, 180],
  [170, 255, 200, 210],
  [255, 230, 140, 160],
]

// ID 50: Aurora — northern lights green → blue
const AURORA: GradientPalette = [
  [0, 0, 80, 40],
  [64, 0, 160, 80],
  [128, 0, 200, 120],
  [192, 0, 160, 180],
  [255, 0, 80, 200],
]

// ID 51: Atlantica — ocean blues and greens
const ATLANTICA: GradientPalette = [
  [0, 0, 20, 80],
  [85, 0, 80, 140],
  [170, 0, 120, 180],
  [255, 20, 160, 200],
]

// ID 52: C9 2 — C9 variant
const C9_2: GradientPalette = [
  [0, 200, 0, 0],
  [64, 220, 80, 0],
  [128, 0, 160, 0],
  [192, 0, 0, 200],
  [255, 200, 200, 0],
]

// ID 53: C9 New — C9 modern
const C9_NEW: GradientPalette = [
  [0, 255, 60, 0],
  [64, 0, 200, 60],
  [128, 0, 60, 255],
  [192, 255, 200, 0],
  [255, 255, 60, 0],
]

// ID 54: Temperature — blue (cold) → red (hot)
const TEMPERATURE: GradientPalette = [
  [0, 0, 0, 255],
  [64, 0, 80, 200],
  [128, 0, 200, 100],
  [192, 200, 200, 0],
  [255, 255, 0, 0],
]

// ID 55: Aurora 2 — alternate aurora
const AURORA2: GradientPalette = [
  [0, 0, 60, 30],
  [80, 0, 180, 80],
  [160, 0, 220, 160],
  [220, 20, 180, 200],
  [255, 40, 100, 220],
]

// ID 56: Retro Clown — circus colors
const RETRO_CLOWN: GradientPalette = [
  [0, 255, 0, 0],
  [64, 255, 200, 0],
  [128, 0, 255, 0],
  [192, 0, 100, 255],
  [255, 255, 0, 200],
]

// ID 57: Candy — sweet colors
const CANDY: GradientPalette = [
  [0, 255, 100, 200],
  [64, 255, 200, 100],
  [128, 100, 255, 200],
  [192, 200, 100, 255],
  [255, 255, 100, 200],
]

// ID 58: Toxy Reaf — toxic green reef
const TOXY_REAF: GradientPalette = [
  [0, 0, 100, 0],
  [85, 80, 200, 0],
  [170, 160, 255, 0],
  [255, 80, 200, 80],
]

// ID 59: Fairy Reaf — ethereal reef
const FAIRY_REAF: GradientPalette = [
  [0, 0, 100, 150],
  [85, 100, 0, 200],
  [170, 200, 0, 150],
  [255, 100, 200, 100],
]

// ID 60: Semi Blue — blue tones
const SEMI_BLUE: GradientPalette = [
  [0, 0, 0, 100],
  [85, 0, 40, 160],
  [170, 0, 80, 200],
  [255, 0, 120, 240],
]

// ID 61: Pink Candy — pink sweet tones
const PINK_CANDY: GradientPalette = [
  [0, 255, 100, 150],
  [85, 240, 140, 180],
  [170, 255, 180, 200],
  [255, 240, 120, 160],
]

// ID 62: Red Reaf — red reef
const RED_REAF: GradientPalette = [
  [0, 100, 0, 0],
  [85, 200, 40, 20],
  [170, 255, 80, 40],
  [255, 200, 40, 20],
]

// ID 63: Aqua Flash — aqua highlight
const AQUA_FLASH: GradientPalette = [
  [0, 0, 0, 0],
  [100, 0, 80, 100],
  [160, 0, 200, 200],
  [200, 0, 255, 255],
  [255, 0, 0, 0],
]

// ID 64: Yelblu Hot — hot yellow-blue
const YELBLU_HOT: GradientPalette = [
  [0, 0, 0, 255],
  [128, 255, 255, 0],
  [255, 255, 0, 0],
]

// ID 65: Lite Light — light pastel
const LITE_LIGHT: GradientPalette = [
  [0, 200, 200, 255],
  [85, 200, 255, 200],
  [170, 255, 200, 200],
  [255, 255, 255, 200],
]

// ID 66: Red Flash — red highlight
const RED_FLASH: GradientPalette = [
  [0, 0, 0, 0],
  [100, 100, 0, 0],
  [160, 255, 0, 0],
  [200, 255, 0, 0],
  [255, 0, 0, 0],
]

// ID 67: Blink Red — red blink variant
const BLINK_RED: GradientPalette = [
  [0, 255, 0, 0],
  [128, 100, 0, 0],
  [255, 255, 0, 0],
]

// ID 68: Red Shift — shifting reds
const RED_SHIFT: GradientPalette = [
  [0, 80, 0, 0],
  [64, 160, 0, 0],
  [128, 240, 40, 0],
  [192, 180, 0, 20],
  [255, 80, 0, 40],
]

// ID 69: Red Tide — red ocean
const RED_TIDE: GradientPalette = [
  [0, 0, 0, 20],
  [80, 60, 0, 40],
  [160, 180, 20, 20],
  [255, 255, 60, 0],
]

// ID 70: Candy 2 — candy variant
const CANDY2: GradientPalette = [
  [0, 255, 200, 100],
  [64, 100, 255, 200],
  [128, 200, 100, 255],
  [192, 255, 100, 200],
  [255, 200, 255, 100],
]

// ID 71: Traffic Light — red → yellow → green
const TRAFFIC_LIGHT: GradientPalette = [
  [0, 255, 0, 0],
  [100, 255, 0, 0],
  [128, 255, 200, 0],
  [155, 0, 200, 0],
  [255, 0, 200, 0],
]

export const GRADIENT_PALETTES: Record<number, GradientPalette> = {
  13: SUNSET,
  14: RIVENDELL,
  15: BREEZE,
  16: RED_BLUE,
  17: YELLOWOUT,
  18: ANALOGOUS,
  19: SPLASH,
  20: PASTEL,
  21: SUNSET2,
  22: BEACH,
  23: VINTAGE,
  24: DEPARTURE,
  25: LANDSCAPE,
  26: BEECH,
  27: SHERBET,
  28: HULT,
  29: HULT64,
  30: DRYWET,
  31: JUL,
  32: GRINTAGE,
  33: REWHI,
  34: TERTIARY,
  35: FIRE,
  36: ICEFIRE,
  37: CYANE,
  38: LIGHT_PINK,
  39: AUTUMN,
  40: MAGENTA,
  41: MAGRED,
  42: YELMAG,
  43: YELBLU,
  44: ORANGE_TEAL,
  45: TIAMAT,
  46: APRIL_NIGHT,
  47: ORANGERY,
  48: C9,
  49: SAKURA,
  50: AURORA,
  51: ATLANTICA,
  52: C9_2,
  53: C9_NEW,
  54: TEMPERATURE,
  55: AURORA2,
  56: RETRO_CLOWN,
  57: CANDY,
  58: TOXY_REAF,
  59: FAIRY_REAF,
  60: SEMI_BLUE,
  61: PINK_CANDY,
  62: RED_REAF,
  63: AQUA_FLASH,
  64: YELBLU_HOT,
  65: LITE_LIGHT,
  66: RED_FLASH,
  67: BLINK_RED,
  68: RED_SHIFT,
  69: RED_TIDE,
  70: CANDY2,
  71: TRAFFIC_LIGHT,
}
