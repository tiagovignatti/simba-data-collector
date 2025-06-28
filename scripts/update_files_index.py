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
    """Update the files-index.json in public/ directory with available JSON files."""
    
    # Get the project root directory
    script_dir = os.path.dirname(__file__)
    project_root = os.path.dirname(script_dir)
    
    # Directories
    output_dir = os.path.join(project_root, "output")
    public_dir = os.path.join(project_root, "public")
    
    # Find all JSON files in output directory
    output_pattern = os.path.join(output_dir, "*.json")
    output_files = glob.glob(output_pattern)
    
    # Also find JSON files already in public directory (excluding the index file)
    public_pattern = os.path.join(public_dir, "*.json")
    public_files = glob.glob(public_pattern)
    public_files = [f for f in public_files if not f.endswith('files-index.json')]
    
    # Combine and deduplicate filenames
    all_files = output_files + public_files
    filenames = list(set([os.path.basename(f) for f in all_files]))
    filenames.sort()  # Sort alphabetically
    
    # Create the index data
    index_data = {
        "files": filenames,
        "lastUpdated": datetime.now().isoformat(),
        "count": len(filenames)
    }
    
    # Write to public directory
    index_file = os.path.join(public_dir, "files-index.json")
    
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, indent=2, ensure_ascii=False)
    
    print(f"Updated files index with {len(filenames)} files:")
    for filename in filenames:
        print(f"  - {filename}")
    
    # Also copy the files to public directory for the web viewer
    print("\nCopying files to public directory...")
    for json_file in output_files:
        filename = os.path.basename(json_file)
        dest_path = os.path.join(public_dir, filename)
        
        # Copy file
        import shutil
        shutil.copy2(json_file, dest_path)
        print(f"  Copied: {filename}")
    
    print(f"\nFiles index updated: {index_file}")

if __name__ == "__main__":
    update_files_index()