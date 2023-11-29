#!/bin/bash

# Check if the required commands are available
for cmd in jq ffprobe; do
    command -v "$cmd" >/dev/null 2>&1 || { echo "$cmd is required but not installed. Aborting." >&2; exit 1; }
done

# Check if an MKV file is provided as an argument
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path/to/your/file.mkv>"
    exit 1
fi

mkv_file="$1"

# Use ffprobe to get information about the MKV file and format the output with jq
ffprobe_output=$(ffprobe -v quiet -print_format json -show_streams "$mkv_file")

# Print column names
printf "%-15s %-15s %-15s %-15s %-15s %-50s %-30s\n" "StreamNumber" "CodecType" "Language" "BPS" "BitRate" "StreamTitle" "CodecName"

# Extract information using jq
streams=$(echo "$ffprobe_output" | jq -r '.streams')
length=$(echo $streams | jq -r 'length')
for ((i=0; i < $length; ++i)) do
    stream_number=$(echo $streams | jq -r ".[$i].index")
    codec_type=$(echo $streams | jq -r ".[$i].codec_type")
    language=$(echo $streams | jq -r ".[$i].tags.language")
    bps=$(echo $streams | jq -r ".[$i].tags.BPS")
    bit_rate=$(echo $streams | jq -r ".[$i].bit_rate")
    stream_title=$(echo $streams | jq -r ".[$i].tags.title")
    codec_name=$(echo $streams | jq -r ".[$i].codec_name")

    printf "%-15s %-15s %-15s %-15s %-15s %-50s %-30s\n" "$stream_number" "$codec_type" "$language" "$bps" "$bit_rate" "$stream_title" "$codec_name"
done
