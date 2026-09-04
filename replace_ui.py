import re

with open('src/components/ProposalCalculator.tsx', 'r') as f:
    content = f.read()

with open('left_col_new.txt', 'r') as f:
    left_col_new = f.read()

with open('right_col_new.txt', 'r') as f:
    right_col_new = f.read()


# Use regex to find the start and end of the lg:col-span-2 block
# We know it starts with <div className="lg:col-span-2 space-y-6">
# and ends right before <div className="lg:col-span-1">

pattern = re.compile(r'<div className="lg:col-span-2.*?<div className="lg:col-span-1">', re.DOTALL)
match = pattern.search(content)
if match:
    # We want to replace everything from lg:col-span-2 up to just before lg:col-span-1
    new_content = content[:match.start()] + left_col_new + "\n          " + '<div className="lg:col-span-1">' + content[match.end():]
    content = new_content
else:
    print("Could not find left col")

# Now replace the right col
pattern = re.compile(r'<div className="lg:col-span-1">.*?</button>\s*</div>\s*</div>\s*</div>', re.DOTALL)
match = pattern.search(content)
if match:
    new_content = content[:match.start()] + right_col_new + "\n        </div>"
    content = new_content
else:
    print("Could not find right col")

with open('src/components/ProposalCalculator.tsx', 'w') as f:
    f.write(content)

