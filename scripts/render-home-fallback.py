"""Render the bundled GFS snapshot as a static, north-up globe without WebGL."""

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1] / "assets" / "globe"
METADATA = json.loads((ROOT / "wind-500.json").read_text())
PLACES = json.loads((ROOT / "places.json").read_text())
WIND = np.frombuffer((ROOT / METADATA["binaryFile"]).read_bytes(), dtype="<f4").reshape(181, 360, 2)
PALETTE = np.array([[37, 99, 166], [41, 167, 192], [111, 204, 174], [220, 219, 142], [229, 145, 120]], dtype=float)
RADIUS = METADATA["grid"]["radius"]
SIZE = 1000
SCREEN_RADIUS = 442
LONGITUDE = np.deg2rad(np.arange(360))[None, :]
LATITUDE = np.deg2rad(90 - np.arange(181))[:, None]
VECTORS = np.empty((181, 360, 3))
VECTORS[:, :, 0] = -WIND[:, :, 0] * np.sin(LONGITUDE) - WIND[:, :, 1] * np.sin(LATITUDE) * np.cos(LONGITUDE)
VECTORS[:, :, 1] = WIND[:, :, 1] * np.cos(LATITUDE)
VECTORS[:, :, 2] = -WIND[:, :, 0] * np.cos(LONGITUDE) + WIND[:, :, 1] * np.sin(LATITUDE) * np.sin(LONGITUDE)


def normalize(vectors):
    return vectors / np.linalg.norm(vectors, axis=-1, keepdims=True)


def sample(positions):
    longitude = np.rad2deg(np.arctan2(-positions[:, 2], positions[:, 0])) % 360
    latitude = np.rad2deg(np.arcsin(np.clip(positions[:, 1], -1, 1)))
    x0 = np.floor(longitude).astype(int)
    x1 = (x0 + 1) % 360
    y = 90 - latitude
    y0 = np.minimum(np.floor(y).astype(int), 179)
    fx = longitude - x0
    fy = y - y0
    # The bundled data has documented terrain gaps filled before spatial sampling.
    result = VECTORS[y0, x0] * ((1 - fx) * (1 - fy))[:, None]
    result += VECTORS[y0, x1] * (fx * (1 - fy))[:, None]
    result += VECTORS[y0 + 1, x0] * ((1 - fx) * fy)[:, None]
    result += VECTORS[y0 + 1, x1] * (fx * fy)[:, None]
    result -= np.sum(result * positions, axis=1)[:, None] * positions
    return result


def main():
    view_lon = np.deg2rad(PLACES["view"]["longitude"])
    view_lat = np.deg2rad(PLACES["view"]["latitude"])
    view = np.array([np.cos(view_lat) * np.cos(view_lon), np.sin(view_lat), -np.cos(view_lat) * np.sin(view_lon)])
    right = np.array([-np.sin(view_lon), 0, -np.cos(view_lon)])
    north = np.cross(view, right)
    rows, columns = np.mgrid[0:SIZE, 0:SIZE]
    screen_x = (columns - SIZE / 2) / SCREEN_RADIUS
    screen_y = (SIZE / 2 - rows) / SCREEN_RADIUS
    radial_squared = screen_x ** 2 + screen_y ** 2
    inside = radial_squared <= 1
    front = np.sqrt(np.clip(1 - radial_squared, 0, 1))
    positions = screen_x[:, :, None] * right + screen_y[:, :, None] * north + front[:, :, None] * view
    surface = positions[inside]
    longitude = np.arctan2(-surface[:, 2], surface[:, 0])
    latitude = np.arcsin(surface[:, 1])
    texture = np.asarray(Image.open(ROOT / "earth-day.jpg").convert("RGB"))
    texture_x = ((longitude + np.pi) / (2 * np.pi) * texture.shape[1]).astype(int) % texture.shape[1]
    texture_y = np.clip(((np.pi / 2 - latitude) / np.pi * texture.shape[0]).astype(int), 0, texture.shape[0] - 1)
    sunlight = normalize(view * 4 - right * 2 + north * 3)
    illumination = 0.45 + 0.55 * np.clip(surface @ sunlight, 0, 1)
    colors = texture[texture_y, texture_x].astype(float) * illumination[:, None] * np.array([0.75, 0.83, 0.94])
    velocity = sample(surface)
    valid = np.isfinite(velocity).all(axis=1)
    fraction = np.clip(np.linalg.norm(velocity[valid], axis=1) / METADATA["speedRange"][1], 0, 1) * 4
    lower = np.minimum(np.floor(fraction).astype(int), 3)
    weight = fraction - lower
    overlay = PALETTE[lower] * (1 - weight[:, None]) + PALETTE[lower + 1] * weight[:, None]
    colors[valid] = colors[valid] * 0.60 + overlay * 0.40
    pixels = np.zeros((SIZE, SIZE, 4), dtype=np.uint8)
    pixels[inside, :3] = np.clip(colors, 0, 255).astype(np.uint8)
    pixels[inside, 3] = 255
    image = Image.fromarray(pixels)
    strokes = Image.new("RGBA", (SIZE, SIZE))
    draw = ImageDraw.Draw(strokes)
    random = np.random.default_rng(20261020)
    longitude = random.uniform(-np.pi, np.pi, 7200)
    latitude = np.arcsin(random.uniform(-1, 1, 7200))
    particles = np.column_stack((np.cos(latitude) * np.cos(longitude), np.sin(latitude), -np.cos(latitude) * np.sin(longitude)))
    particles = particles[np.isfinite(sample(particles)).all(axis=1)]
    for segment in range(56):
        velocity = sample(particles)
        midpoint = normalize(particles + velocity * (400 / (2 * RADIUS)))
        finite = np.isfinite(midpoint).all(axis=1)
        particles = particles[finite]
        midpoint = midpoint[finite]
        next_positions = normalize(particles + sample(midpoint) * (400 / RADIUS))
        finite = np.isfinite(next_positions).all(axis=1)
        particles = particles[finite]
        next_positions = next_positions[finite]
        valid = np.isfinite(sample(next_positions)).all(axis=1)
        particles = particles[valid]
        next_positions = next_positions[valid]
        front_side = (particles @ view > 0.02) & (next_positions @ view > 0.02)
        for start, end in zip(particles[front_side], next_positions[front_side]):
            start_xy = (SIZE / 2 + float(start @ right) * SCREEN_RADIUS, SIZE / 2 - float(start @ north) * SCREEN_RADIUS)
            end_xy = (SIZE / 2 + float(end @ right) * SCREEN_RADIUS, SIZE / 2 - float(end @ north) * SCREEN_RADIUS)
            alpha = round((segment + 1) / 56 * 175)
            draw.line((start_xy, end_xy), fill=(207, 240, 255, alpha), width=1)
        particles = next_positions
    image = Image.alpha_composite(image, strokes)
    draw = ImageDraw.Draw(image)
    for city in PLACES["cities"]:
        longitude = np.deg2rad(city["longitude"])
        latitude = np.deg2rad(city["latitude"])
        point = np.array([np.cos(latitude) * np.cos(longitude), np.sin(latitude), -np.cos(latitude) * np.sin(longitude)])
        if point @ view <= 0:
            continue
        x = SIZE / 2 + float(point @ right) * SCREEN_RADIUS
        y = SIZE / 2 - float(point @ north) * SCREEN_RADIUS
        color = (244, 214, 154)
        if city["name"] == "Seattle":
            color = (188, 230, 255)
        draw.ellipse((x - 9, y - 9, x + 9, y + 9), outline=color, width=2)
        draw.ellipse((x - 4, y - 4, x + 4, y + 4), fill=color)
    image.save(ROOT / "earth-wind-static.png", optimize=True)
    print("Static globe saved from", METADATA["validTime"])


if __name__ == "__main__":
    main()
