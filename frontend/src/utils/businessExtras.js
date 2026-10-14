export const DEFAULT_INVOICE_SETTINGS = {
  show_logo: true,
  show_company_name: true,
  show_company_address: true,
  show_company_phone: true,
  show_company_email: true,
  show_customer_name: true,
  show_customer_email: true,
  show_customer_phone: false,
  show_customer_address: true,
  show_notes: true,
  show_issue_date: true,
  show_due_date: true,
  show_status: true,
  custom_title: '',
  custom_footer: '',
}

export const DEFAULT_LANDING_PAGE = {
  google_maps_url: '',
  google_maps_embed: '',
  highlights_title: '',
  highlights: [],
}

export function landingHighlightMeta(industry = 'general') {
  const presets = {
    barber: {
      title: 'Service prices',
      nameLabel: 'Service (e.g. Haircut)',
      priceLabel: 'Price',
      descriptionLabel: 'Notes (optional)',
      addLabel: 'Add service / haircut',
      lede: 'Show haircut and grooming prices on your public page.',
    },
    beauty: {
      title: 'Treatment prices',
      nameLabel: 'Treatment',
      priceLabel: 'Price',
      descriptionLabel: 'Notes (optional)',
      addLabel: 'Add treatment',
      lede: 'List spa and beauty treatments with prices.',
    },
    clothing_boutique: {
      title: 'Featured pieces',
      nameLabel: 'Item / accessory',
      priceLabel: 'Price',
      descriptionLabel: 'Size / details (optional)',
      addLabel: 'Add garment or accessory',
      lede: 'Highlight clothes and accessories customers will see on your landing page.',
    },
    shoe_store: {
      title: 'Featured footwear',
      nameLabel: 'Model',
      priceLabel: 'Price',
      descriptionLabel: 'Brand / size note',
      addLabel: 'Add shoes',
      lede: 'Show popular pairs and prices on your public page.',
    },
    tailor: {
      title: 'Services & prices',
      nameLabel: 'Service',
      priceLabel: 'Price',
      descriptionLabel: 'Notes',
      addLabel: 'Add alteration / service',
      lede: 'Publish alteration and custom work prices.',
    },
    restaurant: {
      title: 'Menu highlights',
      nameLabel: 'Dish',
      priceLabel: 'Price',
      descriptionLabel: 'Description',
      addLabel: 'Add menu item',
      lede: 'Feature signature dishes on your landing page.',
    },
    cafe: {
      title: 'Drinks & pastries',
      nameLabel: 'Item',
      priceLabel: 'Price',
      descriptionLabel: 'Description',
      addLabel: 'Add item',
      lede: 'Show coffee and pastry prices.',
    },
    bakery: {
      title: 'Baked goods',
      nameLabel: 'Item',
      priceLabel: 'Price',
      descriptionLabel: 'Description',
      addLabel: 'Add item',
      lede: 'Highlight breads, cakes, and prices.',
    },
    mechanic: {
      title: 'Common jobs',
      nameLabel: 'Job',
      priceLabel: 'From price',
      descriptionLabel: 'Notes',
      addLabel: 'Add job / service',
      lede: 'Show typical workshop jobs and starting prices.',
    },
    plumber: {
      title: 'Service prices',
      nameLabel: 'Service',
      priceLabel: 'From price',
      descriptionLabel: 'Notes',
      addLabel: 'Add service',
      lede: 'List common plumbing jobs and prices.',
    },
    electrician: {
      title: 'Service prices',
      nameLabel: 'Service',
      priceLabel: 'From price',
      descriptionLabel: 'Notes',
      addLabel: 'Add service',
      lede: 'List common electrical jobs and prices.',
    },
    clinic: {
      title: 'Treatments',
      nameLabel: 'Treatment',
      priceLabel: 'Price',
      descriptionLabel: 'Notes',
      addLabel: 'Add treatment',
      lede: 'Publish visit and treatment prices.',
    },
    dental: {
      title: 'Dental prices',
      nameLabel: 'Treatment',
      priceLabel: 'Price',
      descriptionLabel: 'Notes',
      addLabel: 'Add treatment',
      lede: 'Show common dental treatments and fees.',
    },
    fitness: {
      title: 'Packages',
      nameLabel: 'Package',
      priceLabel: 'Price',
      descriptionLabel: 'Notes',
      addLabel: 'Add package',
      lede: 'Membership and coaching packages for your landing page.',
    },
    hotel: {
      title: 'Rooms & rates',
      nameLabel: 'Room / offer',
      priceLabel: 'Rate',
      descriptionLabel: 'Details',
      addLabel: 'Add room / rate',
      lede: 'Show room types and nightly rates.',
    },
    education: {
      title: 'Courses & fees',
      nameLabel: 'Course',
      priceLabel: 'Fee',
      descriptionLabel: 'Details',
      addLabel: 'Add course',
      lede: 'Publish course packages and prices.',
    },
    pharmacy: {
      title: 'Popular products',
      nameLabel: 'Product',
      priceLabel: 'Price',
      descriptionLabel: 'Notes',
      addLabel: 'Add product',
      lede: 'Highlight OTC and wellness products.',
    },
    photography: {
      title: 'Packages',
      nameLabel: 'Package',
      priceLabel: 'Price',
      descriptionLabel: 'Includes',
      addLabel: 'Add package',
      lede: 'Show shoot packages and pricing.',
    },
    grocery: {
      title: 'Featured products',
      nameLabel: 'Product',
      priceLabel: 'Price',
      descriptionLabel: 'Notes',
      addLabel: 'Add product',
      lede: 'Promote weekly deals on your public page.',
    },
    electronics: {
      title: 'Featured devices',
      nameLabel: 'Device',
      priceLabel: 'Price',
      descriptionLabel: 'Notes',
      addLabel: 'Add device',
      lede: 'Highlight phones and accessories.',
    },
    jewelry: {
      title: 'Featured pieces',
      nameLabel: 'Piece',
      priceLabel: 'Price',
      descriptionLabel: 'Notes',
      addLabel: 'Add piece',
      lede: 'Showcase jewelry and watch highlights.',
    },
    furniture: {
      title: 'Featured furniture',
      nameLabel: 'Item',
      priceLabel: 'Price',
      descriptionLabel: 'Notes',
      addLabel: 'Add item',
      lede: 'Show showroom pieces and prices.',
    },
    florist: {
      title: 'Bouquets & offers',
      nameLabel: 'Arrangement',
      priceLabel: 'Price',
      descriptionLabel: 'Notes',
      addLabel: 'Add arrangement',
      lede: 'Feature popular bouquets on your landing page.',
    },
    retail: {
      title: 'Featured products',
      nameLabel: 'Product',
      priceLabel: 'Price',
      descriptionLabel: 'Notes',
      addLabel: 'Add product',
      lede: 'Highlight bestsellers for walk-in customers.',
    },
  }

  return (
    presets[industry] || {
      title: 'Highlights',
      nameLabel: 'Name',
      priceLabel: 'Price',
      descriptionLabel: 'Description (optional)',
      addLabel: 'Add item',
      lede: 'Add prices, products, or services that appear on your public landing page.',
    }
  )
}

export function normalizeLandingPage(value, industry = 'general') {
  const parsed = typeof value === 'string'
    ? (() => {
        try {
          return JSON.parse(value)
        } catch {
          return {}
        }
      })()
    : value && typeof value === 'object'
      ? value
      : {}

  const meta = landingHighlightMeta(industry)
  const highlights = Array.isArray(parsed.highlights)
    ? parsed.highlights
        .filter((row) => row && String(row.name || '').trim())
        .slice(0, 24)
        .map((row) => ({
          name: String(row.name || '').trim(),
          price: row.price != null ? String(row.price).trim() : '',
          description: row.description != null ? String(row.description).trim() : '',
        }))
    : []

  return {
    google_maps_url: parsed.google_maps_url ? String(parsed.google_maps_url) : '',
    google_maps_embed: parsed.google_maps_embed ? String(parsed.google_maps_embed) : '',
    highlights_title: parsed.highlights_title ? String(parsed.highlights_title) : meta.title,
    highlights,
  }
}

export function normalizeInvoiceSettings(value, industry = 'general') {
  const parsed = typeof value === 'string'
    ? (() => {
        try {
          return JSON.parse(value)
        } catch {
          return {}
        }
      })()
    : value && typeof value === 'object'
      ? value
      : {}

  const industryDefaults = {
    restaurant: { show_customer_address: false, show_customer_phone: true, custom_title: 'Receipt' },
    bakery: { show_customer_address: false, show_customer_phone: true, custom_title: 'Receipt' },
    cafe: { show_customer_address: false, show_customer_phone: true, custom_title: 'Receipt' },
    barber: { show_customer_phone: true, show_customer_address: false },
    beauty: { show_customer_phone: true, show_customer_address: false },
    clinic: { show_customer_phone: true, show_customer_address: false },
    dental: { show_customer_phone: true, show_customer_address: false },
    fitness: { show_customer_phone: true, show_customer_address: false },
    mechanic: { show_customer_phone: true, show_customer_address: true },
    plumber: { show_customer_phone: true, show_customer_address: true },
    electrician: { show_customer_phone: true, show_customer_address: true },
    construction: { show_customer_phone: true, show_customer_address: true },
    retail: {
      show_customer_name: false,
      show_customer_email: false,
      show_customer_address: false,
      custom_title: 'Sales receipt',
    },
    clothing_boutique: {
      show_customer_name: false,
      show_customer_email: false,
      show_customer_address: false,
      custom_title: 'Sales receipt',
    },
    shoe_store: {
      show_customer_name: false,
      show_customer_email: false,
      show_customer_address: false,
      custom_title: 'Sales receipt',
    },
    grocery: {
      show_customer_name: false,
      show_customer_email: false,
      show_customer_address: false,
      custom_title: 'Sales receipt',
    },
  }

  return {
    ...DEFAULT_INVOICE_SETTINGS,
    ...(industryDefaults[industry] || {}),
    ...parsed,
    custom_title: Object.prototype.hasOwnProperty.call(parsed, 'custom_title')
      ? (parsed.custom_title || '')
      : (industryDefaults[industry]?.custom_title || ''),
    custom_footer: Object.prototype.hasOwnProperty.call(parsed, 'custom_footer')
      ? (parsed.custom_footer || '')
      : '',
  }
}

export function downloadCsv(filename, rows, columns) {
  const escapeCell = (value) => {
    const text = value == null ? '' : String(value)
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`
    }
    return text
  }

  const header = columns.map((column) => escapeCell(column.label)).join(',')
  const body = rows
    .map((row) => columns.map((column) => escapeCell(column.value(row))).join(','))
    .join('\n')
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
