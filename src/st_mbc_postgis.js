function euclideanDistance(point1, point2) {
  const dx = point1[0] - point2[0];
  const dy = point1[1] - point2[1];
  return Math.sqrt(dx * dx + dy * dy);
}

function minimumBoundingCircle(points) {
  if (points.length === 0) {
    return null;
  } else if (points.length === 1) {
    return {
      center: points[0],
      radius: 0
    };
  } else if (points.length === 2) {
    const center = [(points[0][0] + points[1][0]) / 2, (points[0][1] + points[1][1]) / 2];
    const radius = euclideanDistance(points[0], center);
    return {
      center,
      radius
    };
  }

  // Find the convex hull using the Jarvis's algorithm
  const hull = [];
  let leftmost = points[0];
  for (let i = 1; i < points.length; i++) {
    if (points[i][0] < leftmost[0] || (points[i][0] === leftmost[0] && points[i][1] < leftmost[1])) {
      leftmost = points[i];
    }
  }

  let current = leftmost;
  let endpoint;
  do {
    hull.push(current);
    endpoint = points[0];
    for (let i = 1; i < points.length; i++) {
      if (endpoint === current || ccw(current, endpoint, points[i]) === -1) {
        endpoint = points[i];
      }
    }
    current = endpoint;
  } while (current !== leftmost);

  // Find the diameter of the convex hull
  let maxDistance = 0;
  let maxPoint1;
  let maxPoint2;
  for (let i = 0; i < hull.length - 1; i++) {
    for (let j = i + 1; j < hull.length; j++) {
      const distance = euclideanDistance(hull[i], hull[j]);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxPoint1 = hull[i];
        maxPoint2 = hull[j];
      }
    }
  }

  // Calculate the center and radius of the minimum bounding circle
  const center = [(maxPoint1[0] + maxPoint2[0]) / 2, (maxPoint1[1] + maxPoint2[1]) / 2];
  const radius = maxDistance / 2;

  return {
    center,
    radius
  };
}

function ccw(point1, point2, point3) {
  const dx1 = point2[0] - point1[0];
  const dy1 = point2[1] - point1[1];
  const dx2 = point3[0] - point1[0];
  const dy2 = point3[1] - point1[1];
  const crossProduct = dx1 * dy2 - dy1 * dx2;
  if (crossProduct > 0) {
    return 1; // Counter-clockwise orientation
  } else if (crossProduct < 0) {
    return -1; // Clockwise orientation
  } else {
    return 0; // Collinear points
  }
}

// Usage example
const points = [[2, 42], [4, 50], [7, 35]];
const boundingCircle = minimumBoundingCircle(points);
console.log(boundingCircle);