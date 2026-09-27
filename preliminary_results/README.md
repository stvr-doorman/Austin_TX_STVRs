# Austin preliminary map

Open index.html. Publish this entire folder with its relative paths intact. No backend or build step is needed for viewing. Leaflet and its control images are embedded in index.html; OpenStreetMap background tiles need internet.

The full saved city list (September 27, 2026) has 3011 records. Green candidate areas represent 2820 records in 1794 address blocks; 191 records could not be mapped and remain in the complete license page and block audit.

Method: match each license's hundred-block street and ZIP to official City of Austin Address Locator points, then union every supplied lot polygon containing those points. These are candidate block areas, not exact licensed parcels or surveyed street-block boundaries. No nearest-parcel guesses are made. The audit lists matches and failures. Plots or address points absent from the inputs cannot be represented.

Tile permit counts and differences are ranges based on mapped candidate areas fully inside / intersecting each tile. They exclude unmapped licenses and are conditional on the candidate-area approximation. Shared Airbnb listings are assigned to the intersection of their completed search tiles; incompatible memberships stay unresolved. Counts across overlapping areas are not additive.

City licenses: https://data.austintexas.gov/Public-Safety/Short-Term-Rental-Locations/2fah-4p7e/about_data
Address-point geometry: https://maps.austintexas.gov/gis/rest/Shared/Locators/MapServer/0
Plots: supplied Lot_Line_20260926.csv
Airbnb: saved local scrape_results/tile_results.geojson

Rebuild from austin_done/preliminary_map.ipynb or build_preliminary_map.py. Large raw plot files and address caches stay outside this publish folder. file_sizes.json verifies every published file is below 25 MiB, which is also below GitHub's 100 MiB Git limit.
