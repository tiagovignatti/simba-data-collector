# SIMBA Data Collector

A tool to collect wildlife occurrence data from Petrobras' SIMBA system for any Brazilian municipality.

## Usage

Basic usage (defaults to Penha, SC from 2025-01-01):
```bash
python simba_collector.py
```

Custom parameters:
```bash
python simba_collector.py --municipality "São Paulo" --start-date 2024-01-01
```

Get help:
```bash
python simba_collector.py --help
```

## Output

Data is saved as `simba_{municipality}_{end_date}_to_{start_date}.json`

Example: `simba_Florianópolis_2025-02-25_to_2024-01-01.json`

## Data Structure

Each record includes species information, location coordinates, event details, measurements, and associated media links.

## License

MIT License. Copyright (c) 2025 Tiago Vignatti.