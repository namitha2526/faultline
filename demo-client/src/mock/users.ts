export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  city: string;
  postcode: string;
  avatar: string;
  tier: "Standard" | "Gold" | "Platinum";
}

export const MOCK_USERS: MockUser[] = [
  {
    id: "usr_gb_oliver_101",
    name: "Oliver Hughes",
    email: "oliver.hughes@faultlineshop.co.uk",
    role: "Senior Architect",
    city: "London",
    postcode: "EC2A 4NE",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
    tier: "Platinum",
  },
  {
    id: "usr_gb_charlotte_102",
    name: "Charlotte Reed",
    email: "charlotte.reed@faultlineshop.co.uk",
    role: "Lead Product Designer",
    city: "Edinburgh",
    postcode: "EH1 1YZ",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250",
    tier: "Gold",
  },
  {
    id: "usr_gb_harry_103",
    name: "Harry Bennett",
    email: "harry.bennett@faultlineshop.co.uk",
    role: "Site Reliability Engineer",
    city: "Manchester",
    postcode: "M1 1AE",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
    tier: "Standard",
  },
];

