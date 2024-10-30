#!/bin/bash

# Directory paths
DATA_DIR="../data"                  # Directory containing JSON files
OUTPUT_DIR="../data/archive"         # Directory for separated output
ARCHIVE_DIR="../data/processed_data"     # Directory for storing processed files
LOG_FILE="../data/process_log.txt"          # Log file for command logs

# Ensure output and archive directories exist
mkdir -p "$OUTPUT_DIR"
mkdir -p "$ARCHIVE_DIR"

# Start logging
echo "Process started at $(date)" >> "$LOG_FILE"

# Loop over each JSON file in the data directory
for file in "$DATA_DIR"/*.json; do
    filename=$(basename "$file")
    echo "Processing file: $filename" >> "$LOG_FILE"

    # Parse the JSON file for each unique key
    jq -c 'to_entries[]' "$file" | while read -r entry; do
        key=$(echo "$entry" | jq -r '.key')
        success=$(echo "$entry" | jq -r '.value.success')

        # Only process if success is true
        if [ "$success" = "true" ]; then
            data_array=$(echo "$entry" | jq -c '.value.data[]')

            # Create a subdirectory for each unique key if it does not already exist
            key_dir="$OUTPUT_DIR/$key"
            mkdir -p "$key_dir"

            # Loop through each item in the data array
            echo "$data_array" | while read -r item; do
                title=$(echo "$item" | jq -r '.title')
                href=$(echo "$item" | jq -r '.href')
                url=$(echo "$item" | jq -r '.url')
                checkSum=$(echo "$item" | jq -r '.checkSum')

                # Skip the entry if title, url, or checkSum is missing or empty
                if [ -z "$title" ] || [ -z "$url" ] || [ -z "$checkSum" ]; then
                    echo "Skipped entry with missing title, url, or checksum." >> "$LOG_FILE"
                    continue
                fi

                timestamp=$(echo "$item" | jq -r '.timestamp')
                isoTimestamp=$(echo "$item" | jq -r '.isoTimestamp')
                # Assuming 'byline' and 'baseUrl' are not mandatory for filtering
                byline=$(echo "$item" | jq -r '.byline')
                baseUrl=$(echo "$item" | jq -r '.baseUrl')

                # Extract date from isoTimestamp to create date-based folder
                date=$(echo "$isoTimestamp" | cut -d'T' -f1)
                date_dir="$key_dir/$date"
                mkdir -p "$date_dir"

                # Output file and checksum file for each key and date
                output_file="$date_dir/articles.json"
                checksum_file="$date_dir/checksum.txt"
                urls_file="$date_dir/urls.txt"

                # Create the new entry in JSON format
                new_entry=$(jq -n \
                    --arg title "$title" \
                    --arg href "$href" \
                    --arg byline "$byline" \
                    --arg timestamp "$timestamp" \
                    --arg url "$url" \
                    --arg isoTimestamp "$isoTimestamp" \
                    --arg baseUrl "$baseUrl" \
                    --arg checkSum "$checkSum" \
                    '{title: $title, href: $href, byline: $byline, timestamp: $timestamp, url: $url, isoTimestamp: $isoTimestamp, baseUrl: $baseUrl, checkSum: $checkSum}')

                # If the output file does not exist, create it with an empty JSON array
                if [ ! -f "$output_file" ]; then
                    echo "[]" > "$output_file"  # Create an empty JSON array
                fi

                # Check if the checksum already exists in the checksum file
                if ! grep -q "$checkSum" "$checksum_file" 2>/dev/null; then
                    # Read existing data, append new entry, and write back to file
                    existing_data=$(cat "$output_file")
                    updated_data=$(echo "$existing_data" | jq ". += [$new_entry]")
                    echo "$updated_data" > "$output_file"

                    # Append checksum and URL to their respective files
                    echo "$checkSum" >> "$checksum_file"
                    echo "$url" >> "$urls_file"

                    echo "Added new entry for date: $date in key: $key" >> "$LOG_FILE"
                else
                    echo "Duplicate entry skipped for checksum: $checkSum" >> "$LOG_FILE"
                fi
            done
        else
            echo "Skipping key: $key (success is false)" >> "$LOG_FILE"
        fi
    done

    # Move the processed JSON file to the archive directory
    mv "$file" "$ARCHIVE_DIR/$filename"
    echo "Moved $filename to archive" >> "$LOG_FILE"
done

echo "Process completed at $(date)" >> "$LOG_FILE"
echo "Processing complete! Data separated by keys and dates in '$OUTPUT_DIR'. Logs saved to '$LOG_FILE'."
