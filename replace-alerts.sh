#!/bin/bash

# Script to replace all alert() calls with notify() system

echo "🔄 Replacing alert() calls with notification system..."

# Find all files with alert calls and replace them
find . -name "*.tsx" -o -name "*.ts" | while read file; do
    filename="$REPLY"
    echo "Processing: $filename"
    
    # Skip notify.ts itself
    if [[ "$filename" == *"notify.ts"* ]]; then
        echo "  ⏭ Skipping notify utility file"
        continue
    fi
    
    # Create backup
    cp "$filename" "$filename.backup"
    
    # Replace alert calls with notification calls
    sed -i '' -E '
        s/alert\("([^"]+)"\) / notifyError\("\1", \2)/g
        s/alert\("([^"]+)")/ notifySuccess\("\1", \2)/g
        s/alert\("([^"]+)")/ notifyWarning\("\1", \2)/g
        s/alert\("([^"]+)")/ notifyInfo\("\1", \2)/g
        s/alert\(([^"]+)\)/ notify\(\1)/g
    ' "$filename"
    
    # Check if changes were made
    if ! cmp -s "$filename" "$filename.backup" >/dev/null; then
        echo "  ✅ Updated $filename"
    else
        echo "  ⏭ No changes needed in $filename"
        rm "$filename.backup"
    fi
done

echo "✅ Alert replacement complete!"