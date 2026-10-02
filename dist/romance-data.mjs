// Ajoute de nouvelles phrases dans cette liste, entre guillemets, suivies d’une virgule.
// Les textes sont affichés tels quels, indépendamment de la scène tirée au sort.
export const ROMANTIC_PHRASES = [
 "Je te trésor mon or 💛",
 "Je t’evidence mon tout.",
 "😍Je t’aime mon amour 😍",
 "Il est des jours où la lumière semble née de ton regard🌈",
 "Reste près de moi, ô mon tendre voyage ! 🌸🌺",
 "Ce sourire séduisant, ces teintes animées sur ton corps ❤️",
 "Au clos de notre jardin l’été se continue ☀️💋",
 "A l'instant voluptueux où, tout en se cherchant, nos lèvres se respirent 💋💋",
 "Ce désir dans nos âmes pour toujours et au delà ♾️",
 "Mon exquise, ma lascive princesse, ma sensuelle déesse, mon éternelle soumise 👑❤️",
 "Mon astre du jour, la brise en fleur, les chants de joie que l’onde effleure 🌝🌹",
 "Nager dans le bonheur de nos bulles et de notre jardin 🫧❤️",
 "Pour faire des bouquets d'univers j’irai cueillir ces étoiles ✨🌟✨",
 "Tu contiens dans ton oeil le couchant et l'aurore ☀️🌅",
 "Traversant les nuages vers nos astres brûlants 🌞🌝🌕☀️"
];

// Sprite rectangles select only the approved illustrations, without board captions.
export const ROMANTIC_SCENES = [
 {id:'baiser',title:'Le premier baiser',image:'assets/romance-board.png',rect:[12,90,492,431],alt:'Un baiser sous le cerisier, en compagnie du cardinal et du chat.'},
 {id:'mains',title:'Main dans la main',image:'assets/romance-board.png',rect:[523,90,487,431],alt:'Une promenade main dans la main, avec un geai bleu et le chat dans les fleurs.'},
 {id:'blottis',title:'Blottis sous le cerisier',image:'assets/romance-board.png',rect:[12,559,493,434],alt:'Blottis l’un contre l’autre au crépuscule, avec le chat tout près et deux mésanges.'},
 {id:'danse',title:'La danse des pétales',image:'assets/romance-board.png',rect:[527,559,483,434],alt:'Une danse sous les cerisiers en fleurs, près du chat et d’un colibri.'},
 {id:'pont',title:'Le jardin pour nous deux',image:'assets/romance-board.png',rect:[12,1032,999,469],alt:'Un baiser sur le pont, sous la lune et les étoiles, avec le chat à côté du couple.'},
 {id:'vanille',title:'Une douceur à deux',image:'assets/romance-vanille.png',rect:[0,0,1536,973],alt:'Une molle twist vanille dégustée à deux dans le jardin, en compagnie du chat et des oiseaux.'}
];

export const qualifiesForFinale = game => game.state==='over' && game.lives===0 && game.score>100;
export function chooseFinale(random=Math.random){
 return {scene:ROMANTIC_SCENES[Math.floor(random()*ROMANTIC_SCENES.length)],phrase:ROMANTIC_PHRASES[Math.floor(random()*ROMANTIC_PHRASES.length)]};
}
