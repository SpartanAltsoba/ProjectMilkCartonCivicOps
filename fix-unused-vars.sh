#!/bin/bash

echo "🔧 Auto-fixing unused variables and ESLint complaints..."

# 1. Prefix all unused variables with `_` in .ts and .tsx files
grep -rl --include=\*.{ts,tsx} "@typescript-eslint/no-unused-vars" ./src ./functions \
| while read -r file; do
  echo "⚙️ Patching $file"
  sed -i -E 's/\b(const|let|var) ([a-zA-Z0-9]+) =/\1 _\2 =/g' "$file"
  sed -i -E 's/\bfunction ([a-zA-Z0-9]+)\(([^)]*)\)/function \1(\2)/g' "$file"
  sed -i -E 's/^([[:space:]]*)([a-zA-Z0-9]+):/\\1_\\2:/g' "$file"
done

# 2. Remove redundant role="list" on <ul>
grep -rl --include=\*.tsx 'role="list"' ./src \
| while read -r file; do
  echo "⚙️ Cleaning role='list' in $file"
  sed -i 's/role="list"//g' "$file"
done

# 3. (Optional) Fix "no-case-declarations" by wrapping case bodies in braces
# Could be added later if still relevant

echo "✅ Auto-fix complete. Run 'npm run build' to verify."
