import React from "react";
import { motion } from "framer-motion";
import ZipCodeInput from "./ZipCodeInput";

interface ScenarioInputProps {
  value: string;
  zipCode: string;
  onChange: (value: string) => void;
  onZipCodeChange: (value: string, civicData?: any) => void;
}

const scenarios = [
  "Mandated Reporter Investigation",
  "Foster Care Placement",
  "Runaway Recovery",
  "Parental Rights Termination",
  "NGO Contract Oversight",
  "Mental Health Referral",
  "Federal Audit Response",
  "State Policy Implementation",
  "Court Petition Filing",
  "CPS Investigation",
  "Child Abuse Investigation",
  "Neglect Case Review",
  "Family Reunification",
  "Adoption Process",
  "Emergency Placement",
  "Therapeutic Services",
  "Educational Support",
  "Housing Assistance",
  "Substance Abuse Treatment",
  "Domestic Violence Response",
];

const ScenarioInput: React.FC<ScenarioInputProps> = ({
  value,
  zipCode,
  onChange,
  onZipCodeChange,
}) => {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <motion.label
          htmlFor="scenario"
          className="block text-black font-bold mb-2"
          style={{ textShadow: "0 0 3px rgba(255, 255, 255, 0.5)" }}
          whileHover={{ scale: 1.02 }}
        >
          Investigation Scenario *
        </motion.label>

        <motion.select
          id="scenario"
          value={value}
          onChange={e => onChange(e.target.value)}
          required
          className="glass-input w-full"
          whileFocus={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <option value="">Select an investigation scenario...</option>
          {scenarios.map(scenario => (
            <option key={scenario} value={scenario}>
              {scenario}
            </option>
          ))}
        </motion.select>
      </div>

      <ZipCodeInput value={zipCode} onChange={onZipCodeChange} />

      <div>
        <motion.label
          htmlFor="scenario-details"
          className="block text-black font-bold mb-2"
          style={{ textShadow: "0 0 3px rgba(255, 255, 255, 0.5)" }}
          whileHover={{ scale: 1.02 }}
        >
          Additional Details (Optional)
        </motion.label>
        <motion.textarea
          id="scenario-details"
          placeholder="Provide any additional context or specific details about the investigation..."
          rows={4}
          className="glass-input w-full"
          whileFocus={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          style={{
            resize: "vertical",
            minHeight: "100px",
          }}
        />
      </div>
    </motion.div>
  );
};

export default ScenarioInput;
