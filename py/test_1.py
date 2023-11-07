# ==========================================================================
import geopick as gp
import matplotlib.pyplot as plt

json_location = '{"type": "Feature", "properties": {}, "geometry": {"type": "Polygon", "coordinates": [[[4.298967, 39.831525], [4.302463, 39.831981], [4.301806, 39.832417], [4.30117, 39.832516], [4.300434, 39.832888], [4.300219, 39.833024], [4.299835, 39.833137], [4.29955, 39.83298], [4.29952, 39.832675], [4.299406, 39.832212], [4.298967, 39.831525]]]}}'

json_location = '{"type": "Feature", "properties": {}, "geometry": {"type": "Polygon", "coordinates": [[[6.2568, 75.1633], [22.8780, 72.9454], [2.6511, 69.8699], [6.2568, 75.1633]]]}}'

json_location = json_location.replace("'", "\"")
location_wgs84 = gp.json_to_geoseries(json_location)
centroid_wgs84 = location_wgs84.centroid
res = gp.get_georeference(location_wgs84)
fig, ax = plt.subplots(figsize=(8, 8))
location_wgs84.plot(aspect = "equal", color = "blue", ax = ax)
centroid_wgs84.plot(aspect = "equal", color = "red", ax = ax)

res = gp.get_georeference(location_wgs84)
# centroid = res[0]
# uncertainty = res[1]
# sec = res[2]

# fig, ax = plt.subplots(figsize=(8, 8))
# sec.plot(aspect = "equal", color = "blue", ax = ax)
# location_wgs84.plot(aspect = "equal", color = "red", ax = ax)
# centroid.plot(aspect = "equal", color = "blue", markersize = 20, ax = ax)

# print("Centroid:", centroid)
# print("Uncertainty:", uncertainty)



res = gp.get_georeference(location_wgs84)
fig, ax = plt.subplots(figsize=(8, 8))
res[0].plot(aspect = "equal", color = "blue", ax = ax)
res[1].plot(aspect = "equal", color = "red", ax = ax)

