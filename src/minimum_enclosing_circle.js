const turf = require('@turf/turf');

/*
 * Smallest enclosing circle - Library (compiled from TypeScript)
 *
 * Copyright (c) 2022 Project Nayuki
 * https://www.nayuki.io/page/smallest-enclosing-circle
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program (see COPYING.txt and COPYING.LESSER.txt).
 * If not, see <http://www.gnu.org/licenses/>.
 */
"use strict";
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class Circle {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
    }
}
/*
 * Returns the smallest circle that encloses all the given points. Runs in expected O(n) time, randomized.
 * Note: If 0 points are given, null is returned. If 1 point is given, a circle of radius 0 is returned.
 */
// Initially: No boundary points known
const makeCircle = function(points) {
    // Clone list to preserve the caller's data, do Durstenfeld shuffle
    let shuffled = points.slice();    
    for (let i = points.length - 1; i >= 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        j = Math.max(Math.min(j, i), 0);
        const temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    // Progressively add points to circle or recompute circle
    let c = null;
    shuffled.forEach((p, i) => {
        if (c === null || !isInCircle(c, p))
            c = makeCircleOnePoint(shuffled.slice(0, i + 1), p);
    });
    return c;
}
// One boundary point known
const makeCircleOnePoint = function(points, p) {
    let c = new Circle(p.x, p.y, 0);
    points.forEach((q, i) => {
        if (!isInCircle(c, q)) {
            if (c.r == 0)
                c = makeDiameter(p, q);
            else
                c = makeCircleTwoPoints(points.slice(0, i + 1), p, q);
        }
    });
    return c;
}
// Two boundary points known
const makeCircleTwoPoints = function(points, p, q) {
    const circ = makeDiameter(p, q);
    let left = null;
    let right = null;
    // For each point not in the two-point circle
    for (const r of points) {
        if (isInCircle(circ, r))
            continue;
        // Form a circumcircle and classify it on left or right side
        const cross = crossProduct(p.x, p.y, q.x, q.y, r.x, r.y);
        const c = makeCircumcircle(p, q, r);
        if (c === null)
            continue;
        else if (cross > 0 && (left === null || crossProduct(p.x, p.y, q.x, q.y, c.x, c.y) > crossProduct(p.x, p.y, q.x, q.y, left.x, left.y)))
            left = c;
        else if (cross < 0 && (right === null || crossProduct(p.x, p.y, q.x, q.y, c.x, c.y) < crossProduct(p.x, p.y, q.x, q.y, right.x, right.y)))
            right = c;
    }
    // Select which circle to return
    if (left === null && right === null)
        return circ;
    else if (left === null && right !== null)
        return right;
    else if (left !== null && right === null)
        return left;
    else if (left !== null && right !== null)
        return left.r <= right.r ? left : right;
    else
        throw new Error("Assertion error");
}
const makeDiameter = function(a, b) {
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    const r0 = distance(cx, cy, a.x, a.y);
    const r1 = distance(cx, cy, b.x, b.y);
    return new Circle(cx, cy, Math.max(r0, r1));
}
const makeCircumcircle = function (a, b, c) {
    // Mathematical algorithm from Wikipedia: Circumscribed circle
    const ox = (Math.min(a.x, b.x, c.x) + Math.max(a.x, b.x, c.x)) / 2;
    const oy = (Math.min(a.y, b.y, c.y) + Math.max(a.y, b.y, c.y)) / 2;
    const ax = a.x - ox;
    const ay = a.y - oy;
    const bx = b.x - ox;
    const by = b.y - oy;
    const cx = c.x - ox;
    const cy = c.y - oy;
    const d = (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by)) * 2;
    if (d == 0)
        return null;
    const x = ox + ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
    const y = oy + ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
    const ra = distance(x, y, a.x, a.y);
    const rb = distance(x, y, b.x, b.y);
    const rc = distance(x, y, c.x, c.y);
    return new Circle(x, y, Math.max(ra, rb, rc));
}
/* Simple mathematical functions */
const MULTIPLICATIVE_EPSILON = 1 + 1e-14;
const isInCircle = function (c, p) {
    return c !== null && distance(p.x, p.y, c.x, c.y) <= c.r * MULTIPLICATIVE_EPSILON;
    // return c !== null && distance(p.x, p.y, c.x, c.y) <= c.r;
    /*const circle = turf.circle( turf.toWgs84(turf.point([ c.x, c.y ])), c.r/1000, { units: 'kilometers'} );
    const point = turf.toWgs84(turf.point([ p.x, p.y ]));
    return c !== null && turf.booleanContains(circle, point);*/
}
// Returns twice the signed area of the triangle defined by (x0, y0), (x1, y1), (x2, y2).
const crossProduct = function (x0, y0, x1, y1, x2, y2) {
    return (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0);
}

const distance = function (x0, y0, x1, y1) {
    const p1 = turf.toWgs84(turf.point([ x0, y0 ]));
    const p2 = turf.toWgs84(turf.point([ x1, y1 ]));
    const dist = turf.distance( p1, p2, { units: 'kilometers' } );
    const haver = dist*1000;    
    return haver;
    //return Math.hypot( x1-x0, y1-y0 );
}

module.exports = {
    makeCircle: makeCircle,
    Point: Point,
    Circle: Circle,
}