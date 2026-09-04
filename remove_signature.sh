#!/bin/bash
sed -i '/<div className="border-b border-slate-400 w-40 pb-1 mb-1 text-slate-400 font-mono">Sign Here<\/div>/d' src/components/ProposalCalculator.tsx
sed -i '/<div className="font-bold text-slate-800">Client Acceptance Signature<\/div>/d' src/components/ProposalCalculator.tsx
