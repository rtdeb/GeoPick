# GeoPick
## Implementing best practices for georeferencing.
![](src/geopick-screenshot.png)
GeoPick is an open source online companion tool to the Georeferencing Best Practices [(Chapman A.D. and Wieczorek J.R.)](https://docs.gbif.org/georeferencing-best-practices/1.0/en) that follows its recommendations and practices. Its idea started within work done in the [Museu de Ciències Naturals de Barcelona (MCNB)](https://museuciencies.cat/) and the [MOBILISE Cost Action](https://www.mobilise-action.eu/). It is meant to provide georeferencers with a simple, easy-to-use yet powerful tool that helps them to follow best georeferencing practices and data standards (i.e., [Darwin Core](https://dwc.tdwg.org/)). The guiding principle behind its design is to remain as simple and user-friendly as possible.

### FEATURES
#### Georeferencing methods
The tool implements both the [point-radius](https://docs.gbif.org/georeferencing-best-practices/1.0/en/#point-radius-method) and [shape](https://docs.gbif.org/georeferencing-best-practices/1.0/en/#shape-method) georeferencing methods.

> **Point-radius method**. Once the [polygon](https://docs.gbif.org/georeferencing-best-practices/1.0/en/#polygons) or [line/path](https://docs.gbif.org/georeferencing-best-practices/1.0/en/#paths) have been digitised, the tool automatically calculates and displays the centroid and the uncertainty. In the case that the centroid does not fall on or within the polygon boundaries or on top of the line path, i.e., a concave geometry, the tool automatically calculates the [corrected centre](https://docs.gbif.org/georeferencing-best-practices/1.0/en/#corrected-center) and places it to the nearest point on the georeferenced line or polygon. It then calculates the minimum bounding circle to obtain the coordinates uncertainty.

> **Shape method**. The tool partially implements the shape method. The digitised polygon or line/path are kept and exported in the Darwin Core [dwc:footprintWKT](https://dwc.tdwg.org/list/#dwc_footprintWKT) format.
To run: 

#### Data import
Geometries can be imported via [Well-Known Text (WKT)](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry) format; used by the Darwin Core [dwc:footprintWKT](https://dwc.tdwg.org/list/#dwc_footprintWKT) term. Please note that MULTIPOINT and GEOMETRYCOLLECTION types are not supported.

#### Data export
Data is exported in the [Darwin Core format for location data](https://dwc.tdwg.org/terms/#location), including the coordinate uncertainty in metres and the digitised shape in the [Text format defined by ISO 2016](https://www.iso.org/standard/60343.html). Data can be easily copied and pasted into a spreadsheet.

#### On-screen digitisation
The tool allows the user to digitise polygons, lines and points, at any zoom level, to respresent descriptions of polygonal and lineal localities. Once done, the vertices of both graphical objects can be edited and moved around. In the case of a point, it can be moved around and the radius of uncertainty can be modified.

#### Layers
Georeferencing can be done using OpenStreetMap, or any of the following Google views: Default, Terrain, Satellite, or Hybrid.

#### Site search
The tool uses the [OpenStreetMap Nominatim API](https://nominatim.openstreetmap.org/ui/about.html) to help do a first approximation to the location of the site to be georeferenced. The polygon returned by the [OpenStreetMap Nominatim API](https://nominatim.openstreetmap.org/ui/about.html) can be easily imported and used.

#### Coordinates and scale
The map coordinates are shown when moving the cursor around, and the scale is also shown when zooming in and out. Coordinates are in decimal degrees and the scale is shown in either kilometres and miles, or metres and feet, depending on the zoom level.

### A FINAL NOTE ON UNCERTAINTY
GeoPick gives coordinates with seven decimal places following Georeferencing Best Practices ([Chapman and Wieczorek, 2022](https://docs.gbif.org/georeferencing-best-practices/1.0/en/#uncertainty-related-to-coordinate-precision)) and Georeferencing Quick Reference Guide ([Zermoglio et al., 2022](https://docs.gbif.org/georeferencing-quick-reference-guide/1.0/en/#s-coordinate-format)). This allows preservation of the correct coordinates in all formats regardless of how many transformations are done ([Bloom et al., 2020](https://docs.gbif-uat.org/georeferencing-calculator-manual/1.0/en/); [Wiezorek et al., 2010](https://doi.org/10.1080/13658810412331280211)). Accordingly, GeoPick sets coordinate precision to a fixed value of 0.0000001, which is a decimal representation of the number of decimals given with the coordinates ([Darwin Core Maintenance Group, 2021](https://dwc.tdwg.org/terms/#dwc:coordinatePrecision)). Please also note that as in this version of GeoPick, 1.0, coordinate uncertainty refers only to the radius of the bounding circle of the geometry and does not take into account other sources of uncertainty such as those derived from measurement accuracy and the accuracy of the underlying maps. To add this extra source of uncertainty please access the Georeferencing Calculator ([Wieczorek C and Wieczorek J.R., 2021](http://georeferencing.org/georefcalculator/gc.html)) and its manual ([Bloom et al., 2020](https://docs.gbif-uat.org/georeferencing-calculator-manual/1.0/en/)).

<hr>

##### How to cite:
Marcer A., Escobar E., Uribe F., Chapman A.D. and Wieczorek J.R.(version 1.0.2023). GeoPick: Implementing best practices for georeferencing [web application], URL: https://nhc.creaf.cat/geopick, GitHub: https://github.com/aescobarr/GeoPick

<hr>

##### Feedback:
You may give us feedback on bugs or desired enhancements by sending an email to X. Please understand though, that we will not respond to all emails and will not be able to satisfy all suggested enhancements. However, we will do our best to solve any existing bugs.

<hr>

### HOW TO INSTALL
To download, install, and run the application, please follow these steps:

#### 1 Download project
Requirement: *git*

> git clone https://github.com/aescobarr/GeoPick.git  

#### 2 Set up server API
Requirements: R version 4.2.1

You can configure some API parameters through the *.env* file. You can see an example of it in this repo's *.env_example*

> cd R
> Rscript geopick_server.R

#### 3 Set up client side  
Requirements: npm v16.16.0 with webpack

You can change the port by modifying file the *webpack.dev.js* before executing the command *npm run start*.

> cd GeoPick  
> npm install  
> npm run start  

Once done, you can access the application at http://localhost:8085 (8085 is the default development port used here), or at the web server address where you deployed the application.


