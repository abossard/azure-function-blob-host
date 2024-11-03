#!/bin/bash

# Set the base URL of your Azure Function
BASE_URL="http://localhost:7071/api/get-blob"

# Ensure the .test-files folder exists
TEST_FILES_DIR=".test-files"
mkdir -p $TEST_FILES_DIR

# Get the list of all files
echo "Fetching list of files..."
FILES=$(curl -s $BASE_URL)

# Check if the response is valid JSON
if ! echo "$FILES" | jq . > /dev/null 2>&1; then
    echo "Failed to fetch the list of files or invalid JSON response."
    exit 1
fi

# Parse the JSON response to get the list of file names
FILE_NAMES=$(echo "$FILES" | jq -r '.[]')

# Download each file
for FILE_NAME in $FILE_NAMES; do
    FILE_URL="$BASE_URL/$FILE_NAME"
    echo "Downloading $FILE_NAME from $FILE_URL..."
    HTTP_STATUS=$(curl -o "$TEST_FILES_DIR/$FILE_NAME" -w "%{http_code}" -s "$FILE_URL")
    echo "Download status code: $HTTP_STATUS"
done

# # Delete each file
# for FILE_NAME in $FILE_NAMES; do
#     FILE_URL="$BASE_URL/$FILE_NAME"
#     echo "Deleting $FILE_NAME from $FILE_URL..."
#     HTTP_STATUS=$(curl -X DELETE -w "%{http_code}" -s "$FILE_URL")
#     echo "Delete status code: $HTTP_STATUS"
# done

echo "All files downloaded and deleted."