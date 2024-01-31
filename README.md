# GeoPick
## Enhancing georeferencing efficiency through best practices
GeoPick is an open source online companion tool to the Georeferencing Best Practices [(Chapman A.D. and Wieczorek J.R.)](https://docs.gbif.org/georeferencing-best-practices/1.0/en) that follows its recommendations and practices. Its idea started within work done in the [Museu de Ciències Naturals de Barcelona (MCNB)](https://museuciencies.cat/) and the [MOBILISE Cost Action](https://www.mobilise-action.eu/). It is meant to provide georeferencers with a simple, easy-to-use yet powerful tool that helps them to follow best georeferencing practices and data standards (i.e., [Darwin Core](https://dwc.tdwg.org/)). The guiding principle behind its design is to remain as simple and user-friendly as possible.

![](src/geopick-screenshot.png)
### FEATURES
#### Georeferencing methods
The tool implements both the [point-radius](https://docs.gbif.org/georeferencing-best-practices/1.0/en/#point-radius-method) and [shape](https://docs.gbif.org/georeferencing-best-practices/1.0/en/#shape-method) georeferencing methods.

> **Point-radius method**. Once the [polygon](https://docs.gbif.org/georeferencing-best-practices/1.0/en/#polygons) or [line/path](https://docs.gbif.org/georeferencing-best-practices/1.0/en/#paths) have been digitised, the tool automatically calculates and displays the centroid and the uncertainty. In the case that the centroid does not fall on or within the polygon boundaries or on top of the line path, i.e., a concave geometry, the tool automatically calculates the [corrected centre](https://docs.gbif.org/georeferencing-best-practices/1.0/en/#corrected-center) and places it to the nearest point on the georeferenced line or polygon. It then calculates the smallest enclosing circle to obtain the coordinates uncertainty.

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

#### Georeference sharing
Each georeferenced location is assigned a unique locationID (http://rs.tdwg.org/dwc/terms/locationID) and can be used to share georeferences among GeoPick users. GeoPick provides with a share link in the form of https://geopick.gbif.org/?locationid=<locationID>. 

### A FINAL NOTE ON UNCERTAINTY
GeoPick gives coordinates with seven decimal places following Georeferencing Best Practices ([Chapman and Wieczorek, 2022](https://docs.gbif.org/georeferencing-best-practices/1.0/en/#uncertainty-related-to-coordinate-precision)) and Georeferencing Quick Reference Guide ([Zermoglio et al., 2022](https://docs.gbif.org/georeferencing-quick-reference-guide/1.0/en/#s-coordinate-format)). This allows preservation of the correct coordinates in all formats regardless of how many transformations are done ([Bloom et al., 2020](https://docs.gbif-uat.org/georeferencing-calculator-manual/1.0/en/); [Wiezorek et al., 2010](https://doi.org/10.1080/13658810412331280211)). Accordingly, GeoPick sets coordinate precision to a fixed value of 0.0000001, which is a decimal representation of the number of decimals given with the coordinates ([Darwin Core Maintenance Group, 2021](https://dwc.tdwg.org/terms/#dwc:coordinatePrecision)). Please also note that as in this version of GeoPick, coordinate uncertainty refers only to the radius of the enclosing circle of the geometry and does not take into account other sources of uncertainty such as those derived from measurement accuracy and the accuracy of the underlying maps. To add this extra source of uncertainty please access the Georeferencing Calculator ([Wieczorek C and Wieczorek J.R., 2021](http://georeferencing.org/georefcalculator/gc.html)) and its manual ([Bloom et al., 2020](https://docs.gbif-uat.org/georeferencing-calculator-manual/1.0/en/)).

<hr>

### HOW TO CITE:
Marcer A., Escobar E., Uribe F., Chapman A.D. and Wieczorek J.R. (2023). GeoPick: Enhancing georeferencing efficiency through best practices [web application, version 1.0.0], URL: https://geopick.gbif.org

<hr>

### PUBLIC URL:
https://geopick.gbif.org

<hr>

### LICENSE:
[AGPLv3](https://www.gnu.org/licenses/agpl-3.0.en.html)

<hr>

### DISCLAIMER:
*GeoPick* is provided *"as is"* without warranty or liability for any purpose. Though developed with all the good intentions to make it correct and fit-for-purpose, that does not mean it is completely error-free. The authors are committed to do their best to correct errors, but can not guarantee their quick resolution.

<hr>

### FEEDBACK:
You may give us feedback on bugs or desired enhancements by sending an email to *geopick [at] creaf [dot] uab [dot] cat*. We will do our best to solve any existing bugs. Please understand, though, that we will not respond to all emails and will not be able to satisfy all suggested enhancements. However, your input will be of much value when considering future developments. 

For those acquainted with GitHub, you may [use GitHub's interface to raise issues](https://github.com/rtdeb/GeoPick/issues). Please set the label to *Feedback from user*
<hr>

### HOW TO INSTALL
To download, install, and run the application, please follow these steps:

#### 1 Download the project
Requirements: git

> git clone https://github.com/rtdeb/GeoPick.git  

#### 2 Set up the database

GeoPick uses a [PostgreSQL](https://www.postgresql.org/) database to store georeference data. Download and install an instance of the database.

##### 2.1 Create user and database

We recommend creating a dedicated database and user for GeoPick. First, we create a user called 'geopick' (you can choose any name you like):

> CREATE ROLE geopick LOGIN PASSWORD 'mypassword' NOSUPERUSER INHERIT NOCREATEDB NOCREATEROLE NOREPLICATION;

This user will be the owner of the database and GeoPick will use it to open connections. Now, create the database. From the shell, as the postgresql administrative user (usually postgres) do:

> createdb geopick -O geopick

We created a database called geopick (again, use any name you like) and assigned its ownership to the previously created 'geopick' user.

##### 2.2 Update the database connection in the .env file

Look for an entry called 'SQLALCHEMY_DATABASE_URI' in your .env file. This key contains the connection details for the postgresql database. The string has the following structure:

> 'postgres://geopick_username:geopick_password@database_address:database_port/database_name'

Assuming that we take the values from the example, and PostgreSQL is running on localhost at the usual port (5432), our string would look like this:

> 'postgres://geopick:mypassword@localhost:5432/geopick'

#### 3 Set up the server API
Requirements: Python version 3.11

You can configure some API parameters by setting an *.env* file at the GeoPick's root directory. You can see an example of it in this repo's *.env_example*

##### 3.1 Create python virtual environment

From the root project folder, run:

> python -m venv venv

This will create a folder named venv containing an empty python virtual environment folder.

##### 3.2 Activate virtual environment and install dependencies

To activate the virtual environment, do

> source venv/bin/activate  
> pip install -r requirements.txt

##### 3.3 Perform initial database setup

The database we created in step 2 is completely empty. We need to create the basic tables, to do this, activate the virtual environment from the root folder of the project:

> source venv/bin/activate  

Then go to the flask_api folder:

> cd flask_api

And run the command:

> flask db upgrade

This will apply migrations and create the necessary tables. Lastly, we need to create the admin user. To do this, execute the command:

> flask create_superuser

This will create a user in the database using as username the key USERNAME and the key PASSWORD present in your .env file.

##### 3.4 Start up development API server

From the root directory, and with the recently created virtual environment active, do

> cd flask_api  
> flask run

#### 4 Set up the client
Requirements: node v16.16.0

You can change the port by modifying the *webpack.dev.js* file before executing the command *npm run start*. The default port is set at 8085.

> cd GeoPick  
> npm install  
> npm run start  

Once done, you can access the application at `http://localhost:8085`, or at the web server address where you deployed the application.

<hr>

### VERSIONS
#### Version 2.0.0
- Added new compulsory Darwin Core field _locality_.  
- Added new automatically assigned Darwin Core field _locationID_.  
- Replaced the _toastr_ javascript library for notifications for the _jquery-confirm JQuery plugin_.  
- Added new button _Validate_ for validation of georeferences before sharing or exporting.  
- Added georeference sharing functionality.  
- Added PostgreSQL back-end database, which can store georeferences in GeoJSON format for sharing via the applications API.  
- Added fields _locationID_ and _locality_ to the exported Darwin Core format.  

#### Version 1.1.1
- Restored progress wheel.  

#### Version 1.1.0
- API converted to Python, performance improved.  
  
#### Version 1.0.4
- Corrected misplacement of warning message box when copying data if the WKT text is too large.
- Changed github address in about.html.
  
#### Version 1.0.3
- Documented new shortcuts in Help.
- Solved regression misplacing WKT and Delete dialog boxes.

#### Version 1.0.2
- Changed language in html file form 'es' to 'en' to prevent browsers from prompting to translate from spanish.
- Search box now keeps the latest search and this can be copied to the clipboard.
  
#### Version 1.0.1
> Bing Maps layers
  
#### Version 1.0.0
First released version
> Point-radius and shape georeferencing methods  
> On-screen digitizing and editing of points, lines and polygons  
> Search and capture geometries from Nominatim (OpenStreetMap Data API)  
> Calculation of smallest enclosing circle (uncertainty) and corrected center  
> Well-Known Text import  
> Data export in Darwin Core format via clipboard  
> Screen responsiveness to different resolutions  

