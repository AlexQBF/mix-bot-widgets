// Примеры миксов в формате первого бота (validateMixes) — для проверки размеров и превью.
const it = (n, b, l, w, g) => ({ n, b, l, w, g });

export const typical = [
  {
    title: 'Печенье с арбузом', strength: 3,
    text: 'Сливочное печенье и сочный арбуз, мята холодит в конце.',
    parts: [
      { p: 50, item: it('Cookie', 'Kraken', 'Strong Ligero', [30, 100], ['Десертный']) },
      { p: 30, item: it('Watermelon', 'Darkside', 'Core', [25, 100], ['Фруктовый']) },
      { p: 20, item: it('Supernova', 'Darkside', 'Core', [25], ['Освежающий']) },
    ],
  },
  {
    title: 'Ягодный лимонад', strength: 2,
    text: 'Клубника с личи и лимонная кислинка, лёгкий и освежающий.',
    parts: [
      { p: 55, item: it('Strawberry Lychee', 'MustHave', 'Основная', [25, 125], ['Ягодный']) },
      { p: 25, item: it('Lemon', 'Black Burn', 'Основная', [25, 100], ['Цитрусовый']) },
      { p: 20, item: it('Ice Mint', 'Element', 'Вода', [25], ['Освежающий']) },
    ],
  },
  {
    title: 'Тропический чизкейк', strength: 4,
    text: 'Манго и маракуйя на сливочной основе чизкейка.',
    parts: [
      { p: 50, item: it('Cheesecake', 'Chabacco', 'Medium', [50], ['Десертный']) },
      { p: 30, item: it('Mango', 'Sebero', 'Classic', [20, 100], ['Фруктовый']) },
      { p: 20, item: it('Passion Fruit', 'Tangiers', 'Noir', [250], ['Фруктовый']) },
    ],
  },
];

// Тяжёлый случай: по 4 табака, длинные линейки, кириллица в названиях.
export const heavy = [
  {
    title: 'Брусничный морс у костра', strength: 5,
    text: 'Кисло-сладкая брусника, дымная ваниль и хвойная свежесть — для тех, кто любит покрепче.',
    parts: [
      { p: 50, item: it('Брусничный морс', 'Северный', 'Крепкая линейка', [40, 100], ['Ягодный']) },
      { p: 20, item: it('Vanilla Smoke', 'Black Burn', 'Strong', [25, 100, 200], ['Десертный']) },
      { p: 15, item: it('Pine Needles Fresh', 'Spectrum', 'Hard Line', [40, 100], ['Освежающий']) },
      { p: 15, item: it('Cranberry Juice', 'Хулиган', 'Hard', [25, 200], ['Ягодный']) },
    ],
  },
  {
    title: 'Цитрусовый бриз с базиликом и грейпфрутом', strength: 3,
    text: 'Грейпфрут, лайм и пряный базилик: свежо, ярко и немного травянисто, отлично днём.',
    parts: [
      { p: 50, item: it('Pink Grapefruit', 'MustHave', 'Основная', [25, 125], ['Цитрусовый']) },
      { p: 20, item: it('Lime Basil', 'Sebero', 'Arctic Mix', [20, 100], ['Цитрусовый', 'Освежающий']) },
      { p: 15, item: it('Green Tea Jasmine', 'Darkside', 'Shot', [30, 120], ['Освежающий']) },
      { p: 15, item: it('Tarragon Lemonade', 'Element', 'Земля', [25, 200], []) },
    ],
  },
  {
    title: 'Карамельный попкорн со сливками', strength: 4,
    text: 'Солёная карамель, попкорн и сливки — десерт в кинотеатре, плотный и сладкий.',
    parts: [
      { p: 50, item: it('Salted Caramel Popcorn', 'Chabacco', 'Strong', [50, 200], ['Десертный']) },
      { p: 20, item: it('Cream', 'Tangiers', 'Birquq', [250], ['Десертный']) },
      { p: 15, item: it('Banana Papa', 'Darkside', 'Core', [25, 100], ['Фруктовый']) },
      { p: 15, item: it('Хрустящее печенье', 'Сарма', '360', [25, 120], ['Десертный']) },
    ],
  },
];
