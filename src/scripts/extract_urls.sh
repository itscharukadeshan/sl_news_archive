#!/bin/bash

# Define the base directory for archives
BASE_DIR="../data/archive"

# Loop through each source directory
for source in "$BASE_DIR"/*; do
  # Check if it's a directory
  if [ -d "$source" ]; then
    for year in "$source"/*; do
      if [ -d "$year" ]; then
        for month in "$year"/*; do
          if [ -d "$month" ]; then
            # Loop through each date folder (archive_YYYY-MM-DD)
            for date_folder in "$month"/*; do
              if [ -d "$date_folder" ]; then
                # Create urls.txt in the current date folder
                output_file="$date_folder/urls.txt"
                # Extract URLs from all JSON files in the date folder and save them to urls.txt
                jq -r '.[].url' "$date_folder"/*.json > "$output_file"
                echo "Saved URLs to $output_file"
              fi
            done
          fi
        done
      fi
    done
  fi
done

echo "URL extraction completed."
