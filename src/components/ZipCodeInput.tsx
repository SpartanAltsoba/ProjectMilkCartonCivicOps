import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ZipCodeInputProps {
  value: string;
  onChange: (value: string, civicData?: any) => void;
  onResolve?: (data: any) => void;
}

interface CivicData {
  normalizedInput: {
    city: string;
    state: string;
    zip: string;
  };
  offices: Array<{
    name: string;
    levels: string[];
    officialIndices: number[];
  }>;
  officials: Array<{
    name: string;
    party: string;
    phones?: string[];
    urls?: string[];
  }>;
}

const ZipCodeInput: React.FC<ZipCodeInputProps> = ({ value, onChange, onResolve }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [civicData, setCivicData] = useState<CivicData | null>(null);

  useEffect(() => {
    const fetchCivicData = async () => {
      if (value.length !== 5) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://civicinfo.googleapis.com/civicinfo/v2/representatives?address=${value}&key=${process.env.NEXT_PUBLIC_GOOGLE_CIVIC_API_KEY}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch civic data");
        }

        const data = await response.json();
        setCivicData(data);
        onChange(value, data);
        if (onResolve) onResolve(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    if (value.length === 5) {
      fetchCivicData();
    }
  }, [value, onChange, onResolve]);

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="zipcode"
          className="block text-sm font-bold text-black mb-2"
          style={{ textShadow: "0 0 3px rgba(255, 255, 255, 0.5)" }}
        >
          ZIP Code *
        </label>
        <motion.input
          type="text"
          id="zipcode"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value.replace(/[^0-9]/g, "").slice(0, 5);
            onChange(newValue);
          }}
          className="glass-input w-full"
          placeholder="Enter ZIP code"
          maxLength={5}
          pattern="[0-9]*"
          required
          whileFocus={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        />
      </div>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-blue-600 font-bold"
          >
            Resolving ZIP code...
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-red-600 font-bold"
          >
            {error}
          </motion.div>
        )}

        {civicData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-panel"
          >
            <h4 className="text-sm font-bold text-black mb-2">
              {civicData.normalizedInput.city}, {civicData.normalizedInput.state}
            </h4>
            <div className="space-y-2">
              {civicData.offices.map((office, i) => (
                <div key={i} className="text-sm">
                  <span className="font-bold">{office.name}:</span>{" "}
                  {office.officialIndices.map(index => civicData.officials[index].name).join(", ")}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ZipCodeInput;
