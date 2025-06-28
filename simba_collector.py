import requests
import json
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Dict, List, Optional

class SimbaCollector:
    def __init__(self):
        self.base_url = "https://simba.petrobras.com.br/simba/web/api/v1/occurrences/public"
        
    def parse_xml_to_dict(self, xml_content: str) -> List[Dict]:
        """Parse XML response to list of dictionaries"""
        try:
            root = ET.fromstring(xml_content)
            records = []
            
            for record in root.findall('.//{http://rs.tdwg.org/dwc/xsd/simpledarwincore/}SimpleDarwinRecord'):
                record_dict = {}
                for child in record:
                    tag_name = child.tag.split('}')[-1] if '}' in child.tag else child.tag
                    record_dict[tag_name] = child.text if child.text else ""
                records.append(record_dict)
            
            return records
        except ET.ParseError as e:
            print(f"Error parsing XML: {e}")
            return []

    def collect_occurrences(self, municipality: str = "Penha", start_date: str = "2025-01-01") -> Optional[Dict]:
        """
        Collect occurrences from SIMBA API with filters
        
        Args:
            municipality: Municipality name to filter by
            start_date: Start date in YYYY-MM-DD format
            
        Returns:
            Parsed data or None if error
        """
        try:
            params = {
                "municipality": municipality,
                "start_date": start_date
            }
            
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            
            records = self.parse_xml_to_dict(response.text)
            
            data = {
                "filters": {
                    "municipality": municipality,
                    "start_date": start_date
                },
                "count": len(records),
                "records": records
            }
            
            print(f"Successfully collected {len(records)} occurrences")
            print(f"Municipality: {municipality}")
            print(f"Start date: {start_date}")
            
            return data
            
        except requests.exceptions.RequestException as e:
            print(f"Error making API request: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None
    
    def save_data(self, data: Dict, filename: str = None) -> bool:
        """
        Save collected data to JSON file
        
        Args:
            data: Data to save
            filename: Optional filename, defaults to date range based name
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if filename is None:
                municipality = data.get("filters", {}).get("municipality", "unknown")
                start_date = data.get("filters", {}).get("start_date", "unknown")
                
                # Get latest event date from records for end date
                end_date = start_date
                if data.get("records"):
                    event_dates = [record.get("eventDate", "") for record in data["records"] if record.get("eventDate")]
                    if event_dates:
                        # Extract date part from ISO datetime string
                        dates = [date.split("T")[0] for date in event_dates if "T" in date]
                        if dates:
                            end_date = max(dates)
                
                filename = f"simba_{municipality}_{end_date}_to_{start_date}.json"
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"Data saved to {filename}")
            return True
            
        except Exception as e:
            print(f"Error saving data: {e}")
            return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Collect wildlife occurrence data from SIMBA system")
    parser.add_argument("--start-date", default="2025-01-01", 
                       help="Start date in YYYY-MM-DD format (default: 2025-01-01)")
    parser.add_argument("--municipality", default="Penha",
                       help="Municipality to filter by (default: Penha)")
    
    args = parser.parse_args()
    
    collector = SimbaCollector()
    
    data = collector.collect_occurrences(municipality=args.municipality, start_date=args.start_date)
    
    if data:
        collector.save_data(data)
    else:
        print("Failed to collect data")