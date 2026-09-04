#!/bin/bash
find src/components -type f -name "*.tsx" -exec sed -i 's/text-\[var(--crm-heading)\] font-structure/!text-white font-structure/g' {} +
find src/components -type f -name "*.tsx" -exec sed -i 's/text-\[var(--crm-subtitle)\] text-sm font-normal/!text-white text-sm font-bold/g' {} +
