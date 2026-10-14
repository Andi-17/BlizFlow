export const COUNTRIES = [
  {
    code: 'AL',
    name: 'Albania',
    currency: 'EUR',
    locale: 'sq',
    aliases: ['Shqiperi', 'Shqipëri', 'Albanien'],
  },
  {
    code: 'AT',
    name: 'Austria',
    currency: 'EUR',
    locale: 'de',
    aliases: ['Osterreich', 'Österreich', 'Austri'],
  },
  {
    code: 'BE',
    name: 'Belgium',
    currency: 'EUR',
    locale: 'en',
    aliases: ['Belgjike', 'Belgjikë', 'Belgien'],
  },
  {
    code: 'BA',
    name: 'Bosnia and Herzegovina',
    currency: 'EUR',
    locale: 'en',
    aliases: ['Bosnje', 'Bosnja', 'Bosnia'],
  },
  {
    code: 'CA',
    name: 'Canada',
    currency: 'USD',
    locale: 'en',
    aliases: ['Kanada'],
  },
  {
    code: 'HR',
    name: 'Croatia',
    currency: 'EUR',
    locale: 'en',
    aliases: ['Kroaci', 'Kroatien'],
  },
  {
    code: 'EE',
    name: 'Estonia',
    currency: 'EUR',
    locale: 'en',
    aliases: ['Estoni'],
  },
  {
    code: 'FI',
    name: 'Finland',
    currency: 'EUR',
    locale: 'en',
    aliases: ['Finlandë', 'Finlande'],
  },
  {
    code: 'FR',
    name: 'France',
    currency: 'EUR',
    locale: 'en',
    aliases: ['France', 'Frankreich', 'Franca'],
  },
  {
    code: 'DE',
    name: 'Germany',
    currency: 'EUR',
    locale: 'de',
    aliases: ['Deutschland', 'Gjermani', 'Germani'],
  },
  {
    code: 'GR',
    name: 'Greece',
    currency: 'EUR',
    locale: 'en',
    aliases: ['Greqi', 'Griechenland'],
  },
  {
    code: 'IE',
    name: 'Ireland',
    currency: 'EUR',
    locale: 'en',
    aliases: ['Irlandë', 'Irlande'],
  },
  {
    code: 'IT',
    name: 'Italy',
    currency: 'EUR',
    locale: 'en',
    aliases: ['Italia', 'Italien'],
  },
  {
    code: 'XK',
    name: 'Kosovo',
    currency: 'EUR',
    locale: 'sq',
    aliases: ['Kosova', 'Kosovë'],
  },
  {
    code: 'LV',
    name: 'Latvia',
    currency: 'EUR',
    locale: 'en',
    aliases: ['Letoni'],
  },
  {
    code: 'LI',
    name: 'Liechtenstein',
    currency: 'CHF',
    locale: 'de',
    aliases: ['Lihtenshtajn'],
  },
  {
    code: 'LT',
    name: 'Lithuania',
    currency: 'EUR',
    locale: 'en',
    aliases: ['Lituani'],
  },
  {
    code: 'ME',
    name: 'Montenegro',
    currency: 'EUR',
    locale: 'en',
    aliases: ['Mali i Zi', 'Montenegro'],
  },
  {
    code: 'NL',
    name: 'Netherlands',
    currency: 'EUR',
    locale: 'en',
    aliases: ['Hollandë', 'Hollande', 'Niederlande'],
  },
  {
    code: 'MK',
    name: 'North Macedonia',
    currency: 'EUR',
    locale: 'sq',
    aliases: ['Maqedoni', 'Maqedonia e Veriut'],
  },
  {
    code: 'PT',
    name: 'Portugal',
    currency: 'EUR',
    locale: 'en',
    aliases: ['Portugali'],
  },
  {
    code: 'RS',
    name: 'Serbia',
    currency: 'EUR',
    locale: 'en',
    aliases: ['Serbi', 'Serbien'],
  },
  {
    code: 'SK',
    name: 'Slovakia',
    currency: 'EUR',
    locale: 'en',
    aliases: ['Sllovaki'],
  },
  {
    code: 'SI',
    name: 'Slovenia',
    currency: 'EUR',
    locale: 'en',
    aliases: ['Slloveni'],
  },
  {
    code: 'ES',
    name: 'Spain',
    currency: 'EUR',
    locale: 'en',
    aliases: ['Spanjë', 'Spanje', 'Spanien'],
  },
  {
    code: 'CH',
    name: 'Switzerland',
    currency: 'CHF',
    locale: 'de',
    aliases: ['Zvicër', 'Zvicer', 'Zvicra', 'Schweiz', 'Suisse', 'Svizzera'],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    locale: 'en',
    aliases: ['UK', 'Britain', 'Britani', 'England', 'Mbretëria e Bashkuar'],
  },
  {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    locale: 'en',
    aliases: ['USA', 'America', 'Amerikë', 'Amerike'],
  },
  {
    code: 'OTHER',
    name: 'Other / International',
    currency: 'EUR',
    locale: 'en',
    aliases: ['Other', 'International', 'Tjetër', 'Tjeter'],
  },
]

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function regionForCountry(countryCode) {
  const code = String(countryCode || '').toUpperCase()
  return COUNTRIES.find((country) => country.code === code) || COUNTRIES.find((country) => country.code === 'OTHER')
}

export function filterCountries(query) {
  const needle = normalizeSearchText(query)
  if (!needle) {
    return COUNTRIES.filter((country) => country.code !== 'OTHER').concat(
      COUNTRIES.filter((country) => country.code === 'OTHER'),
    )
  }

  return COUNTRIES.filter((country) => {
    const haystack = [country.name, country.code, ...(country.aliases || [])]
      .map(normalizeSearchText)
      .join(' ')
    return haystack.includes(needle)
  })
}

export function groupCountriesByLetter(countries) {
  const groups = new Map()

  countries.forEach((country) => {
    const letter = country.code === 'OTHER' ? '#' : String(country.name).charAt(0).toUpperCase()
    if (!groups.has(letter)) {
      groups.set(letter, [])
    }
    groups.get(letter).push(country)
  })

  return Array.from(groups.entries()).map(([letter, items]) => ({
    letter,
    countries: items,
  }))
}
