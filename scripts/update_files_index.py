#!/usr/bin/env python3
"""
Script to update the files-index.json with available JSON data files.
This should be run whenever new data files are added to the output/ directory.
"""

import json
import os
import glob
from datetime import datetime

def update_files_index():
    """Update the files-index.json in docs/ directory with available JSON files."""
    
    # Get the project root directory
    script_dir = os.path.dirname(__file__)
    project_root = os.path.dirname(script_dir)
    
    # Directories
    output_dir = os.path.join(project_root, "output")
    data_dir = os.path.join(project_root, "data")
    docs_dir = os.path.join(project_root, "docs")
    
    # Ensure data directory exists
    os.makedirs(data_dir, exist_ok=True)
    
    # Find all JSON files in output and data directories  
    output_pattern = os.path.join(output_dir, "*.json")
    output_files = glob.glob(output_pattern)
    
    data_pattern = os.path.join(data_dir, "*.json")
    data_files = glob.glob(data_pattern)
    
    # Move output files to data first, then use data as the single source
    if output_files:
        print("Moving output files to data directory first...")
        import shutil
        for json_file in output_files:
            filename = os.path.basename(json_file)
            dest_path = os.path.join(data_dir, filename)
            shutil.move(json_file, dest_path)
            print(f"  Moved: {filename}")
        
        # Refresh data files list after moving
        data_files = glob.glob(data_pattern)
    
    # Use only data directory as source of truth
    filenames = [os.path.basename(f) for f in data_files]
    filenames.sort()  # Sort alphabetically
    
    # Create the index data
    index_data = {
        "files": filenames,
        "lastUpdated": datetime.now().isoformat(),
        "count": len(filenames)
    }
    
    # Write to docs directory
    index_file = os.path.join(docs_dir, "files-index.json")
    
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, indent=2, ensure_ascii=False)
    
    print(f"Updated files index with {len(filenames)} files:")
    for filename in filenames:
        print(f"  - {filename}")
    
    # Copy from data directory to docs directory for the web viewer
    print("\nCopying files from data/ to docs/ directory...")
    import shutil
    
    for json_file in data_files:
        filename = os.path.basename(json_file)
        dest_path = os.path.join(docs_dir, filename)
        shutil.copy2(json_file, dest_path)
        print(f"  Copied from data/: {filename}")
    
    print(f"\nFiles index updated: {index_file}")

if __name__ == "__main__":
    update_files_index()