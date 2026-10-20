# Homepage globe resources

This is a fixed GFS **500 hPa analysis snapshot**, not a live weather service.
Particles visualize advection through a stationary wind field; they do not show
the atmosphere evolving through a sequence of forecast times.

## Data and processing

- Source: NOAA / NCEP GFS, 2026-10-20 00:00 UTC, forecast hour 000, 1° grid.
- Selected source fields: `UGRD:500 mb`, `VGRD:500 mb`, `PRES:surface`.
- Original URL, inventory records, byte ranges, source-message SHA-256 hashes,
  grid geometry, model Earth radius, and output hash are in `wind-500.json`.
- `wind-500.bin`: north-to-south rows, longitudes 0–359° east, interleaved
  little-endian float32 u/v in m/s. The one source cell below terrain
  (87°E, 28°N; surface pressure below 50,000 Pa) is filled from the four valid
  diagonal neighbours by bilinear interpolation. At the rectangle centre,
  each corner has the geometric weight 1/4; no empirical weights are tuned.
  Method reference: <https://sites.ecmwf.int/docs/atlas/design/interpolation/>.
  This fills a visualisation gap; it is not an observation of below-ground wind.
  Metadata lists the filled cell and its resulting u/v. The other 65,159
  grid points retain their original float32 wind components unchanged.
- All 65,160 grid points are finite after gap filling. The renderer converts
  east/north winds into Cartesian tangent vectors, interpolates them, projects
  back onto the tangent plane, and uses normalized midpoint integration.
  The Cartesian formulation avoids division by cos(latitude) near the poles.
- The renderer uses a uniform 24,000× presentation clock. Random seeding and
  lifetimes distribute tracers; they never modify the velocity field. The
  interactive globe uses 6,400 tracers on desktop and 2,800 on mobile.
- The color scale is continuous from zero to the maximum valid grid wind speed
  (71.7076 m/s), rather than meteorological threshold categories.
- `earth-wind-static.png` is rendered from the same binary data and Earth image,
  at 130°E / 55°N, for JavaScript-disabled and unavailable-WebGL cases.
- `places.json` contains the shared default view and Natural Earth 1:50m city
  coordinates for Chengdu (Hometown) and Seattle (Undergraduate). These roles
  were supplied by the site owner. Both cities are visible in the initial view;
  interactive labels are hidden on the far side of the sphere. The same points
  are included in the static fallback image; bilingual HTML buttons overlay
  their coordinates in both views. Clicking a city opens a translucent introduction
  card. City names, roles and introductions follow the homepage language.
  The short geographic descriptions cite their official sources in `places.json`.

Persistent processing environment on the development machine:

```sh
/Users/luoyiding/.local/share/homepage-tools/bin/python scripts/prepare-home-wind.py 20261020 00
/Users/luoyiding/.local/share/homepage-tools/bin/python scripts/render-home-fallback.py
```

Dependencies: ECMWF ecCodes Python interface, NumPy, Pillow. The downloaded
source GRIB is decoded in memory; only selected fields are fetched.
Fetching or decoding errors stop processing before a new snapshot is saved.

## Texture, coastline, library and icon credits

- `earth-day.jpg`: NASA Visible Earth / Blue Marble, shaded land and shallow
  ocean topography, original 2048 px equirectangular image:
  <https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57752/land_shallow_topo_2048.jpg>.
  Collection: <https://science.nasa.gov/earth/earth-observatory/collections/blue-marble/>.
- `earth-normal.jpg`: Three.js Earth normal-map example asset:
  <https://threejs.org/examples/textures/planets/earth_normal_2048.jpg>.
- `coastline.json`: Natural Earth 1:110m coastline, public domain:
  <https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_coastline.geojson>.
- Three.js **0.186.1**, including OrbitControls, is vendored under
  `assets/vendor/three/`. MIT license is included. Files came from jsDelivr's
  pinned npm package. The minified core is stored as `three.core.js` to match
  the module's internal relative import; no library code was modified.
- Bilibili and GitHub: Simple Icons SVG assets (CC0), from
  <https://github.com/simple-icons/simple-icons/tree/develop/icons>.
- LinkedIn: Devicon `linkedin-plain.svg`, from
  <https://github.com/devicons/devicon/tree/master/icons/linkedin> (MIT).
- UW: official white Block W, from the UW Brand logos page:
  <https://cdn.uw.edu/wp-content/uploads/sites/230/2023/11/02134810/W-Logo_White.png>.
- DawgCast: locally drawn weather-broadcast navigation symbol. It is not claimed
  to be an official DawgCast logo; the official website could not be retrieved
  during implementation. The original external destination is preserved.

All runtime resources are local. No visitor requests to a third-party texture,
icon, JavaScript CDN, or weather API are required.
