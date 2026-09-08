import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Globe, 
  Phone, 
  Star, 
  ExternalLink, 
  UserPlus, 
  Check, 
  Key, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  ArrowUpDown, 
  Building2, 
  CheckCircle2, 
  SlidersHorizontal,
  Info,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  X
} from 'lucide-react';
import { Lead } from '../types';

export interface DiscoveredPlace {
  id: string;
  placeId: string;
  name: string;
  company: string;
  address: string;
  phone: string;
  website: string;
  hasWebsite: boolean;
  rating: number | null;
  userRatingCount: number;
  googleMapsUri: string;
  businessStatus: string;
  category: string;
  types: string[];
  location?: { latitude: number; longitude: number } | null;
}

interface LeadFinderProps {
  existingLeads: Lead[];
  onAddLead: (newLead: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<boolean>;
  onBulkImportLeads: (leadsToImport: any[]) => Promise<{
    success: boolean;
    total: number;
    imported: number;
    failed: number;
    duplicates: number;
    error?: string;
  }>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const POPULAR_NICHES = [
  'Video Production',
  'Digital Marketing Agencies',
  'Web Development',
  'Dentists & Clinics',
  'Real Estate Agencies',
  'Law Firms',
  'HVAC & Contractors',
  'Restaurants & Cafes',
  'Accounting & CPA',
  'Solar Energy'
];

export const LeadFinder: React.FC<LeadFinderProps> = ({
  existingLeads,
  onAddLead,
  onBulkImportLeads,
  showToast
}) => {
  // Search parameters
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [minRating, setMinRating] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(20);
  const [hasWebsiteFilter, setHasWebsiteFilter] = useState<'all' | 'has_website' | 'no_website'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'reviews'>('relevance');
  const [viewLayout, setViewLayout] = useState<'table' | 'grid'>('table');

  // Results & API state
  const [results, setResults] = useState<DiscoveredPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isApiConfigured, setIsApiConfigured] = useState<boolean | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('zyqitek_custom_places_api_key') || '') : '';
  });

  // Bulk selection & importing
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<Set<string>>(new Set());
  const [importingPlaceId, setImportingPlaceId] = useState<string | null>(null);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkImportProgress, setBulkImportProgress] = useState<{ current: number; total: number } | null>(null);

  // Check backend API status on mount
  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const sessionToken = typeof localStorage !== 'undefined' ? (localStorage.getItem('zyqro_session_token') || '') : '';
      const res = await fetch('/api/lead-finder/status', {
        headers: {
          ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {})
        }
      });
      const data = await res.json();
      if (data && data.success) {
        setIsApiConfigured(Boolean(data.isConfigured || customKeyInput.trim()));
      }
    } catch {
      setIsApiConfigured(Boolean(customKeyInput.trim()));
    }
  };

  // Duplicate Lead Matcher
  const normalizeText = (txt?: string) => (txt || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const normalizePhone = (phone?: string) => (phone || '').replace(/\D/g, '').trim();

  const existingLeadsLookup = useMemo(() => {
    const placeIds = new Set<string>();
    const phones = new Set<string>();
    const namesAndAddresses = new Set<string>();
    const names = new Set<string>();

    existingLeads.forEach(lead => {
      if (lead.customFields?.placeId) {
        placeIds.add(String(lead.customFields.placeId));
      }
      if (lead.customFields?.googlePlaceId) {
        placeIds.add(String(lead.customFields.googlePlaceId));
      }
      const ph = normalizePhone(lead.phone);
      if (ph) phones.add(ph);

      const normName = normalizeText(lead.name || lead.company);
      const normAddr = normalizeText(lead.country || lead.notes || '');
      if (normName) {
        names.add(normName);
        if (normAddr) {
          namesAndAddresses.add(`${normName}|${normAddr}`);
        }
      }
    });

    return { placeIds, phones, namesAndAddresses, names };
  }, [existingLeads]);

  const isPlaceAlreadyInLeads = (place: DiscoveredPlace): boolean => {
    // 1. Google Place ID
    if (place.placeId && existingLeadsLookup.placeIds.has(place.placeId)) return true;
    if (place.id && existingLeadsLookup.placeIds.has(place.id)) return true;

    // 2. Phone match
    const normPhone = normalizePhone(place.phone);
    if (normPhone && normPhone.length >= 7 && existingLeadsLookup.phones.has(normPhone)) return true;

    // 3. Name & address or exact business name match
    const normName = normalizeText(place.name);
    if (normName && existingLeadsLookup.names.has(normName)) return true;

    return false;
  };

  // Perform Google Places Search
  const handleSearch = async (e?: React.FormEvent, isLoadMore = false) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      showToast('Please enter a business keyword or industry to search.', 'info');
      return;
    }

    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setHasSearched(true);
      setErrorMessage(null);
      setSelectedPlaceIds(new Set());
    }

    try {
      const savedCustomKey = typeof localStorage !== 'undefined' ? (localStorage.getItem('zyqitek_custom_places_api_key') || '') : '';
      const sessionToken = typeof localStorage !== 'undefined' ? (localStorage.getItem('zyqro_session_token') || '') : '';

      const response = await fetch('/api/lead-finder/search', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {})
        },
        body: JSON.stringify({
          query: query.trim(),
          location: location.trim(),
          minRating: minRating > 0 ? minRating : undefined,
          hasWebsite: hasWebsiteFilter,
          sortBy,
          pageSize: pageSize || 20,
          pageToken: isLoadMore ? nextPageToken : undefined,
          customApiKey: customKeyInput.trim() || savedCustomKey || undefined
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.error === 'API_NOT_CONFIGURED') {
          setIsApiConfigured(false);
          setErrorMessage(data.message || 'Google Places API is not configured. Please enter a valid Google Cloud API key below to search.');
        } else {
          setErrorMessage(data.message || 'Unable to retrieve Places data. Please check the Google Places API configuration.');
          showToast(data.message || 'Error retrieving Places data.', 'error');
        }
        if (!isLoadMore) setResults([]);
        return;
      }

      setIsApiConfigured(true);
      const incomingPlaces: DiscoveredPlace[] = data.places || [];

      if (isLoadMore) {
        setResults(prev => [...prev, ...incomingPlaces]);
      } else {
        setResults(incomingPlaces);
      }

      setNextPageToken(data.nextPageToken || null);

      if (!isLoadMore) {
        if (incomingPlaces.length === 0) {
          showToast('No businesses found matching your query and filters.', 'info');
        } else {
          showToast(`Discovered ${incomingPlaces.length} businesses via Google Places.`, 'success');
        }
      }
    } catch (err: any) {
      console.error('[Lead Finder] Search request error:', err);
      setErrorMessage('Unable to retrieve Places data. Please check network connectivity and Google Places API configuration.');
      showToast('Network error while searching for leads.', 'error');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Single Lead Import
  const handleImportSingle = async (place: DiscoveredPlace) => {
    if (isPlaceAlreadyInLeads(place)) {
      showToast(`"${place.name}" is already in your CRM Leads.`, 'info');
      return;
    }

    setImportingPlaceId(place.id);
    try {
      const notesLines = [
        `Discovered via Google Places Search.`,
        place.address ? `Address: ${place.address}` : '',
        place.rating ? `Rating: ${place.rating} ★ (${place.userRatingCount} reviews)` : '',
        place.hasWebsite ? `Website: ${place.website}` : 'Note: Business does NOT have a website.',
        place.googleMapsUri ? `Google Maps: ${place.googleMapsUri}` : ''
      ].filter(Boolean).join('\n');

      const leadPayload: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>> = {
        name: place.name,
        company: place.name,
        phone: place.phone || '',
        email: '',
        websiteUrl: place.website || '',
        category: place.category || 'Google Places',
        source: 'Google Places',
        status: 'New',
        value: 5000,
        notes: notesLines,
        country: location || place.address || '',
        customFields: {
          placeId: place.placeId || place.id,
          googlePlaceId: place.placeId || place.id,
          rating: place.rating,
          userRatingCount: place.userRatingCount,
          googleMapsUri: place.googleMapsUri,
          businessStatus: place.businessStatus,
          discoveredAt: new Date().toISOString()
        }
      };

      const success = await onAddLead(leadPayload);
      if (success) {
        showToast(`"${place.name}" added to CRM Leads.`, 'success');
      }
    } catch (err) {
      console.error('Failed to import place as lead:', err);
      showToast(`Failed to add "${place.name}".`, 'error');
    } finally {
      setImportingPlaceId(null);
    }
  };

  // Bulk Selection Handlers
  const nonDuplicateResults = useMemo(() => {
    return results.filter(p => !isPlaceAlreadyInLeads(p));
  }, [results, existingLeadsLookup]);

  const toggleSelectAll = () => {
    if (selectedPlaceIds.size === nonDuplicateResults.length && nonDuplicateResults.length > 0) {
      setSelectedPlaceIds(new Set());
    } else {
      setSelectedPlaceIds(new Set(nonDuplicateResults.map(p => p.id)));
    }
  };

  const toggleSelectPlace = (id: string) => {
    setSelectedPlaceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Bulk Import Handlers
  const handleBulkImportSelected = async () => {
    const placesToImport = results.filter(p => selectedPlaceIds.has(p.id) && !isPlaceAlreadyInLeads(p));
    if (placesToImport.length === 0) {
      showToast('No new businesses selected for import.', 'info');
      return;
    }

    setIsBulkImporting(true);
    setBulkImportProgress({ current: 0, total: placesToImport.length });

    try {
      const mappedLeads = placesToImport.map(place => {
        const notesLines = [
          `Discovered via Google Places Search.`,
          place.address ? `Address: ${place.address}` : '',
          place.rating ? `Rating: ${place.rating} ★ (${place.userRatingCount} reviews)` : '',
          place.hasWebsite ? `Website: ${place.website}` : 'Note: Business does NOT have a website.',
          place.googleMapsUri ? `Google Maps: ${place.googleMapsUri}` : ''
        ].filter(Boolean).join('\n');

        return {
          name: place.name,
          company: place.name,
          phone: place.phone || '',
          email: '',
          websiteUrl: place.website || '',
          category: place.category || 'Google Places',
          source: 'Google Places',
          status: 'New',
          value: 5000,
          notes: notesLines,
          country: location || place.address || '',
          customFields: {
            placeId: place.placeId || place.id,
            googlePlaceId: place.placeId || place.id,
            rating: place.rating,
            userRatingCount: place.userRatingCount,
            googleMapsUri: place.googleMapsUri,
            businessStatus: place.businessStatus,
            discoveredAt: new Date().toISOString()
          }
        };
      });

      const result = await onBulkImportLeads(mappedLeads);
      if (result.success || result.imported > 0) {
        showToast(`Successfully imported ${result.imported} businesses into CRM Leads (${result.duplicates} duplicates skipped).`, 'success');
        setSelectedPlaceIds(new Set());
      } else {
        showToast(result.error || 'Failed to import leads.', 'error');
      }
    } catch (err) {
      console.error('Bulk import error:', err);
      showToast('Encountered an error while bulk importing leads.', 'error');
    } finally {
      setIsBulkImporting(false);
      setBulkImportProgress(null);
    }
  };

  const handleSaveCustomApiKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('zyqitek_custom_places_api_key', customKeyInput.trim());
    }
    setShowConfigModal(false);
    setIsApiConfigured(Boolean(customKeyInput.trim()));
    showToast('Google Places API key saved.', 'success');
    if (query.trim()) {
      handleSearch();
    }
  };

  return (
    <div id="lead-finder-container" className="space-y-5">
      {/* Header Info Banner */}
      <div className="bg-[var(--crm-card)] border border-[var(--crm-card-border)] p-5 rounded-2xl shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Google Places Search
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Direct CRM Lead Prospecting
              </span>
            </div>
            <h2 className="text-xl font-bold !text-white text-white tracking-tight">
              Business Leads Discovery
            </h2>
            <p className="text-xs !text-white text-white font-normal italic max-w-2xl 3xl:max-w-4xl 4k:max-w-5xl 5k:max-w-7xl">
              Search real-world businesses by keyword and location using Google Places data. Filter businesses without websites to identify high-value prospects and import them into your CRM Leads.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <button
              id="lead-finder-config-btn"
              onClick={() => setShowConfigModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--crm-text)] bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar)]/80 border border-[var(--crm-card-border)] rounded-xl transition-all cursor-pointer shadow-xs"
              title="Configure Google Places API Key"
            >
              <Key size={14} className="text-indigo-500" />
              <span>API Settings</span>
              {isApiConfigured && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1" />
              )}
            </button>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={(e) => handleSearch(e)} className="mt-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Query Input */}
            <div className="md:col-span-6 relative">
              <label htmlFor="lead-finder-query" className="block text-[11px] font-medium text-[var(--crm-text-secondary)] mb-1 uppercase tracking-wider">
                Keyword / Business Category
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-[var(--crm-text-secondary)]" size={16} />
                <input
                  id="lead-finder-query"
                  type="text"
                  placeholder="e.g. Video Production, Digital Marketing, Dental Clinic..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--crm-sidebar)] text-[var(--crm-text)] placeholder-[var(--crm-text-secondary)] border border-[var(--crm-card-border)] rounded-xl outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-medium transition-all"
                />
              </div>
            </div>

            {/* Location Input */}
            <div className="md:col-span-4 relative">
              <label htmlFor="lead-finder-location" className="block text-[11px] font-medium text-[var(--crm-text-secondary)] mb-1 uppercase tracking-wider">
                Location / City
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 text-[var(--crm-text-secondary)]" size={16} />
                <input
                  id="lead-finder-location"
                  type="text"
                  placeholder="e.g. Karachi, New York, London..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--crm-sidebar)] text-[var(--crm-text)] placeholder-[var(--crm-text-secondary)] border border-[var(--crm-card-border)] rounded-xl outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-medium transition-all"
                />
              </div>
            </div>

            {/* Search Button */}
            <div className="md:col-span-2 flex items-end">
              <button
                id="lead-finder-submit-btn"
                type="submit"
                disabled={isLoading || !query.trim()}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer h-[38px]"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    <span>Search Places</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Category Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-[var(--crm-subtitle)] font-medium flex items-center gap-1 mr-1">
              <Sparkles size={12} className="text-amber-500" />
              Quick:
            </span>
            {POPULAR_NICHES.map((niche) => (
              <button
                key={niche}
                type="button"
                onClick={() => {
                  setQuery(niche);
                }}
                className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer ${
                  query === niche 
                    ? 'bg-indigo-600 text-white border-indigo-600 font-medium' 
                    : 'bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] border-[var(--crm-card-border)] hover:text-[var(--crm-text)] hover:border-indigo-500/30'
                }`}
              >
                {niche}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Advanced Filters & View Layout Toolbar */}
      <div className="bg-[var(--crm-card)] border border-[var(--crm-card-border)] p-3.5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-[var(--crm-subtitle)] font-medium mr-1">
            <SlidersHorizontal size={14} className="text-indigo-500" />
            <span>Filters:</span>
          </div>

          {/* Website Filter */}
          <div className="flex items-center bg-[var(--crm-sidebar)] p-0.5 rounded-xl border border-[var(--crm-card-border)]">
            <button
              type="button"
              onClick={() => setHasWebsiteFilter('all')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all font-medium cursor-pointer ${
                hasWebsiteFilter === 'all' 
                  ? 'bg-[var(--crm-card)] text-[var(--crm-text)] shadow-xs' 
                  : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)]'
              }`}
            >
              All Businesses
            </button>
            <button
              type="button"
              onClick={() => setHasWebsiteFilter('no_website')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all font-medium flex items-center gap-1 cursor-pointer ${
                hasWebsiteFilter === 'no_website' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'text-[var(--crm-text-secondary)] hover:text-amber-500'
              }`}
              title="Filter businesses that do NOT have a registered website"
            >
              <span>🚫 Without Website</span>
              <span className="text-[9px] px-1 py-0.2 bg-black/20 rounded-sm">Hot</span>
            </button>
            <button
              type="button"
              onClick={() => setHasWebsiteFilter('has_website')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all font-medium flex items-center gap-1 cursor-pointer ${
                hasWebsiteFilter === 'has_website' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-[var(--crm-text-secondary)] hover:text-emerald-500'
              }`}
            >
              <Globe size={11} />
              <span>With Website</span>
            </button>
          </div>

          {/* Rating Filter */}
          <select
            id="lead-finder-filter-rating"
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="px-2.5 py-1.5 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-xl text-xs font-medium outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            <option value="0">Rating: All</option>
            <option value="5.0">★ 5.0 Rating</option>
            <option value="4.5">★ 4.5+ Rating</option>
            <option value="4.0">★ 4.0+ Rating</option>
            <option value="3.5">★ 3.5+ Rating</option>
            <option value="3.0">★ 3.0+ Rating</option>
          </select>

          {/* Results Count Selector */}
          <select
            id="lead-finder-page-size"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2.5 py-1.5 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-xl text-xs font-medium outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            <option value="10">10 Results</option>
            <option value="20">20 Results</option>
            <option value="50">50 Results</option>
          </select>
        </div>

        {/* Sort & Layout Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-[var(--crm-subtitle)] font-medium">
            <ArrowUpDown size={12} />
            <span>Sort:</span>
          </div>
          <select
            id="lead-finder-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-xl text-xs font-medium outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            <option value="relevance">Google Relevance</option>
            <option value="rating">Highest Rating (★)</option>
            <option value="reviews">Most Reviews</option>
          </select>

          {/* View Mode Toggle: Table vs Cards */}
          <div className="flex items-center bg-[var(--crm-sidebar)] p-0.5 rounded-xl border border-[var(--crm-card-border)] ml-1">
            <button
              type="button"
              onClick={() => setViewLayout('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewLayout === 'table' 
                  ? 'bg-[var(--crm-card)] text-indigo-600 dark:text-indigo-400 shadow-xs' 
                  : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)]'
              }`}
              title="Table view"
            >
              <TableIcon size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewLayout === 'grid' 
                  ? 'bg-[var(--crm-card)] text-indigo-600 dark:text-indigo-400 shadow-xs' 
                  : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)]'
              }`}
              title="Grid cards view"
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (when results are loaded) */}
      {results.length > 0 && (
        <div className="bg-indigo-950/20 dark:bg-indigo-950/40 border border-indigo-500/30 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-[var(--crm-text)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedPlaceIds.size > 0 && selectedPlaceIds.size === nonDuplicateResults.length}
                onChange={toggleSelectAll}
                disabled={nonDuplicateResults.length === 0}
                className="w-4 h-4 rounded-sm text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>
                Select All Eligible ({nonDuplicateResults.length})
              </span>
            </label>
            <span className="text-xs text-[var(--crm-subtitle)]">
              {selectedPlaceIds.size} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="lead-finder-bulk-import-btn"
              onClick={handleBulkImportSelected}
              disabled={selectedPlaceIds.size === 0 || isBulkImporting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {isBulkImporting ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Importing {bulkImportProgress?.current || 0}/{bulkImportProgress?.total || selectedPlaceIds.size}...</span>
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  <span>Import Selected ({selectedPlaceIds.size}) as Leads</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error / API Notice */}
      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-600 dark:text-rose-400 text-xs flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-sm">Google Places Notice</p>
            <p>{errorMessage}</p>
            <button
              onClick={() => setShowConfigModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-all cursor-pointer"
            >
              <Key size={13} />
              <span>Configure Google Places API Key</span>
            </button>
          </div>
        </div>
      )}

      {/* Results Section */}
      {isLoading ? (
        <div className="bg-[var(--crm-card)] border border-[var(--crm-card-border)] p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-3 border-indigo-500/20 border-t-indigo-600 animate-spin" />
          <h3 className="text-sm font-semibold text-[var(--crm-heading)]">Connecting to Google Places API...</h3>
          <p className="text-xs text-[var(--crm-subtitle)] max-w-sm">
            Retrieving real-time business profiles, ratings, websites, and contact coordinates.
          </p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[var(--crm-subtitle)] px-1">
            <span>Showing {results.length} discovered businesses</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={13} />
              Duplicate protection active
            </span>
          </div>

          {/* TABLE VIEW (Default compact CRM style) */}
          {viewLayout === 'table' ? (
            <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[var(--crm-sidebar)] border-b border-[var(--crm-card-border)] text-[var(--crm-text-secondary)] font-semibold text-[11px]">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedPlaceIds.size > 0 && selectedPlaceIds.size === nonDuplicateResults.length}
                          onChange={toggleSelectAll}
                          disabled={nonDuplicateResults.length === 0}
                          className="rounded-sm text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-3">Business Name & Category</th>
                      <th className="p-3">Rating & Reviews</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Website</th>
                      <th className="p-3">Address</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--crm-card-border)]">
                    {results.map((place) => {
                      const isAlreadyInLeads = isPlaceAlreadyInLeads(place);
                      const isSelected = selectedPlaceIds.has(place.id);
                      const isCurrentImporting = importingPlaceId === place.id;

                      return (
                        <tr 
                          key={place.id}
                          className={`transition-colors ${
                            isAlreadyInLeads 
                              ? 'bg-[var(--crm-sidebar)]/40 opacity-80' 
                              : isSelected 
                              ? 'bg-indigo-500/5' 
                              : 'hover:bg-[var(--crm-sidebar)]/60'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-3 text-center">
                            {!isAlreadyInLeads ? (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectPlace(place.id)}
                                className="rounded-sm text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            ) : (
                              <span className="text-[10px] text-emerald-500 font-medium">✓</span>
                            )}
                          </td>

                          {/* Business Name & Category */}
                          <td className="p-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-xs text-[var(--crm-heading)]">
                                  {place.name}
                                </span>
                                {place.googleMapsUri && (
                                  <a
                                    href={place.googleMapsUri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[var(--crm-subtitle)] hover:text-indigo-600 dark:hover:text-indigo-400"
                                    title="View on Google Maps"
                                  >
                                    <ExternalLink size={11} />
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] border border-[var(--crm-card-border)] capitalize">
                                  {place.category || 'Business'}
                                </span>
                                {place.businessStatus !== 'OPERATIONAL' && (
                                  <span className="px-1.5 py-0.2 rounded-xs text-[9px] bg-rose-500/10 text-rose-600">
                                    {place.businessStatus}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Rating & Reviews */}
                          <td className="p-3 whitespace-nowrap">
                            {place.rating !== null ? (
                              <div className="flex items-center gap-1 text-amber-500 font-semibold text-xs">
                                <Star size={13} className="fill-amber-500" />
                                <span>{place.rating.toFixed(1)}</span>
                                <span className="text-[var(--crm-text-secondary)] font-normal text-[11px]">
                                  ({place.userRatingCount.toLocaleString()})
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[var(--crm-text-secondary)] italic">
                                No rating data
                              </span>
                            )}
                          </td>

                          {/* Phone */}
                          <td className="p-3 whitespace-nowrap">
                            {place.phone ? (
                              <a
                                href={`tel:${place.phone}`}
                                className="flex items-center gap-1.5 text-[var(--crm-text)] hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
                              >
                                <Phone size={12} className="text-[var(--crm-text-secondary)]" />
                                <span>{place.phone}</span>
                              </a>
                            ) : (
                              <span className="text-[11px] text-[var(--crm-text-secondary)] italic">
                                No data available
                              </span>
                            )}
                          </td>

                          {/* Website */}
                          <td className="p-3">
                            {place.hasWebsite ? (
                              <a
                                href={place.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium truncate max-w-[160px]"
                                title={place.website}
                              >
                                <Globe size={12} className="shrink-0" />
                                <span className="truncate">{place.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] rounded-md font-semibold border border-amber-500/20">
                                <span>🚫 Without Website</span>
                              </span>
                            )}
                          </td>

                          {/* Address */}
                          <td className="p-3 max-w-[220px]">
                            {place.address ? (
                              <div className="flex items-start gap-1.5 text-[11px] text-[var(--crm-text)]" title={place.address}>
                                <MapPin size={12} className="text-[var(--crm-text-secondary)] shrink-0 mt-0.5" />
                                <span className="truncate">{place.address}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[var(--crm-text-secondary)] italic">
                                No data available
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="p-3 text-right whitespace-nowrap">
                            {isAlreadyInLeads ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <Check size={12} />
                                <span>Already Imported</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleImportSingle(place)}
                                disabled={isCurrentImporting}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition-all shadow-xs cursor-pointer"
                              >
                                {isCurrentImporting ? (
                                  <>
                                    <RefreshCw size={12} className="animate-spin" />
                                    <span>Importing...</span>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus size={12} />
                                    <span>Import as Lead</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* GRID CARDS VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((place) => {
                const isAlreadyInLeads = isPlaceAlreadyInLeads(place);
                const isSelected = selectedPlaceIds.has(place.id);
                const isCurrentImporting = importingPlaceId === place.id;

                return (
                  <div
                    key={place.id}
                    id={`place-card-${place.id}`}
                    className={`bg-[var(--crm-card)] border rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3 relative ${
                      isAlreadyInLeads 
                        ? 'border-[var(--crm-card-border)]/60 bg-[var(--crm-card)]/70 opacity-90' 
                        : isSelected
                        ? 'border-indigo-500/80 shadow-md ring-1 ring-indigo-500/20'
                        : 'border-[var(--crm-card-border)] hover:border-indigo-500/40 hover:shadow-xs'
                    }`}
                  >
                    {/* Top Bar: Checkbox + Name + Status Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        {!isAlreadyInLeads && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectPlace(place.id)}
                            className="mt-1 w-4 h-4 rounded-sm text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm text-[var(--crm-heading)] truncate" title={place.name}>
                              {place.name}
                            </h4>
                            {place.category && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] border border-[var(--crm-card-border)] capitalize">
                                {place.category}
                              </span>
                            )}
                          </div>

                          {/* Rating & Reviews */}
                          <div className="flex items-center gap-2 mt-1">
                            {place.rating !== null ? (
                              <div className="flex items-center gap-1 text-amber-500 font-semibold text-xs">
                                <Star size={13} className="fill-amber-500" />
                                <span>{place.rating.toFixed(1)}</span>
                                <span className="text-[var(--crm-text-secondary)] font-normal text-[11px]">
                                  ({place.userRatingCount.toLocaleString()} reviews)
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[var(--crm-text-secondary)] italic">
                                No rating data
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lead status badge */}
                      {isAlreadyInLeads ? (
                        <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 size={12} />
                          <span>Already Imported</span>
                        </span>
                      ) : (
                        <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          Discovered
                        </span>
                      )}
                    </div>

                    {/* Body Info: Address, Phone, Website */}
                    <div className="space-y-1.5 text-xs text-[var(--crm-text-secondary)] border-t border-[var(--crm-card-border)]/50 pt-2.5">
                      {/* Address */}
                      <div className="flex items-start gap-2">
                        <MapPin size={13} className="text-[var(--crm-text-secondary)] shrink-0 mt-0.5" />
                        <span className="text-[var(--crm-text)] text-[11px] leading-relaxed truncate" title={place.address || 'No address data'}>
                          {place.address || 'Address not listed'}
                        </span>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-[var(--crm-text-secondary)] shrink-0" />
                        {place.phone ? (
                          <a 
                            href={`tel:${place.phone}`} 
                            className="text-[var(--crm-text)] text-[11px] hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
                          >
                            {place.phone}
                          </a>
                        ) : (
                          <span className="text-[11px] text-[var(--crm-text-secondary)] italic">No data available</span>
                        )}
                      </div>

                      {/* Website */}
                      <div className="flex items-center gap-2">
                        <Globe size={13} className="text-[var(--crm-text-secondary)] shrink-0" />
                        {place.hasWebsite ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={place.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 dark:text-indigo-400 hover:underline text-[11px] font-medium flex items-center gap-1 truncate max-w-[200px] 2xl:max-w-[400px] 3xl:max-w-[600px] 4k:max-w-none"
                              title={place.website}
                            >
                              <span>{place.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                              <ExternalLink size={11} className="shrink-0" />
                            </a>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] rounded-md font-semibold border border-amber-500/20 flex items-center gap-1">
                            <span>🚫 Without Website</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="flex items-center justify-between gap-2 border-t border-[var(--crm-card-border)]/50 pt-2.5">
                      {place.googleMapsUri ? (
                        <a
                          href={place.googleMapsUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[var(--crm-subtitle)] hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                        >
                          <span>View on Maps</span>
                          <ExternalLink size={11} />
                        </a>
                      ) : <span />}

                      {isAlreadyInLeads ? (
                        <button
                          disabled
                          className="px-3 py-1.5 bg-[var(--crm-sidebar)] text-[var(--crm-subtitle)] text-xs font-medium rounded-xl border border-[var(--crm-card-border)] flex items-center gap-1.5 cursor-not-allowed"
                        >
                          <Check size={13} className="text-emerald-500" />
                          <span>In CRM</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleImportSingle(place)}
                          disabled={isCurrentImporting}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ml-auto"
                        >
                          {isCurrentImporting ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" />
                              <span>Adding...</span>
                            </>
                          ) : (
                            <>
                              <UserPlus size={13} />
                              <span>Import as Lead</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination / Load More */}
          {nextPageToken && (
            <div className="pt-3 flex justify-center">
              <button
                onClick={() => handleSearch(undefined, true)}
                disabled={isLoadingMore}
                className="px-6 py-2.5 bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar)] text-[var(--crm-text)] text-xs font-semibold rounded-xl border border-[var(--crm-card-border)] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                {isLoadingMore ? (
                  <>
                    <RefreshCw size={14} className="animate-spin text-indigo-600" />
                    <span>Loading more businesses...</span>
                  </>
                ) : (
                  <>
                    <Layers size={14} className="text-indigo-600" />
                    <span>Load Next 20 Places</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : hasSearched ? (
        <div className="bg-[var(--crm-card)] border border-[var(--crm-card-border)] p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
          <Building2 size={36} className="text-[var(--crm-subtitle)] opacity-60" />
          <h3 className="text-base font-semibold text-[var(--crm-heading)]">No Business Leads Found</h3>
          <p className="text-xs text-[var(--crm-subtitle)] max-w-sm">
            We couldn't find any businesses for &ldquo;{query}&rdquo; {location ? `in ${location}` : ''} matching your active filters. Try broadening your keywords or clearing the rating/website filters.
          </p>
          <button
            onClick={() => {
              setHasWebsiteFilter('all');
              setMinRating(0);
            }}
            className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-medium cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Initial Discovery State */
        <div className="bg-[var(--crm-card)] border border-[var(--crm-card-border)] p-10 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20">
            <Search size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[var(--crm-heading)]">
              Discover High-Intent Business Leads
            </h3>
            <p className="text-xs text-[var(--crm-subtitle)] max-w-md mx-auto">
              Enter an industry keyword and target city or location above to explore real businesses, filter prospects without websites, and import them directly into your CRM Leads pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl 3xl:max-w-4xl 4k:max-w-5xl 5k:max-w-7xl mx-auto pt-3 text-left">
            <div className="p-3 bg-[var(--crm-sidebar)] rounded-xl border border-[var(--crm-card-border)] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--crm-heading)]">
                <Globe size={13} className="text-amber-500" />
                <span>Without Website Filter</span>
              </div>
              <p className="text-[11px] text-[var(--crm-subtitle)]">
                Identify businesses that lack a website for direct web design and development outreach.
              </p>
            </div>

            <div className="p-3 bg-[var(--crm-sidebar)] rounded-xl border border-[var(--crm-card-border)] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--crm-heading)]">
                <Star size={13} className="text-indigo-500" />
                <span>Rating & Reviews</span>
              </div>
              <p className="text-[11px] text-[var(--crm-subtitle)]">
                Filter by minimum star rating to target established businesses with marketing budgets.
              </p>
            </div>

            <div className="p-3 bg-[var(--crm-sidebar)] rounded-xl border border-[var(--crm-card-border)] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--crm-heading)]">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span>Duplicate Protection</span>
              </div>
              <p className="text-[11px] text-[var(--crm-subtitle)]">
                Automatically checks your CRM database so you never import the same business twice.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* API Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-2xl max-w-lg 2xl:max-w-xl 3xl:max-w-2xl 4k:max-w-3xl 5k:max-w-4xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key size={18} className="text-indigo-500" />
                <h3 className="font-bold text-base text-[var(--crm-heading)]">
                  Google Places API Setup
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[var(--crm-subtitle)] leading-relaxed">
              <p>
                The Lead Finder queries Google Places to fetch verified business listings, phone numbers, ratings, websites, and addresses.
              </p>
              
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-1 text-[var(--crm-text)]">
                <p className="font-semibold text-xs flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                  <Info size={13} />
                  Google Places Setup:
                </p>
                <p className="text-[11px] text-[var(--crm-subtitle)]">
                  Enter your Google Cloud API key directly below to search and discover local business leads in real-time.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--crm-text-secondary)] mb-1 uppercase tracking-wider">
                  Google Cloud API Key
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={customKeyInput}
                  onChange={(e) => setCustomKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-xl outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs"
                />
              </div>

              <p className="text-[11px] text-[var(--crm-text-secondary)]">
                Ensure <strong className="text-[var(--crm-text)]">Places API</strong> or <strong className="text-[var(--crm-text)]">Places API (New)</strong> is enabled on your Google Cloud Console project.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--crm-card-border)]">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar)]/80 text-[var(--crm-text)] text-xs font-medium rounded-xl border border-[var(--crm-card-border)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomApiKey}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
              >
                Save & Apply Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadFinder;
