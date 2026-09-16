# Artwork photography

Drop artwork files here, then point `src/data/artworks.js` at them.

```js
{
  id: 'artwork-01',
  title: 'Real title',
  year: '2019',
  medium: 'Oil on canvas',
  dimensions: '180 × 140 cm',
  image: '/artworks/artwork-01.jpg',   // <- path is relative to /public
  ratio: '3 / 4',                      // <- the file's true aspect ratio
}
```

The moment `image` is filled in, the placeholder in that slot is replaced by
the real photograph. Nothing about the layout changes.

## Preparing files

- Longest edge around 2000 px is enough for full-bleed use on a 1440 screen.
- Save as WebP where possible, JPEG at quality 82 otherwise.
- Keep the file name equal to the artwork `id` so the archive stays sortable.
- Set `ratio` to the real proportions of the file. It reserves the space
  before the image loads, which is what stops the page from jumping.
