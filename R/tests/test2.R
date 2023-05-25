# curl -d '{"type":"Feature","properties":{},"geometry":{"coordinates":[[[2.066351763792653,41.478874013464605],[19.01427928415839,47.48555396570916],[13.008748905727089,55.61087585505442],[-6.310105044089255,53.38326737159662],[2.066351763792653,41.478874013464605]]],"type":"Polygon"}}'
# -H "Content-Type: application/json" -X POST http://127.0.0.1:8000/mbc

var <- '{"type":"Feature","properties":{},"geometry":{"coordinates":[[[2.066351763792653,41.478874013464605],[19.01427928415839,47.48555396570916],[13.008748905727089,55.61087585505442],[-6.310105044089255,53.38326737159662],[2.066351763792653,41.478874013464605]]],"type":"Polygon"}}'
req <- httr::POST(url = "http://127.0.0.1:8000/mbc", 
                 body = var, encode = "json")

response <- httr::content(req)
response


df <- data.frame(
  name = c("Barcelona", "Dublin", "Malmö", "Budapest", "Barcelona"),
  lon = c(2.178, -6.251, 13.001, 19.049, 2.178),
  lat = c(41.397, 53.349, 55.614, 47.525, 41.397)
)
site <- df %>%
  st_as_sf(coords = c("lon", "lat"), crs = 4326) %>%
  summarise(geometry = st_combine(geometry)) %>%
  st_cast("POLYGON")

site.geojson <- sf_geojson(site)

req <- httr::POST(url = "http://127.0.0.1:8000/mbc", 
                  body = site.geojson, encode = "json")

response <- httr::content(req)
response

resp <- getMBC(site.geojson)
