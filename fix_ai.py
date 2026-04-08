import re

with open('src/services/ai.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the double Array issue
content = content.replace(
    'as Array Array Array<',
    'as Array<'
)

with open('src/services/ai.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed!')
