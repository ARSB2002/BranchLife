#!/bin/bash
# BranchLife GitHub Upload Script
# This script uploads game.js and BranchLife.apk to your GitHub repository
#
# Usage:
#   1. Create a GitHub Personal Access Token at https://github.com/settings/tokens
#      (with "repo" scope)
#   2. Run: ./upload_to_github.sh YOUR_TOKEN
#   3. Or set GITHUB_TOKEN env var and run: ./upload_to_github.sh

TOKEN="${1:-$GITHUB_TOKEN}"
REPO="ARSB2002/BranchLife"
BRANCH="main"

if [ -z "$TOKEN" ]; then
  echo "Error: No GitHub token provided"
  echo "Usage: $0 <github_token>"
  echo "Or set GITHUB_TOKEN environment variable"
  echo "Create a token at: https://github.com/settings/tokens"
  exit 1
fi

echo "=== BranchLife GitHub Upload ==="
echo "Repository: $REPO"
echo ""

# Function to upload a file
upload_file() {
  local file_path="$1"
  local github_path="$2"
  local file_name=$(basename "$file_path")

  if [ ! -f "$file_path" ]; then
    echo "Error: File not found: $file_path"
    return 1
  fi

  local file_size=$(wc -c < "$file_path")
  echo "Uploading $file_name ($file_size bytes) to $github_path..."

  # Base64 encode the file content
  local content=$(base64 -i "$file_path")

  # Get current SHA if file exists
  local sha=""
  local sha_response=$(curl -s -H "Authorization: token $TOKEN" \
    "https://api.github.com/repos/$REPO/contents/$github_path?ref=$BRANCH")
  sha=$(echo "$sha_response" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('sha',''))" 2>/dev/null)

  # Prepare JSON payload
  if [ -n "$sha" ]; then
    echo "  File exists, updating (SHA: ${sha:0:8}...)..."
    local payload=$(python3 -c "
import json, sys
content = sys.stdin.read()
print(json.dumps({
  'message': 'Update $file_name',
  'content': content,
  'sha': '$sha',
  'branch': '$BRANCH'
}))
" <<< "$content")
  else
    echo "  Creating new file..."
    local payload=$(python3 -c "
import json, sys
content = sys.stdin.read()
print(json.dumps({
  'message': 'Add $file_name',
  'content': content,
  'branch': '$BRANCH'
}))
" <<< "$content")
  fi

  # Upload
  local response=$(curl -s -w "\n%{http_code}" -X PUT \
    -H "Authorization: token $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "https://api.github.com/repos/$REPO/contents/$github_path")

  local http_code=$(echo "$response" | tail -1)
  local body=$(echo "$response" | sed '$d')

  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo "  ✓ Successfully uploaded!"
    local html_url=$(echo "$body" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('content',{}).get('html_url',''))" 2>/dev/null)
    echo "  URL: $html_url"
  else
    echo "  ✗ Upload failed (HTTP $http_code)"
    echo "  Response: $body"
    return 1
  fi
  echo ""
}

# Upload game.js (extract from HTML if needed)
if [ -f "game.js" ]; then
  upload_file "game.js" "game.js"
elif [ -f "BranchLife.html" ]; then
  echo "Extracting game.js from BranchLife.html..."
  python3 -c "
with open('BranchLife.html', 'r') as f:
    html = f.read()
start = html.find('<script>') + 8
end = html.find('</script>')
js = html[start:end]
with open('game.js', 'w') as f:
    f.write(js)
print(f'Extracted game.js ({len(js)} bytes)')
"
  upload_file "game.js" "game.js"
else
  echo "Warning: game.js not found and BranchLife.html not found"
  echo "Please place game.js or BranchLife.html in the current directory"
fi

# Upload APK
if [ -f "BranchLife.apk" ]; then
  upload_file "BranchLife.apk" "BranchLife.apk"
else
  echo "Warning: BranchLife.apk not found"
  echo "Please place BranchLife.apk in the current directory"
fi

# Upload complete HTML (single file version)
if [ -f "BranchLife.html" ]; then
  upload_file "BranchLife.html" "BranchLife.html"
fi

echo "=== Upload Complete ==="
echo "View your repository: https://github.com/$REPO"
