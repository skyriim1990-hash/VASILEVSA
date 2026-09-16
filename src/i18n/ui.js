/**
 * SITE COPY
 *
 * Every string on the site lives here rather than hardcoded in components.
 *
 * Only verified biographical facts are used:
 *   - Bulgarian-born, based in London
 *   - a stay in New York in the late 1990s, and the influence of American
 *     Abstract Expressionism (Hofmann, Gorky, Pollock, Rothko)
 *   - a mosaic-like approach joining figurative and abstract qualities
 *   - Art × Sport, developed mainly 2014–2015, 400+ works, with world and
 *     Olympic champions taking physical part in the making
 *
 * Nothing else is asserted. Unknown data is rendered as a marked placeholder.
 */

export const DEFAULT_LANG = 'en';

export const ui = {
  en: {
    // ---------------------------------------------------------------- meta
    'site.name': 'Alexandre Vassilev-Vasilevsa',
    'site.shortName': 'AV',
    'site.role': 'Contemporary Artist',
    'site.location': 'London, United Kingdom',
    'meta.title': 'Alexandre Vassilev-Vasilevsa | Contemporary Artist',
    'meta.description':
      'Bulgarian-born, London-based contemporary artist working across abstraction, figurative painting, action painting and Art × Sport.',

    // ---------------------------------------------------------------- nav
    'nav.works': 'Works',
    'nav.artsport': 'Art × Sport',
    'nav.exhibitions': 'Exhibitions',
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
    'ph.artsport': 'Art × Sport image placeholder',
    'ph.portrait': 'Artist portrait placeholder',
    'ph.video': 'Video placeholder',
    'ph.awaiting': 'Awaiting photography',
    'ph.awaitingVideo': 'Reserved for film',
    'ph.note':
      'Marked placeholders stand in for photography that has not been supplied yet. They demonstrate composition, proportion and rhythm only — they are not works by the artist.',

    // ---------------------------------------------------------------- home
    'home.eyebrow': 'Contemporary artist — Bulgaria / London',
    'home.statement1': 'Painting as movement.',
    'home.statement2': 'Colour as energy.',
    'home.intro':
      'Alexandre Vassilev-Vasilevsa is a Bulgarian-born contemporary artist based in London. His practice moves between abstraction and figuration, held together by gesture, colour and the physical act of painting.',
    'home.rail': 'Painting as an act, not an object',
    'home.quote': 'Painting as an act, not an object.',
    'home.quoteNote':
      'The work begins with the body — with movement, pressure and the moment paint meets surface.',
    'home.selected': 'Selected works',
    'home.selectedNote': 'A shortlist from across the practice.',
    'home.artsportTitle': 'Art × Sport',
    'home.artsportLead':
      'World and Olympic champions take physical part in the making of a painting — movement, touch and paint recorded directly on the canvas.',
    'home.artsportCta': 'Enter Art × Sport',
    'home.aboutTitle': 'Born in Bulgaria. Based in London. Shaped by New York.',
    'home.aboutLead':
      'A stay in New York in the late 1990s opened his work to American Abstract Expressionism, and to a way of painting where energy is the subject.',
    'home.aboutCta': 'About the artist',

    // ---------------------------------------------------------------- works
    'works.title': 'Works',
    'works.lead':
      'Paintings across abstraction, figuration and action painting. The archive is being catalogued; images and details will follow.',
    'works.filterLabel': 'Filter works by category',
    'works.count': 'works',
    'works.empty': 'No works in this category yet.',

    // ---------------------------------------------------------------- detail
    'detail.year': 'Year',
    'detail.medium': 'Medium',
    'detail.dimensions': 'Dimensions',
    'detail.category': 'Category',
    'detail.about': 'About the work',
    'detail.pendingNote':
      'Full details for this work will be published once the archive entry is complete.',
    'detail.enquire': 'Enquire about this work',

    // ---------------------------------------------------------------- art × sport
    'as.title': 'Art × Sport',
    'as.chain': 'Athlete → Movement → Paint → Canvas → Artwork',
    'as.lead':
      'A body of work in which sport is not the subject of the painting but its source. World and Olympic champions take physical part in the making — the same movement that wins a title leaves its trace in paint.',
    'as.stat1n': '400+',
    'as.stat1l': 'Paintings created',
    'as.stat2n': '2014—2015',
    'as.stat2l': 'Principal period',
    'as.stat3n': 'World & Olympic',
    'as.stat3l': 'Champions involved',
    'as.ch1t': 'Movement',
    'as.ch1b':
      'It starts before the paint. A trained body carries a way of moving that belongs to it alone — a rhythm, a weight, a direction. That is the material the work is made from.',
    'as.ch2t': 'The act',
    'as.ch2b':
      'Hands, paint, surface. The gesture is not described afterwards; it is performed once and stays as it fell. Nothing is corrected back into place.',
    'as.ch3t': 'The athlete',
    'as.ch3b':
      'The champion is not a model and not a guest. They enter the work physically, and what they bring cannot be reproduced by the painter alone.',
    'as.ch4t': 'The canvas',
    'as.ch4b':
      'The surface receives contact rather than depiction. Pressure, speed and hesitation are all legible in what is left behind.',
    'as.ch5t': 'The artwork',
    'as.ch5b':
      'What remains is a record of an event. The painting holds a movement that happened once, at a particular moment, between particular people.',
    'as.ch6t': 'The result',
    'as.ch6b': 'Selected works from the series.',
    'as.filmTitle': 'Film',
    'as.filmNote':
      'This area is reserved for documentation of the process. Film will be added when supplied.',

    // ---------------------------------------------------------------- about
    'about.title': 'About',
    'about.statement': 'Born in Bulgaria. Based in London. Shaped by New York.',
    'about.introTitle': 'Introduction',
    'about.intro1':
      'Alexandre Vassilev-Vasilevsa is a Bulgarian-born contemporary artist living and working in London. He paints across contemporary, abstract and figurative registers, and works in action painting and in the Art × Sport series.',
    'about.intro2':
      'His visual language turns on movement, energy, colour and gesture — on painting understood as something done rather than something arranged.',
    'about.bioTitle': 'Biography',
    'about.bio1':
      'A stay in New York in the late 1990s marked a turn in his development and opened his interest in American Abstract Expressionism, including the work of Hans Hofmann, Arshile Gorky, Jackson Pollock and Mark Rothko.',
    'about.bio2':
      'From that encounter he built a recognisable mosaic-like approach: a technique in which figurative and abstract qualities are held in the same surface rather than kept apart.',
    'about.philTitle': 'Philosophy',
    'about.phil1':
      'Emotion, the subconscious and freedom run through the work. Painting is treated as visual communication — a direct exchange that does not pass through explanation first.',
    'about.phil2':
      'Colour carries energy. Gesture carries the body. What the painting records is the moment the two met.',
    'about.practiceTitle': 'Practice',
    'about.practice1':
      'The mosaic-like method builds an image out of accumulated marks. Read close, the surface breaks into fragments of colour; read at distance, figure and field resolve into one another.',
    'about.asTitle': 'Art × Sport',
    'about.as1':
      'The Art × Sport project, developed mainly across 2014 and 2015, brought world and Olympic champions into the physical making of paintings through movement, touch and direct work with paint. More than 400 works have been produced within this direction.',
    'about.asCta': 'See the project',

    // ---------------------------------------------------------------- exhibitions
    'ex.title': 'Exhibitions',
    'ex.lead':
      'A chronological record of exhibitions. The history is being compiled and will be published here.',
    /* Shown in place of the timeline while the database holds no published
       exhibitions. `ex.notice` below described the placeholder rows and is no
       longer rendered anywhere — the rows it referred to are gone. */
    'ex.empty':
      'A chronological record of exhibitions. The archive is currently being compiled and will be published here.',
    'ex.notice':
      'Exhibition history has not been supplied yet. The entries below are marked placeholders showing how real records will appear.',
    'ex.solo': 'Solo',
    'ex.group': 'Group',
    'ex.venue': 'Venue',
    'ex.location': 'Location',
    'ex.phTitle': 'Exhibition title',
    'ex.phVenue': 'Gallery or institution',
    'ex.type': 'Type',

    // ---------------------------------------------------------------- contact
    'contact.title': "Let's talk about art.",
    'contact.lead':
      'For exhibitions, collaborations, acquisitions and professional enquiries.',
    'contact.e1': 'Exhibition enquiries',
    'contact.e2': 'Collaborations',
    'contact.e3': 'Acquisitions',
    'contact.e4': 'Professional enquiries',
    'contact.name': 'Name',
    'contact.email': 'Email',
    'contact.subject': 'Subject',
    'contact.message': 'Message',
    'contact.send': 'Send enquiry',
    'contact.sending': 'Sending…',
    'contact.sent': 'Thank you — your enquiry has been sent.',
    'contact.failed': 'The enquiry could not be sent. Please try again.',
    'contact.required': 'required',
    'contact.selectSubject': 'Select a subject',
    'contact.notConfigured':
      'This form is not connected to a mailbox yet. Provide a delivery address or form endpoint and it will start sending.',
    'contact.detailsPending':
      'Contact details will be published once confirmed.',

    // ---------------------------------------------------------------- footer
    'footer.tagline': 'Painting as movement. Colour as energy.',
    'footer.nav': 'Navigate',
    'footer.privacy': 'Privacy',
    'footer.terms': 'Terms',
    'footer.rights': 'All rights reserved.',
    'footer.credit': 'Site in development — placeholder imagery.',

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
