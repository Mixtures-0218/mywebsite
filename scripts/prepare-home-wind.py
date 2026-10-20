"""Download one NOAA GFS analysis and preserve its 500 hPa wind snapshot.

Run with the persistent environment described in assets/globe/README.md.
Only three GRIB messages are downloaded; invalid or mismatched fields stop the run.
"""

import argparse
import hashlib
import json
from pathlib import Path
from urllib.request import Request, urlopen

import eccodes
import numpy as np


def download(url, headers=None):
    request = Request(url, headers=headers or {})
    with urlopen(request, timeout=90) as response:
        content = response.read()
        if headers and response.status != 206:
            raise ValueError("NOAA did not honor the GRIB byte-range request")
        return content


def interpolate_terrain(wind, below_terrain, width):
    """Fill isolated terrain gaps at the centre of four valid diagonal corners.

    Bilinear weights at the rectangle centre are exactly 1/4 for each corner.
    Source: https://sites.ecmwf.int/docs/atlas/design/interpolation/
    """
    grid = wind.reshape(-1, width, 2)
    source = grid.copy()
    records = []
    for row, column in np.argwhere(below_terrain.reshape(-1, width)):
        if row == 0 or row == grid.shape[0] - 1:
            raise ValueError("Cannot fill a polar terrain gap with four surrounding corners")
        left = (column - 1) % width
        right = (column + 1) % width
        northwest = source[row - 1, left]
        northeast = source[row - 1, right]
        southwest = source[row + 1, left]
        southeast = source[row + 1, right]
        for corner in [northwest, northeast, southwest, southeast]:
            if not np.isfinite(corner).all():
                raise ValueError("Terrain gap does not have four valid surrounding corners")
        grid[row, column] = (northwest + northeast + southwest + southeast) / 4
        records.append({"longitude": int(column), "latitude": int(90 - row), "u": float(grid[row, column, 0]), "v": float(grid[row, column, 1]), "method": "Bilinear interpolation at centre of four valid diagonal neighbours"})
    return records


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("date", help="GFS date, YYYYMMDD")
    parser.add_argument("cycle", choices=["00", "06", "12", "18"])
    arguments = parser.parse_args()
    base = "https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod"
    filename = "gfs.t" + arguments.cycle + "z.pgrb2.1p00.f000"
    url = base + "/gfs." + arguments.date + "/" + arguments.cycle + "/atmos/" + filename
    inventory = download(url + ".idx").decode().splitlines()
    fields = {}
    source_records = []
    field_definitions = {"u": ":UGRD:500 mb:", "v": ":VGRD:500 mb:", "pressure": ":PRES:surface:"}
    grid = None

    for name, marker in field_definitions.items():
        matches = []
        for index, line in enumerate(inventory):
            if marker in line:
                matches.append(index)
        if len(matches) != 1:
            raise ValueError("Expected one GRIB message for " + name)
        index = matches[0]
        offset = int(inventory[index].split(":")[1])
        next_offset = int(inventory[index + 1].split(":")[1])
        content = download(url, {"Range": "bytes=" + str(offset) + "-" + str(next_offset - 1)})
        message = eccodes.codes_new_from_message(content)
        current_grid = {}
        for key in ["Ni", "Nj", "latitudeOfFirstGridPointInDegrees", "longitudeOfFirstGridPointInDegrees", "latitudeOfLastGridPointInDegrees", "longitudeOfLastGridPointInDegrees", "iDirectionIncrementInDegrees", "jDirectionIncrementInDegrees", "iScansNegatively", "jScansPositively", "radius", "dataDate", "dataTime", "validityDate", "validityTime"]:
            current_grid[key] = eccodes.codes_get(message, key)
        if grid is None:
            grid = current_grid
        elif grid != current_grid:
            raise ValueError("GRIB fields have different grids or valid times")
        if str(current_grid["dataDate"]) != arguments.date or current_grid["dataTime"] != int(arguments.cycle) * 100:
            raise ValueError("GRIB cycle does not match the requested snapshot")
        if eccodes.codes_get(message, "numberOfMissing") != 0:
            raise ValueError("Source GRIB contains missing values: " + name)
        values = eccodes.codes_get_values(message)
        if not np.isfinite(values).all():
            raise ValueError("Source GRIB contains non-finite values: " + name)
        fields[name] = values
        source_records.append({"field": name, "inventoryRecord": inventory[index], "byteRange": [offset, next_offset - 1], "sha256": hashlib.sha256(content).hexdigest(), "units": eccodes.codes_get(message, "units")})
        eccodes.codes_release(message)

    if grid["Ni"] != 360 or grid["Nj"] != 181 or grid["iScansNegatively"] != 0 or grid["jScansPositively"] != 0 or grid["longitudeOfFirstGridPointInDegrees"] != 0 or grid["latitudeOfFirstGridPointInDegrees"] != 90:
        raise ValueError("Expected a 360 x 181 north-to-south, west-to-east global grid")
    valid = fields["pressure"] >= 50000
    wind = np.empty((360 * 181, 2), dtype="<f4")
    wind[:, 0] = fields["u"]
    wind[:, 1] = fields["v"]
    wind[~valid] = np.nan
    interpolation_records = interpolate_terrain(wind, ~valid, 360)
    speed = np.hypot(wind[:, 0], wind[:, 1])
    output = Path(__file__).resolve().parents[1] / "assets" / "globe"
    output.mkdir(parents=True, exist_ok=True)
    binary = wind.tobytes()
    metadata = {
        "source": "NOAA / NCEP GFS",
        "sourceUrl": url,
        "inventoryUrl": url + ".idx",
        "cycle": arguments.date[:4] + "-" + arguments.date[4:6] + "-" + arguments.date[6:] + "T" + arguments.cycle + ":00:00Z",
        "validTime": arguments.date[:4] + "-" + arguments.date[4:6] + "-" + arguments.date[6:] + "T" + arguments.cycle + ":00:00Z",
        "forecastHour": 0,
        "pressureLevelHpa": 500,
        "units": "m/s",
        "grid": grid,
        "binaryFile": "wind-500.bin",
        "binaryFormat": "Interleaved little-endian float32 u,v; high-terrain gaps filled by bilinear interpolation",
        "sha256": hashlib.sha256(binary).hexdigest(),
        "terrainHandling": "Source cells with surface pressure < 50000 Pa are filled by bilinear interpolation from four valid surrounding corners",
        "sourceValidGridPoints": int(valid.sum()),
        "validGridPoints": int(wind.shape[0]),
        "maskedGridPoints": 0,
        "interpolatedGridPoints": len(interpolation_records),
        "interpolationRecords": interpolation_records,
        "speedRange": [float(speed.min()), float(speed.max())],
        "processing": "ecCodes " + eccodes.codes_get_api_version() + "; original wind precision preserved as float32 outside documented interpolated terrain cells",
        "records": source_records,
    }
    (output / "wind-500.bin").write_bytes(binary)
    (output / "wind-500.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(json.dumps({"validTime": metadata["validTime"], "valid": metadata["validGridPoints"], "masked": metadata["maskedGridPoints"], "speedRange": metadata["speedRange"]}))


if __name__ == "__main__":
    main()
