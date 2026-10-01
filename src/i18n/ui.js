/**
 * SITE COPY
 *
 * Every string on the site lives here rather than hardcoded in components.
 *
 * This is a fictional concept project: an editorial archive built around
 * Vincent van Gogh (1853–1890). It is not affiliated with the Van Gogh Museum
 * or any other institution and must never read as an official one.
 *
 * Only verified historical facts are asserted — no invented quotes, exhibitions,
 * biography or provenance. The period and biography copy below follows the Van
 * Gogh Museum's own biography pages and the National Gallery's artist page.
 * Unknown data is rendered as a marked placeholder.
 */

export const DEFAULT_LANG = 'en';

export const ui = {
  en: {
    // ---------------------------------------------------------------- meta
    'site.name': 'Vincent van Gogh',
    'site.shortName': 'VvG',
    'site.role': 'Post-Impressionist Painter',
    'site.location': 'Netherlands · France',
    'meta.title': 'Vincent van Gogh — Works & Paintings | Concept Archive',
    'meta.description':
      'An independent concept archive of ten paintings by Vincent van Gogh, traced through the places where he worked.',
    'meta.works':
      'Ten paintings by Vincent van Gogh, arranged by the places where he worked. An independent concept archive.',
    'meta.periods':
      'Nuenen, Paris, Arles, Saint-Rémy and Auvers — five places traced through Vincent van Gogh’s work.',
    'meta.about':
      'Dutch painter, 1853–1890. A concise factual outline within an independent concept portfolio project.',
    'meta.contact':
      'An independent concept portfolio built around the work of Vincent van Gogh. Not an official site.',

    // ---------------------------------------------------------------- nav
    'nav.works': 'Works',
    'nav.periods': 'Periods',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.menu': 'Menu',
    'nav.close': 'Close',
    'nav.open': 'Open menu',
    'nav.home': 'Home',
    'nav.language': 'Language',
    'nav.skip': 'Skip to content',

    // ---------------------------------------------------------------- common
    'common.viewAll': 'All works',
    'common.index': 'Index',
    'common.back': 'Back to works',
    'common.prev': 'Previous',
    'common.next': 'Next',

    // ---------------------------------------------------------------- placeholders
    'ph.artwork': 'Artwork placeholder',
    'ph.short': 'Placeholder',
    'ph.awaiting': 'Awaiting photography',

    // ---------------------------------------------------------------- disclosure
    /* The short line sits in the footer, so it is on every page. The long one
       is carried in prose by About and by the project page. */
    'disclosure.short':
      'An independent concept project — not an official Van Gogh site, and not affiliated with any institution named in it.',

    // ---------------------------------------------------------------- home
    'home.eyebrow': 'Concept archive — Netherlands / France',
    /* The homepage title, one key per line. The full stop after the second
       line is not part of the string — HomeView sets it in the accent. */
    'home.title1': 'Vincent',
    'home.title2': 'van Gogh',
    'home.statement': 'Dutch painter, 1853–1890.',
    'home.lead':
      'Vincent van Gogh painted for roughly the last decade of his life, working first in the Netherlands and then in France. The paintings here are drawn from those years.',
    'home.selected': 'Selected works',
    'home.selectedNote': 'Four, from across the decade.',
    'home.exploreCta': 'Explore the works',
    'home.periodsLabel': 'Periods',
    'home.periodsNote': 'Five places. One decade of painting.',
    'home.periodsCta': 'View the periods',
    'home.aboutTitle': 'Selected works from the archive.',
    'home.aboutLead':
      'An independent concept project built around Van Gogh’s work. Titles, dates, media and dimensions follow the records of the museums that hold the paintings.',
    'home.aboutCta': 'About the archive',

    // ---------------------------------------------------------------- works
    'works.title': 'Works',
    'works.lead':
      'Paintings arranged by the places they were made in.',
    'works.filterLabel': 'Filter works by period',
    'works.count': 'works',
    'works.countOne': 'work',
    'works.empty': 'No works from this period yet.',

    // ---------------------------------------------------------------- detail
    'detail.year': 'Year',
    'detail.medium': 'Medium',
    'detail.dimensions': 'Dimensions',
    'detail.period': 'Period',
    'detail.about': 'About the work',
    'detail.pendingNote':
      'Full details for this work will be published once the archive entry is complete.',
    'detail.enquire': 'About this project',

    // ---------------------------------------------------------------- periods
    'periods.title': 'Periods',
    'periods.lead': 'A decade of painting, traced through five places.',

    'periods.p1name': 'Nuenen',
    'periods.p1dates': '1883–1885',
    'periods.p1place': 'The Netherlands',
    'periods.p1body':
      'Van Gogh moved back into his parents’ house in Nuenen in 1883 and spent two years painting the people who worked around the village — weavers at their looms, farmers in the fields. The palette is earth and shadow. The Potato Eaters, painted in April and May 1885, closes the period.',

    'periods.p2name': 'Paris',
    'periods.p2dates': '1886–1888',
    'periods.p2place': 'France',
    'periods.p2body':
      'Two years in Paris. Van Gogh saw Impressionist and Post-Impressionist painting at close range and lightened his palette. He painted a great many self-portraits in these years, using them as practice.',

    'periods.p3name': 'Arles',
    'periods.p3dates': '1888–1889',
    'periods.p3place': 'Provence',
    'periods.p3body':
      'He went south to Arles in 1888. He rented four rooms in a house on the Place Lamartine — the Yellow House — hoping to make it a studio where painters could work alongside one another. Paul Gauguin arrived at the end of October 1888 and stayed until December. Here the brushwork loosens and the colour opens up.',

    'periods.p4name': 'Saint-Rémy',
    'periods.p4dates': '1889–1890',
    'periods.p4place': 'Saint-Rémy-de-Provence',
    'periods.p4body':
      'In May 1889 Van Gogh admitted himself to the hospital at Saint-Paul-de-Mausole. He stayed a year and worked steadily through it — around 150 paintings — from the garden, the enclosed field and the country around the building.',

    'periods.p5name': 'Auvers',
    'periods.p5dates': '1890',
    'periods.p5place': 'Auvers-sur-Oise',
    'periods.p5body':
      'He left Saint-Rémy in May 1890 for Auvers-sur-Oise, a village north of Paris where other painters had settled. He worked at close to a canvas a day, mostly the gardens and wheatfields around the village. He died there on 29 July 1890.',

    // ---------------------------------------------------------------- about
    'about.title': 'About',
    /* Set one sentence per line by AboutView, which splits on the full stop. */
    'about.statement':
      'Dutch painter. 1853–1890. About ten years of work, in the Netherlands and in France.',
    'about.b1title': 'The work',
    'about.b1':
      'Van Gogh decided to become a painter at twenty-seven, after trying the art trade, schoolteaching and lay preaching. He took lessons from the painter Anton Mauve in The Hague and spent a short period at the academy in Antwerp. In the decade that followed he made more than 850 paintings and close to 1,300 works on paper.',
    'about.b2title': 'From dark to light',
    'about.b2':
      'The early Dutch paintings are built from earth colours and shadow: weavers, farmers, the insides of working houses. Paris changed that. Seeing Impressionist and Post-Impressionist work at close range, he lightened his palette. In Arles his style became looser and more expressive.',
    'about.b3title': 'Places',
    'about.b3':
      'Five places shape this archive. Nuenen, where he painted the people who worked around his parents’ village. Paris, where the palette changed. Arles, where he rented the Yellow House and hoped to start a studio for painters working together. Saint-Rémy, where he spent a year at the hospital of Saint-Paul-de-Mausole and kept working throughout. And Auvers-sur-Oise, where he painted almost daily until his death in July 1890.',
    'about.b4title': 'About this archive',
    'about.b4':
      'This is an independent concept project: a design and development exercise, not an institutional publication. The paintings are public-domain reproductions. Titles, dates, media and dimensions follow the records of the museums that hold the works.',

    // ---------------------------------------------------------------- project page
    'contact.title': 'About this project',
    'contact.p1':
      'This site is an independent concept portfolio — a design and development exercise built around the work of Vincent van Gogh. It is not connected to any museum, foundation or estate, and nothing here is for sale.',
    'contact.p2':
      'The paintings are public-domain reproductions from Wikimedia Commons. Catalogue data follows the records of the institutions that hold the originals.',
    'contact.p3': 'For questions about the design or the build:',
    'contact.email': 'skyriim1990@gmail.com',

    // ---------------------------------------------------------------- footer
    'footer.dates': '1853–1890',
    'footer.nav': 'Navigate',
    'footer.privacy': 'Privacy',
    'footer.terms': 'Terms',

    // ---------------------------------------------------------------- legal
    'legal.privacy': 'Privacy',
    'legal.terms': 'Terms',
    'legal.pending':
      'The legal text for this page has not been drafted yet. It will be published before the site goes live.',
    'legal.note':
      'The site sets no tracking cookies and runs no analytics in its current form.',

    // ---------------------------------------------------------------- 404
    '404.title': 'Page not found',
    '404.lead': 'The page you were looking for does not exist.',
    '404.cta': 'Return home',
  },
};
