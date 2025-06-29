#!/usr/bin/env python3
"""
Build script to copy organized src/ files to public/ directory for GitHub Pages deployment.
"""

import os
import shutil
import glob
from pathlib import Path

def build_project():
    """Build the project by copying src files to docs directory for GitHub Pages."""
    
    # Get project root directory
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    src_dir = project_root / "src"
    docs_dir = project_root / "docs"
    output_dir = project_root / "output"
    
    print("🏗️  Building SIMBA Data Collector...")
    
    # Ensure docs directory exists
    docs_dir.mkdir(exist_ok=True)
    
    # Clear existing files in docs (except data files)
    for item in docs_dir.iterdir():
        if item.is_file() and not item.name.endswith('.json') and item.name != 'server.log':
            item.unlink()
        elif item.is_dir() and item.name not in ['assets']:
            shutil.rmtree(item)
    
    # Copy main files
    print("📄 Copying main files...")
    shutil.copy2(src_dir / "index.html", docs_dir / "index.html")
    
    # Copy CSS directory
    print("🎨 Copying CSS files...")
    if (docs_dir / "css").exists():
        shutil.rmtree(docs_dir / "css")
    shutil.copytree(src_dir / "css", docs_dir / "css")
    
    # Copy JS directory
    print("⚡ Copying JavaScript files...")
    if (docs_dir / "js").exists():
        shutil.rmtree(docs_dir / "js")
    shutil.copytree(src_dir / "js", docs_dir / "js")
    
    # Copy assets directory
    print("🖼️  Copying assets...")
    src_assets = src_dir / "assets"
    docs_assets = docs_dir / "assets"
    if src_assets.exists():
        if docs_assets.exists():
            shutil.rmtree(docs_assets)
        shutil.copytree(src_assets, docs_assets)
    
    # Copy .nojekyll for GitHub Pages
    nojekyll_src = src_dir / ".nojekyll"
    if nojekyll_src.exists():
        shutil.copy2(nojekyll_src, docs_dir / ".nojekyll")
    
    # Update files index and copy data files
    print("📊 Updating data files...")
    update_files_index()
    
    print("✅ Build completed successfully!")
    print(f"📁 Files built to: {docs_dir}")
    print("🌐 Configure GitHub Pages to serve from /docs directory")
    
    # Show summary
    print("\n📋 Build Summary:")
    print(f"   • HTML: {len(list(docs_dir.glob('*.html')))} file(s)")
    print(f"   • CSS:  {len(list((docs_dir / 'css').glob('*.css')))} file(s)")
    print(f"   • JS:   {len(list((docs_dir / 'js').glob('*.js')))} file(s)")
    print(f"   • Data: {len(list(docs_dir.glob('*.json')))} file(s)")

def update_files_index():
    """Update the files index and copy data files."""
    try:
        from update_files_index import update_files_index as update_index
        update_index()
    except ImportError:
        print("⚠️  Could not import update_files_index - skipping data file update")
    except Exception as e:
        print(f"⚠️  Error updating files index: {e}")

if __name__ == "__main__":
    build_project()