export interface CommitteeData {
  committee_id: string;
  name: string;
  committee_type: string;
  committee_type_full: string;
  designation: string;
  designation_full: string;
  organization_type: string;
  organization_type_full: string;
  state: string;
  party: string;
  party_full: string;
  treasurer_name: string;
  street_1: string;
  street_2?: string;
  city: string;
  zip: string;
  first_file_date: string;
  last_file_date: string;
  cycles: number[];
}

export interface ContributionData {
  committee_id: string;
  committee_name: string;
  contributor_id: string;
  contributor_name: string;
  contributor_first_name?: string;
  contributor_last_name?: string;
  contributor_middle_name?: string;
  contributor_suffix?: string;
  contributor_street_1: string;
  contributor_street_2?: string;
  contributor_city: string;
  contributor_state: string;
  contributor_zip: string;
  contributor_employer?: string;
  contributor_occupation?: string;
  contribution_receipt_amount: number;
  contribution_receipt_date: string;
  receipt_type: string;
  receipt_type_full: string;
  memo_code?: string;
  memo_text?: string;
  entity_type: string;
  entity_type_desc: string;
  two_year_transaction_period: number;
  election_type: string;
  election_type_full: string;
  primary_general_indicator?: string;
  image_number?: string;
  file_number: number;
  link_id: string;
  original_sub_id: string;
  sub_id: string;
  filing_form: string;
  is_individual: boolean;
}
