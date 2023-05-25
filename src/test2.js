// Calculate the Euclidean distance between two points
function calculateDistance(point1, point2) {
  const dx = point1[0] - point2[0];
  const dy = point1[1] - point2[1];
  return Math.sqrt(dx * dx + dy * dy);
}

// Check if a point is inside the circle
function isPointInsideCircle(circle, point) {
  const distance = calculateDistance(circle.center, point);
  return distance <= circle.radius;
}

// Calculate the minimum bounding circle using Welzl's algorithm
function minimumBoundingCircle(points) {
  // Base cases
  if (points.length === 0) {
    return { center: [0, 0], radius: 0 };
  } else if (points.length === 1) {
    return { center: points[0], radius: 0 };
  } else if (points.length === 2) {
    const center = [(points[0][0] + points[1][0]) / 2, (points[0][1] + points[1][1]) / 2];
    const radius = calculateDistance(points[0], center);
    return { center, radius };
  }

  // Randomly select a point
  const randomIndex = Math.floor(Math.random() * points.length);
  const randomPoint = points[randomIndex];

  // Remove the selected point
  const remainingPoints = points.filter((_, index) => index !== randomIndex);

  // Recursively calculate the minimum bounding circle
  const circle = minimumBoundingCircle(remainingPoints);

  // Check if the selected point is already inside the circle
  if (isPointInsideCircle(circle, randomPoint)) {
    return circle;
  }

  // Calculate the minimum bounding circle with the selected point on the boundary
  let newCircle = { center: randomPoint, radius: 0 };
  for (let i = 0; i < remainingPoints.length; i++) {
    const currentPoint = remainingPoints[i];
    if (!isPointInsideCircle(newCircle, currentPoint)) {
      if (newCircle.radius === 0) {
        newCircle = calculateCircleTwoPoints(randomPoint, currentPoint);
      } else {
        newCircle = calculateCircleThreePoints(randomPoint, currentPoint, circle.center);
      }
    }
  }

  return newCircle;
}

// Calculate the minimum bounding circle for a set of points
const points = [[2, 42], [4, 50], [7, 35], [10, 15], [20, 10]];
const boundingCircle = minimumBoundingCircle(points);

console.log(boundingCircle);
