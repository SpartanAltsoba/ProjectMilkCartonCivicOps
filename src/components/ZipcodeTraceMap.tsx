import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CivicOfficial {
  name: string;
  office: string;
  level: "federal" | "state" | "local";
  party?: string;
  contact?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  votingRecord?: Array<{
    billId: string;
    title: string;
    vote: "YES" | "NO" | "ABSTAIN";
    date: string;
  }>;
}

interface AgencyAffiliation {
  agencyName: string;
  role: string;
  jurisdiction: string;
  budget?: number;
  contracts?: Array<{
    contractor: string;
    amount: number;
    purpose: string;
    startDate: string;
  }>;
  grants?: Array<{
    recipient: string;
    amount: number;
    purpose: string;
    status: string;
  }>;
}

interface ZipcodeData {
  zipCode: string;
  city: string;
  state: string;
  county: string;
  officials: CivicOfficial[];
  agencies: AgencyAffiliation[];
  demographics?: {
    population: number;
    medianIncome: number;
    childrenUnder18: number;
  };
  childWelfareMetrics?: {
    cpsReports: number;
    fosterCareChildren: number;
    adoptionRate: number;
    reunificationRate: number;
  };
}

interface ZipcodeTraceMapProps {
  zipCode: string;
  onDataLoaded?: (data: ZipcodeData) => void;
}

const ZipcodeTraceMap: React.FC<ZipcodeTraceMapProps> = ({ zipCode, onDataLoaded }) => {
  const [data, setData] = useState<ZipcodeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOfficial, setSelectedOfficial] = useState<CivicOfficial | null>(null);
  const [selectedAgency, setSelectedAgency] = useState<AgencyAffiliation | null>(null);
  const [activeTab, setActiveTab] = useState<"officials" | "agencies" | "metrics">("officials");

  useEffect(() => {
    if (zipCode && zipCode.length === 5) {
      fetchZipcodeData(zipCode);
    }
  }, [zipCode]);

  const fetchZipcodeData = async (zip: string) => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would call the Google Civic API
      // and other data sources to get comprehensive information

      // Mock data for demonstration
      const mockData: ZipcodeData = {
        zipCode: zip,
        city: "Sample City",
        state: "CA",
        county: "Sample County",
        officials: [
          {
            name: "John Smith",
            office: "Mayor",
            level: "local",
            party: "Independent",
            contact: {
              phone: "(555) 123-4567",
              email: "mayor@samplecity.gov",
            },
            votingRecord: [
              {
                billId: "SB-123",
                title: "Child Welfare Funding Act",
                vote: "YES",
                date: "2024-03-15",
              },
            ],
          },
          {
            name: "Jane Doe",
            office: "State Representative",
            level: "state",
            party: "Democrat",
            contact: {
              phone: "(555) 987-6543",
              email: "jane.doe@state.gov",
            },
          },
        ],
        agencies: [
          {
            agencyName: "Department of Children and Family Services",
            role: "Primary CPS Agency",
            jurisdiction: "County",
            budget: 45000000,
            contracts: [
              {
                contractor: "Family Support Services Inc.",
                amount: 2500000,
                purpose: "Foster Care Management",
                startDate: "2024-01-01",
              },
            ],
            grants: [
              {
                recipient: "Local Family Center",
                amount: 150000,
                purpose: "Prevention Services",
                status: "Active",
              },
            ],
          },
        ],
        demographics: {
          population: 45000,
          medianIncome: 65000,
          childrenUnder18: 12000,
        },
        childWelfareMetrics: {
          cpsReports: 450,
          fosterCareChildren: 125,
          adoptionRate: 0.15,
          reunificationRate: 0.68,
        },
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      setData(mockData);
      if (onDataLoaded) {
        onDataLoaded(mockData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch zipcode data");
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "federal":
        return "#dc2626";
      case "state":
        return "#2563eb";
      case "local":
        return "#16a34a";
      default:
        return "#6b7280";
    }
  };

  if (loading) {
    return (
      <motion.div
        className="glass-panel p-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="text-4xl mb-4"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          🗺️
        </motion.div>
        <h3 className="text-lg font-bold text-black mb-2">Tracing ZIP Code {zipCode}</h3>
        <p className="text-black font-bold">
          Gathering civic data, officials, and agency information...
        </p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="glass-panel p-6 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ border: "2px solid #dc2626" }}
      >
        <div className="text-4xl mb-4">❌</div>
        <h3 className="text-lg font-bold text-red-800 mb-2">Error Loading ZIP Code Data</h3>
        <p className="text-red-700 font-bold">{error}</p>
        <motion.button
          className="glass-button mt-4"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fetchZipcodeData(zipCode)}
        >
          Retry
        </motion.button>
      </motion.div>
    );
  }

  if (!data) {
    return (
      <motion.div
        className="glass-panel p-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-4xl mb-4">📍</div>
        <h3 className="text-lg font-bold text-black mb-2">Enter ZIP Code</h3>
        <p className="text-black font-bold">
          Enter a valid 5-digit ZIP code to trace civic information.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        className="glass-panel p-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-bold text-black mb-2">📍 ZIP Code Trace: {data.zipCode}</h2>
        <p className="text-black font-bold">
          {data.city}, {data.county} County, {data.state}
        </p>
        {data.demographics && (
          <div className="flex gap-4 mt-2 text-sm">
            <span>👥 Population: {data.demographics.population.toLocaleString()}</span>
            <span>👶 Children: {data.demographics.childrenUnder18.toLocaleString()}</span>
            <span>💰 Median Income: ${data.demographics.medianIncome.toLocaleString()}</span>
          </div>
        )}
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        className="glass-panel p-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex gap-2">
          {[
            { key: "officials", label: "Officials", icon: "👥" },
            { key: "agencies", label: "Agencies", icon: "🏛️" },
            { key: "metrics", label: "Metrics", icon: "📊" },
          ].map(tab => (
            <motion.button
              key={tab.key}
              className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${
                activeTab === tab.key ? "bg-blue-500 text-white" : "glass-button"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.key as any)}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "officials" && (
          <motion.div
            key="officials"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {data.officials.map((official, index) => (
              <motion.div
                key={index}
                className="glass-panel cursor-pointer"
                whileHover={{ y: -2, boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)" }}
                onClick={() => setSelectedOfficial(official)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-black">{official.name}</h3>
                    <p
                      className="text-sm font-bold"
                      style={{ color: getLevelColor(official.level) }}
                    >
                      {official.office} ({official.level})
                    </p>
                    {official.party && <p className="text-xs text-gray-600">{official.party}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getLevelColor(official.level) }}
                    />
                    {official.votingRecord && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        {official.votingRecord.length} votes
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === "agencies" && (
          <motion.div
            key="agencies"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {data.agencies.map((agency, index) => (
              <motion.div
                key={index}
                className="glass-panel cursor-pointer"
                whileHover={{ y: -2, boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)" }}
                onClick={() => setSelectedAgency(agency)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-black">{agency.agencyName}</h3>
                    <p className="text-sm font-bold text-blue-700">{agency.role}</p>
                    <p className="text-xs text-gray-600">{agency.jurisdiction} Level</p>
                  </div>
                  <div className="text-right">
                    {agency.budget && (
                      <p className="text-sm font-bold text-green-700">
                        ${(agency.budget / 1000000).toFixed(1)}M Budget
                      </p>
                    )}
                    <div className="flex gap-1 mt-1">
                      {agency.contracts && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {agency.contracts.length} contracts
                        </span>
                      )}
                      {agency.grants && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {agency.grants.length} grants
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === "metrics" && data.childWelfareMetrics && (
          <motion.div
            key="metrics"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="glass-panel"
          >
            <h3 className="text-lg font-bold text-black mb-4">Child Welfare Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {data.childWelfareMetrics.cpsReports}
                </div>
                <div className="text-sm font-bold">CPS Reports (Annual)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {data.childWelfareMetrics.fosterCareChildren}
                </div>
                <div className="text-sm font-bold">Children in Foster Care</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(data.childWelfareMetrics.reunificationRate * 100)}%
                </div>
                <div className="text-sm font-bold">Reunification Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(data.childWelfareMetrics.adoptionRate * 100)}%
                </div>
                <div className="text-sm font-bold">Adoption Rate</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modals */}
      <AnimatePresence>
        {selectedOfficial && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedOfficial(null)}
          >
            <motion.div
              className="glass-panel p-6 max-w-md w-full mx-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-black">{selectedOfficial.name}</h3>
                <button
                  onClick={() => setSelectedOfficial(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="font-bold">Office:</span> {selectedOfficial.office}
                </div>
                <div>
                  <span className="font-bold">Level:</span> {selectedOfficial.level}
                </div>
                {selectedOfficial.party && (
                  <div>
                    <span className="font-bold">Party:</span> {selectedOfficial.party}
                  </div>
                )}
                {selectedOfficial.contact && (
                  <div>
                    <span className="font-bold">Contact:</span>
                    <div className="ml-4 text-sm">
                      {selectedOfficial.contact.phone && (
                        <div>📞 {selectedOfficial.contact.phone}</div>
                      )}
                      {selectedOfficial.contact.email && (
                        <div>📧 {selectedOfficial.contact.email}</div>
                      )}
                    </div>
                  </div>
                )}
                {selectedOfficial.votingRecord && selectedOfficial.votingRecord.length > 0 && (
                  <div>
                    <span className="font-bold">Recent Votes:</span>
                    <div className="ml-4 space-y-1 text-sm">
                      {selectedOfficial.votingRecord.map((vote, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{vote.title}</span>
                          <span
                            className={`font-bold ${
                              vote.vote === "YES"
                                ? "text-green-600"
                                : vote.vote === "NO"
                                  ? "text-red-600"
                                  : "text-gray-600"
                            }`}
                          >
                            {vote.vote}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ZipcodeTraceMap;
