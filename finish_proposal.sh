#!/bin/bash
cat << 'JSX_EOF' >> src/components/ProposalCalculator.tsx

      // Continue handleSendToPortalFormat
      const newDoc = {
        id: `doc-${Date.now()}`,
        title: `${docType}: ${generatedProposalObj.proposalNumber} - ${generatedProposalObj.title}`,
        type: docType === 'IMAGE' ? 'image/png' : 'application/pdf',
        size: uploadRes.size,
        url: uploadRes.fileUrl,
        uploadedBy: 'Zyqro Admin',
        uploadedAt: nowStr
      };
      
      const updatedPortal = { ...clientPortal, documents: [...(clientPortal.documents || []), newDoc], updatedAt: nowStr };
      await saveToFirestore('clientPortals', updatedPortal.id, updatedPortal);
      
      setUploadProgress(100);
      showToast?.(`Successfully sent ${docType} to ${clientPortal.clientName}'s Portal.`, 'success');
      setTimeout(() => {
        setIsUploadingToPortal(false);
        setModalMode('options');
      }, 1000);
    } catch (err) {
      console.error(err);
      showToast?.('Failed to send to portal.', 'error');
      setIsUploadingToPortal(false);
    }
  };

  const getSubtotal = () => {
    let base = Number(unitBasePrice) || 0;
    if (selectedType && currentCatalog) {
      const t = currentCatalog.types.find((x: any) => x.name === selectedType);
      if (t) base = t.price;
    }
    return (base * itemQuantity) + addonsTotal + (Number(customExtraCost) || 0);
  };
  const subtotal = getSubtotal();
  const grandTotal = subtotal - discountAmount + taxAmount;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="text-xl font-extrabold text-slate-900 font-structure">Proposal & Quotation Engine</h2>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button onClick={() => setActiveTab('form')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'form' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>New Proposal</button>
          <button onClick={() => setActiveTab('history')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>History</button>
        </div>
      </div>

      {activeTab === 'history' && (
        <div className="space-y-4">
          {savedProposals && savedProposals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProposals.map(prop => (
                <div key={prop.id} className="border border-slate-200 rounded-xl p-4 flex flex-col">
                  <div className="text-xs font-bold text-slate-400 mb-1">{prop.proposalNumber}</div>
                  <div className="font-bold text-slate-900 mb-2">{prop.title}</div>
                  <div className="text-sm text-slate-600 mb-4">{prop.clientName}</div>
                  <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-emerald-600">${prop.grandTotal.toLocaleString()}</span>
                    <button onClick={() => setGeneratedProposalObj(prop) || setModalMode('options') || setShowGenerateModal(true)} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-slate-800">Options</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-500 text-sm">No saved proposals found.</div>
          )}
        </div>
      )}

      {activeTab === 'form' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Client & Core Config */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">1. Client & Service Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Client *</label>
                  <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="w-full text-sm rounded-lg border-slate-300">
                    <option value="">-- Choose Client --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Service Category *</label>
                  <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setSelectedType(null); setSelectedFeatures([]); }} className="w-full text-sm rounded-lg border-slate-300">
                    <option value="">-- Choose Category --</option>
                    {Object.keys(SERVICE_CATALOGS || {}).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                
                {selectedCategory && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Service Type *</label>
                    <select value={selectedType || ''} onChange={(e) => setSelectedType(e.target.value)} className="w-full text-sm rounded-lg border-slate-300">
                      <option value="">-- Choose Type --</option>
                      {(currentCatalog?.types || []).map((t: any) => <option key={t.name} value={t.name}>{t.name} - ${t.price}</option>)}
                    </select>
                  </div>
                )}
                
                {selectedCategory && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Add-ons & Features</label>
                    <select multiple value={selectedFeatures} onChange={(e) => setSelectedFeatures(Array.from(e.target.selectedOptions, o => o.value))} className="w-full text-sm rounded-lg border-slate-300 h-24">
                      {(currentCatalog?.features || []).map((f: any) => <option key={f.name} value={f.name}>{f.name} (+${f.price})</option>)}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Adjustments */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">2. Pricing Adjustments</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
                  <input type="number" min="1" value={itemQuantity} onChange={e => setItemQuantity(Number(e.target.value) || 1)} className="w-full text-sm rounded-lg border-slate-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Extra Cost ($)</label>
                  <input type="number" min="0" value={customExtraCost} onChange={e => setCustomExtraCost(Number(e.target.value) || '')} className="w-full text-sm rounded-lg border-slate-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type</label>
                  <select value={discountType} onChange={e => setDiscountType(e.target.value as any)} className="w-full text-sm rounded-lg border-slate-300">
                    <option value="Percentage">% Percentage</option>
                    <option value="Fixed">$ Fixed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount Value</label>
                  <input type="number" min="0" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value) || '')} className="w-full text-sm rounded-lg border-slate-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tax (%)</label>
                  <input type="number" min="0" value={taxPercentage} onChange={e => setTaxPercentage(Number(e.target.value) || '')} className="w-full text-sm rounded-lg border-slate-300" />
                </div>
              </div>
            </div>

            {/* Logistics */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">3. Logistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Date</label>
                  <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="w-full text-sm rounded-lg border-slate-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Project Notes (Internal or Client)</label>
                  <textarea value={projectNotes} onChange={e => setProjectNotes(e.target.value)} rows={2} className="w-full text-sm rounded-lg border-slate-300" />
                </div>
              </div>
            </div>

          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-slate-900 rounded-xl shadow-lg p-6 text-white sticky top-6">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2 border-b border-slate-700 pb-4">
                <DollarSign size={20} className="text-emerald-400" />
                Quotation Summary
              </h3>
              
              <div className="space-y-4 text-sm mb-6">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Discount</span>
                  <span className="font-mono text-rose-400">-${discountAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Tax ({taxPercentage}%)</span>
                  <span className="font-mono text-white">+${taxAmount.toLocaleString()}</span>
                </div>
                <div className="pt-4 border-t border-slate-700 flex justify-between items-center text-lg font-bold">
                  <span className="text-slate-100">Grand Total</span>
                  <span className="font-mono text-emerald-400">${grandTotal.toLocaleString()}</span>
                </div>
              </div>
              
              <button onClick={handleGenerateProposal} disabled={!selectedClientId || !selectedType} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-extrabold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <FileCheck size={18} />
                Generate & Options
              </button>
            </div>
          </div>
        </div>
      )}

      {showGenerateModal && generatedProposalObj && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex justify-between items-center z-10">
              <h3 className="font-bold text-lg text-slate-900">Proposal Options: {generatedProposalObj.proposalNumber}</h3>
              <button onClick={() => setShowGenerateModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
            </div>
            <div className="p-6">
              
              {modalMode === 'options' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => handleSaveToDb()} className="p-4 border border-slate-200 rounded-xl hover:border-slate-800 hover:bg-slate-50 flex items-start gap-3 transition-colors text-left group">
                    <div className="bg-slate-100 text-slate-800 p-2 rounded-lg group-hover:bg-slate-800 group-hover:text-white transition-colors"><Send size={20} /></div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">Save to CRM</div>
                      <div className="text-xs text-slate-500 mt-1">Save this quotation to the database to track status and history.</div>
                    </div>
                  </button>
                  <button onClick={() => setModalMode('payment_details')} className="p-4 border border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 flex items-start gap-3 transition-colors text-left group">
                    <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors"><CreditCard size={20} /></div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">Payment & Invoice Setup</div>
                      <div className="text-xs text-slate-500 mt-1">Configure bank details and payment purpose for export.</div>
                    </div>
                  </button>
                  <button onClick={handleInitiateSendToPortal} className="p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 flex items-start gap-3 transition-colors text-left group">
                    <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-colors"><Globe size={20} /></div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">Send to Portal</div>
                      <div className="text-xs text-slate-500 mt-1">Upload automatically to the client's secure document portal.</div>
                    </div>
                  </button>
                  <button onClick={() => handleExportFormat('pdf')} className="p-4 border border-slate-200 rounded-xl hover:border-rose-500 hover:bg-rose-50 flex items-start gap-3 transition-colors text-left group">
                    <div className="bg-rose-50 text-rose-600 p-2 rounded-lg group-hover:bg-rose-500 group-hover:text-white transition-colors"><FileText size={20} /></div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">Download PDF</div>
                      <div className="text-xs text-slate-500 mt-1">Export a beautifully formatted corporate PDF quotation.</div>
                    </div>
                  </button>
                </div>
              )}

              {modalMode === 'send_to_portal_select' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setModalMode('options')} className="text-slate-500 hover:text-slate-800"><ChevronRight className="rotate-180" size={20}/></button>
                    <h4 className="font-bold text-slate-900">Select Format to Send</h4>
                  </div>
                  {isUploadingToPortal ? (
                    <div className="py-12 flex flex-col items-center">
                      <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                      <div className="font-bold text-slate-800">Uploading to Secure Portal...</div>
                      <div className="w-64 h-2 bg-slate-100 rounded-full mt-4 overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${uploadProgress}%`}}></div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button onClick={() => handleSendToPortalFormat('pdf')} className="p-4 border border-slate-200 rounded-xl hover:border-emerald-500 text-center flex flex-col items-center gap-2">
                        <div className="bg-slate-100 p-3 rounded-full text-slate-600"><FileText size={24}/></div>
                        <div className="font-bold text-sm">Proposal PDF</div>
                      </button>
                      <button onClick={() => handleSendToPortalFormat('image')} className="p-4 border border-slate-200 rounded-xl hover:border-emerald-500 text-center flex flex-col items-center gap-2">
                        <div className="bg-slate-100 p-3 rounded-full text-slate-600"><ImageIcon size={24}/></div>
                        <div className="font-bold text-sm">Proposal Image</div>
                      </button>
                      <button onClick={() => handleSendToPortalFormat('invoice')} className="p-4 border border-slate-200 rounded-xl hover:border-emerald-500 text-center flex flex-col items-center gap-2">
                        <div className="bg-slate-100 p-3 rounded-full text-slate-600"><FileCheck size={24}/></div>
                        <div className="font-bold text-sm">Invoice PDF</div>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {modalMode === 'no_portal_prompt' && (
                <div className="py-8 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
                    <Globe size={32} />
                  </div>
                  <h4 className="font-bold text-xl text-slate-900">No Client Portal Exists</h4>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">
                    The client <strong>{generatedProposalObj.clientName}</strong> does not have an active secure portal. You must create one first.
                  </p>
                  <div className="pt-6 flex justify-center gap-3">
                    <button onClick={() => setModalMode('options')} className="px-6 py-2 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                    <button onClick={() => setModalMode('create_portal')} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800">Create Portal</button>
                  </div>
                </div>
              )}

              {modalMode === 'create_portal' && (
                <form onSubmit={handleCreatePortalInline} className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <button type="button" onClick={() => setModalMode('no_portal_prompt')} className="text-slate-500 hover:text-slate-800"><ChevronRight className="rotate-180" size={20}/></button>
                    <h4 className="font-bold text-slate-900">Create Secure Portal</h4>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Portal Name</label>
                    <input required type="text" value={newPortalForm.portalName} onChange={e => setNewPortalForm({...newPortalForm, portalName: e.target.value})} className="w-full text-sm rounded-lg border-slate-300" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Access Username</label>
                      <input required type="text" value={newPortalForm.username} onChange={e => setNewPortalForm({...newPortalForm, username: e.target.value})} className="w-full text-sm rounded-lg border-slate-300" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password</label>
                      <input required type="text" value={newPortalForm.password} onChange={e => setNewPortalForm({...newPortalForm, password: e.target.value})} className="w-full text-sm rounded-lg border-slate-300" />
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <button disabled={isCreatingPortal} type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-500 disabled:opacity-50">
                      {isCreatingPortal ? 'Creating...' : 'Create & Continue'}
                    </button>
                  </div>
                </form>
              )}

              {modalMode === 'payment_details' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => setModalMode('options')} className="text-slate-500 hover:text-slate-800"><ChevronRight className="rotate-180" size={20}/></button>
                    <h4 className="font-bold text-slate-900">Payment Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                      <input type="text" value={payBankName} onChange={e => setPayBankName(e.target.value)} className="w-full text-sm rounded-lg border-slate-300" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Account Title</label>
                      <input type="text" value={payAccountTitle} onChange={e => setPayAccountTitle(e.target.value)} className="w-full text-sm rounded-lg border-slate-300" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
                      <input type="text" value={payAccountNumber} onChange={e => setPayAccountNumber(e.target.value)} className="w-full text-sm rounded-lg border-slate-300" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">IBAN (Optional)</label>
                      <input type="text" value={payIban} onChange={e => setPayIban(e.target.value)} className="w-full text-sm rounded-lg border-slate-300" />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                    <button onClick={() => handleGenerateInvoiceWithPayment(new Event('submit') as any)} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800">
                      Save & Continue to Export
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProposalCalculator;
JSX_EOF
