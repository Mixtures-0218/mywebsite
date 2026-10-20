// GFS grid sampling and midpoint integration on a sphere, independent of rendering.
export function positionFromDegrees(longitude, latitude) {
    const radians = Math.PI / 180;
    const lon = longitude * radians;
    const lat = latitude * radians;
    return {
        x: Math.cos(lat) * Math.cos(lon),
        y: Math.sin(lat),
        z: -Math.cos(lat) * Math.sin(lon)
    };
}

function normalize(position) {
    const length = Math.hypot(position.x, position.y, position.z);
    return { x: position.x / length, y: position.y / length, z: position.z / length };
}

export class SphericalWind {
    constructor(metadata, buffer) {
        this.metadata = metadata;
        this.width = metadata.grid.Ni;
        this.height = metadata.grid.Nj;
        this.radius = metadata.grid.radius;
        if (buffer.byteLength !== this.width * this.height * 8) {
            throw new Error('Wind snapshot has an incorrect byte length.');
        }
        const bytes = new DataView(buffer);
        this.values = new Float32Array(this.width * this.height * 2);
        this.vectors = new Float32Array(this.width * this.height * 3);
        let validCount = 0;

        // Convert each grid wind into a Cartesian tangent vector before interpolation.
        // This avoids the longitude singularity of d(lon)/dt at the geographic poles.
        for (let row = 0; row < this.height; row += 1) {
            const latitude = (90 - row) * Math.PI / 180;
            for (let column = 0; column < this.width; column += 1) {
                const index = row * this.width + column;
                const longitude = column * Math.PI / 180;
                const u = bytes.getFloat32(index * 8, true);
                const v = bytes.getFloat32(index * 8 + 4, true);
                this.values[index * 2] = u;
                this.values[index * 2 + 1] = v;
                if (Number.isFinite(u) && Number.isFinite(v)) {
                    validCount += 1;
                } else if (!Number.isNaN(u) || !Number.isNaN(v)) {
                    throw new Error('Wind snapshot contains an invalid terrain mask.');
                }
                this.vectors[index * 3] = -u * Math.sin(longitude) - v * Math.sin(latitude) * Math.cos(longitude);
                this.vectors[index * 3 + 1] = v * Math.cos(latitude);
                this.vectors[index * 3 + 2] = -u * Math.cos(longitude) + v * Math.sin(latitude) * Math.sin(longitude);
            }
        }
        if (validCount !== metadata.validGridPoints) {
            throw new Error('Wind snapshot does not match its metadata.');
        }
    }

    sample(position) {
        const longitude = Math.atan2(-position.z, position.x) * 180 / Math.PI;
        const latitude = Math.asin(Math.max(-1, Math.min(1, position.y))) * 180 / Math.PI;
        const gridX = (longitude + 360) % 360;
        const gridY = 90 - latitude;
        const left = Math.floor(gridX);
        const right = (left + 1) % this.width;
        const top = Math.min(Math.floor(gridY), this.height - 2);
        const fractionX = gridX - left;
        const fractionY = gridY - top;
        const indices = [top * this.width + left, top * this.width + right, (top + 1) * this.width + left, (top + 1) * this.width + right];
        const weights = [(1 - fractionX) * (1 - fractionY), fractionX * (1 - fractionY), (1 - fractionX) * fractionY, fractionX * fractionY];
        const velocity = { x: 0, y: 0, z: 0 };

        for (let corner = 0; corner < 4; corner += 1) {
            const index = indices[corner];
            if (!Number.isFinite(this.values[index * 2])) {
                return null;
            }
            velocity.x += this.vectors[index * 3] * weights[corner];
            velocity.y += this.vectors[index * 3 + 1] * weights[corner];
            velocity.z += this.vectors[index * 3 + 2] * weights[corner];
        }
        const radial = velocity.x * position.x + velocity.y * position.y + velocity.z * position.z;
        velocity.x -= radial * position.x;
        velocity.y -= radial * position.y;
        velocity.z -= radial * position.z;
        velocity.speed = Math.hypot(velocity.x, velocity.y, velocity.z);
        return velocity;
    }

    advance(position, seconds) {
        const initialVelocity = this.sample(position);
        if (initialVelocity === null) {
            return null;
        }
        const halfStep = seconds / (2 * this.radius);
        const midpoint = normalize({
            x: position.x + initialVelocity.x * halfStep,
            y: position.y + initialVelocity.y * halfStep,
            z: position.z + initialVelocity.z * halfStep
        });
        const midpointVelocity = this.sample(midpoint);
        if (midpointVelocity === null) {
            return null;
        }
        const fullStep = seconds / this.radius;
        const next = normalize({
            x: position.x + midpointVelocity.x * fullStep,
            y: position.y + midpointVelocity.y * fullStep,
            z: position.z + midpointVelocity.z * fullStep
        });
        if (this.sample(next) === null) {
            return null;
        }
        return next;
    }
}

// Display palette only. Its numerical range comes from the snapshot, not thresholds.
export const WIND_COLORS = [[37, 99, 166], [41, 167, 192], [111, 204, 174], [220, 219, 142], [229, 145, 120]];

export function windColor(speed, maximum) {
    const fraction = Math.max(0, Math.min(1, speed / maximum)) * (WIND_COLORS.length - 1);
    const lower = Math.min(Math.floor(fraction), WIND_COLORS.length - 2);
    const weight = fraction - lower;
    const result = [];
    for (let channel = 0; channel < 3; channel += 1) {
        result.push(Math.round(WIND_COLORS[lower][channel] * (1 - weight) + WIND_COLORS[lower + 1][channel] * weight));
    }
    return result;
}
