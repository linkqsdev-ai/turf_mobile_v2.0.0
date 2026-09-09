// Team crest artwork — single source of truth for resolving a team's
// `mascot` key (stored on Team in the app store) to its image asset.

export const MASCOT_IMAGES: Record<string, any> = {
  lion: require('@/assets/images/mascots/lion.png'),
  warrior: require('@/assets/images/mascots/warrior.png'),
  wolf: require('@/assets/images/mascots/wolf.png'),
  eagle: require('@/assets/images/mascots/eagle.png'),
  panther: require('@/assets/images/mascots/panther.png'),
  shark: require('@/assets/images/mascots/shark.png'),
  bear: require('@/assets/images/mascots/bear.png'),
  rhino: require('@/assets/images/mascots/rhino.png'),
  dragon: require('@/assets/images/mascots/dragon.png'),
  cobra: require('@/assets/images/mascots/cobra.png'),
  tiger: require('@/assets/images/mascots/tiger.png'),
  leopard: require('@/assets/images/mascots/leopard.png'),
  gorilla: require('@/assets/images/mascots/gorilla.png'),
  falcon: require('@/assets/images/mascots/falcon.png'),
  stallion: require('@/assets/images/mascots/stallion.png'),
  bull: require('@/assets/images/mascots/bull.png'),
  crocodile: require('@/assets/images/mascots/crocodile.png'),
};

export const MASCOT_KEYS = Object.keys(MASCOT_IMAGES);

export function getMascotImage(mascot?: string) {
  return (mascot && MASCOT_IMAGES[mascot]) || MASCOT_IMAGES.lion;
}
