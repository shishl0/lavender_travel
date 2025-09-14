export interface TranslationTypes {
  brand?: string;

  nav: {
    tours: string;
    reviews: string;
    about: string;
    whatsapp: string;
    instagram: string;
    menu: string;
  };

  hero: {
    ctaPrimary: string;
  };

  st: {
    fillHint: string;
    collapse: string;
    clear: string;
    from: string;
    dest: string;
    destPlaceholder: string;
    dates: string;
    datesPlaceholder: string;
    nightsShort: string;
    pax: string;
    adultsShort: string;
    childrenShort: string;
    adults: string;
    children: string;
    childAgeLabel: string;
    done: string;
    apply: string;
    contacts: string;
    name: string;
    phone: string;
    namePlaceholder: string;
    phonePlaceholder: string;
    comment: string;
    commentPlaceholder: string;
    chooseCountry: string;
    send: string;
  };

  cal: {
    prev: string;
    next: string;
    nightsLabel: string;
    weekdaysShort: string[];
  };

  wa: {
    title: string;
    name: string;
    phone: string;
    destination: string;
    partyAdults: string;
    partyChildren: string;
    childrenAges: string;
    checkin: string;
    checkout: string;
    nights: string;
    departureFrom: string;
    comment: string;
  };

  stats: {
    ariaList: string;
    goto: string;
    defaults: {
      clientsLabel: string;
      yearsLabel: string;
      ratingLabel: string;
      clientsSuffix: string;
      yearsSuffix: string;
      ratingSuffix: string;
    };
  };

  teaser: {
    destinations: {
      title: string;
      viewAll: string;
      viewAllAria: string;
      pricePrefix: string;
    };
  };

  reviewsTeaser: {
    title: string;
    viewAll: string;
    viewAllAria: string;
    empty: string;
    leaveCta: string;
    modalTitle: string;
    modalClose: string;
    openAria: string;
    newBadge: string;
  };

  date: {
    today: string;
    yesterday: string;
    monthsShort: string[];
  };

  review: {
    modal: {
      title: string;
      close: string;
    };
    form: {
      aria: string;
      subtitle: string;
      nameLabel: string;
      namePlaceholder: string;
      ratingLabel: string;
      textLabel: string;
      textPlaceholder: string;
      photosLabel: string;
      photosHint: string;
      submit: string;
      starAria: string;
      success: string;
      errors: {
        required: string;
        submitFailed: string;
        unknown: string;
      };
    };
  };

  aboutTeaser: {
    kicker: string;
    title: string;
    lead: string;
    point1: string;
    point2: string;
    point3: string;
    moreCta: string;
    moreAria: string;
    instagram: string;
    instagramAria: string;
    photoAlt: string;
    noteTitle: string;
    noteSub: string;
    callCta: string;
    callAria: string;
  };

  footer: {
    instagram: string;
    instagramAria: string;
    whatsapp: string;
    whatsappAria: string;
    contacts: string;
    phone: string;
    address: string;
    company: string;
    about: string;
    certificate: string;
    privacy: string;
    terms: string;
    copyright: string;
  };

  months: {
    jan: string;
    feb: string;
    mar: string;
    apr: string;
    may: string;
    jun: string;
    jul: string;
    aug: string;
    sep: string;
    oct: string;
    nov: string;
    dec: string;
  };

  common: {
    na: string;
    close: string;
  };

  climate: {
    title: string;
    metric: string;
    air: string;
    water: string;
    humidity: string;
    legend: string;
    uv: {
      low: string;
      moderate: string;
      high: string;
      veryHigh: string;
    };
  };

  destination: {
    time: {
      title: string;
      empty: string;
    };
    info: {
      title: string;
      capital: string;
      languages: string;
      currency: string;
    };
    cities: { title: string };
    faq: {
      visa: string;
      entry: string;
      return: string;
      empty: string;
    };
    poi: { title: string };
    cta: {
      pick: { title: string };
    };
  };

  destinations: {
    title: string;
    fallbackTitle: string;
  };

  reviews: {
    title: string;
    subtitle: string;
    list: { aria: string };
    empty: string;
    openAria: string;
    new: string;
    pagination: {
      aria: string;
      prev: string;
      next: string;
    };
    form: {
      title: string;
      nameLabel: string;
      namePh: string;
      ratingLabel: string;
      textLabel: string;
      textPh: string;
      photosLabel: string;
      remove: string;
      add: string;
      left: string;
      formatHint: string;
      submit: string;
      sending: string;
      ok: string;
      errors: {
        required: string;
        submit: string;
        generic: string;
      };
    };
    modal: { title: string };
  };

  uploader: {
    remove: string;
    addTitle: string;
    add: string;
    left: string;
    loading: string;
  };

  about: {
    hero: {
      kicker: string;
      title: string;
      works: string;
      sinceYear: string;
      forYou: string;
      desc: string;
    };
    stats: {
      happyTourists: string;
      support: string;
      official: string;
      certs: string;
      certificateSoon: string;
    };
    why: {
      title: string;
      card1: { title: string; text: string };
      card2: { title: string; text: string };
      card3: { title: string; text: string };
      card4: { title: string; text: string };
    };
    safety: {
      title: string;
      text: string;
      point1: string;
      point2: string;
      point3: string;
    };
    docs: {
      title: string;
      certificate: string;
      certificatePdf: string;
      certificateScan: string;
      certificatePlaceholder: string;
      openFile: string;
      noFile: string;
      certificateNone: string;
      terms: string;
      privacy: string;
      sinceShort: string;
      yearShort: string;
      addressTBD: string;
    };
    faq: {
      title: string;
      q1: string;
      a1: string;
      q2: string;
      a2: string;
      q3: string;
      a3: string;
      q4: string;
      a4: string;
    };
    contacts: {
      title: string;
      phone: string;
      whatsapp: string;
      instagram: string;
      address: string;
      pending: string;
      ask: string;
    };
    map: { title: string };
    final: { title: string; cta: string };
  };
}