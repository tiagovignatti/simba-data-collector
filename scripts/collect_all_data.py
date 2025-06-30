#!/usr/bin/env python3
"""
Comprehensive data collection script for Penha city years (2021-2025)
This script collects wildlife rescue data for Penha
for each year from 2021 to 2025.
"""

import os
import time
from simba_collector import SimbaCollector

def collect_all_data():
    """Collect data for all cities and years"""
    
    # Cities to collect data for
    cities = [
        "Penha"
    ]
    
    # Years to collect (2021-2025)
    years = ["2021", "2022", "2023", "2024", "2025"]
    
    collector = SimbaCollector()
    
    print("🌊 Starting marine wildlife data collection for Penha...")
    print(f"📍 City: {', '.join(cities)}")
    print(f"📅 Years: {', '.join(years)}")
    print("-" * 60)
    
    successful_collections = 0
    total_collections = len(cities) * len(years)
    
    for city in cities:
        print(f"\n🏙️  Collecting data for {city}...")
        
        for year in years:
            start_date = f"{year}-01-01"
            
            print(f"  📅 {year}: ", end="", flush=True)
            
            try:
                data = collector.collect_occurrences(
                    municipality=city, 
                    start_date=start_date
                )
                
                if data and data.get('records'):
                    # Save with a custom filename for clarity
                    filename = f"simba_{city}_{year}.json"
                    
                    if collector.save_data(data, filename):
                        record_count = len(data['records'])
                        print(f"✅ {record_count} records")
                        successful_collections += 1
                    else:
                        print("❌ Failed to save")
                        
                elif data and data.get('count') == 0:
                    print("📭 No data available")
                    # Still save empty result for completeness
                    filename = f"simba_{city}_{year}.json"
                    collector.save_data(data, filename)
                    successful_collections += 1
                else:
                    print("❌ Failed to collect")
                    
            except Exception as e:
                print(f"❌ Error: {e}")
            
            # Add small delay to be respectful to the API
            time.sleep(1)
    
    print("\n" + "=" * 60)
    print(f"📊 Collection Summary:")
    print(f"   • Successful: {successful_collections}/{total_collections}")
    print(f"   • Data saved to: output/ directory")
    print("🏗️  Run 'npm run update-data && npm run build' to update the web viewer")

if __name__ == "__main__":
    collect_all_data()