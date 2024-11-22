import { fromArrayLike } from "rxjs/internal/observable/innerFrom";
import { Topic } from "../../../types/Label";

// We use this to generate the Embeddings for our topics.
const baseTopics = [
  {
    id: "d34bc9d6-b52a-4ff4-93e4-2889fcce9a78",
    name: "Technology",
    description: "this is about Hardware",
  },
  {
    id: "d34bc9d6-b52a-4ff4-93e4-2889fcce9a78",
    name: "Technology",
    description: "this is about cryptocurrency",
  },
  {
    id: "d34bc9d6-b52a-4ff4-93e4-2889fcce9a78",
    name: "Technology",
    description: "this is about Big Tech companies",
  },
  {
    id: "d34bc9d6-b52a-4ff4-93e4-2889fcce9a78",
    name: "Technology",
    description: "this is about Software Engineering",
  },
  {
    id: "d34bc9d6-b52a-4ff4-93e4-2889fcce9a78",
    name: "Technology",
    description: "this is about Artificial Intelligence",
  },
  {
    id: "d34bc9d6-b52a-4ff4-93e4-2889fcce9a78",
    name: "Technology",
    description: "this is about Cyber Security",
  },
  {
    id: "e1f4104c-2b11-48c2-ba8c-d541af461334",
    name: "Politics",
    description: "this is about world politics",
  },
  {
    id: "e1f4104c-2b11-48c2-ba8c-d541af461334",
    name: "Politics",
    description: "this is about Geopolitics",
  },
  {
    id: "e1f4104c-2b11-48c2-ba8c-d541af461334",
    name: "Politics",
    description: "this is about political ideology",
  },
  {
    id: "e1f4104c-2b11-48c2-ba8c-d541af461334",
    name: "Politics",
    description: "this is about Climate policy",
  },
  {
    id: "e1f4104c-2b11-48c2-ba8c-d541af461334",
    name: "Politics",
    description: "this is about economic policy",
  },
  {
    id: "e1f4104c-2b11-48c2-ba8c-d541af461334",
    name: "Politics",
    description: "this is about politics and Social Justice",
  },
  {
    id: "e1f4104c-2b11-48c2-ba8c-d541af461334",
    name: "Politics",
    description: "this is about Republicans",
  },
  {
    id: "e1f4104c-2b11-48c2-ba8c-d541af461334",
    name: "Politics",
    description: "this is about Democrats",
  },
  {
    id: "e1f4104c-2b11-48c2-ba8c-d541af461334",
    name: "Politics",
    description: "this is about Elections",
  },
  {
    id: "e1f4104c-2b11-48c2-ba8c-d541af461334",
    name: "Politics",
    description: "this is about War",
  },
  {
    id: "e1f4104c-2b11-48c2-ba8c-d541af461334",
    name: "Politics",
    description: "this is about political Policy",
  },
  {
    id: "e1f4104c-2b11-48c2-ba8c-d541af461334",
    name: "Politics",
    description: "this is about the President",
  },
  {
    id: "e1f4104c-2b11-48c2-ba8c-d541af461334",
    name: "Politics",
    description: "this is about Laws",
  },
  {
    id: "79edc71b-1c5d-432b-ba9f-c059c74e53ab",
    name: "Health & Wellbeing",
    description: "this is about mental health",
  },
  {
    id: "79edc71b-1c5d-432b-ba9f-c059c74e53ab",
    name: "Health & Wellbeing",
    description: "this is about healthcare",
  },
  {
    id: "79edc71b-1c5d-432b-ba9f-c059c74e53ab",
    name: "Health & Wellbeing",
    description: "this is about healthy food",
  },
  {
    id: "79edc71b-1c5d-432b-ba9f-c059c74e53ab",
    name: "Health & Wellbeing",
    description: "this is about family support",
  },
  {
    id: "79edc71b-1c5d-432b-ba9f-c059c74e53ab",
    name: "Health & Wellbeing",
    description: "this is about relationship advice",
  },
  {
    id: "79edc71b-1c5d-432b-ba9f-c059c74e53ab",
    name: "Health & Wellbeing",
    description: "this is about physical health and working out",
  },
  {
    id: "79edc71b-1c5d-432b-ba9f-c059c74e53ab",
    name: "Health & Wellbeing",
    description: "this is about self care",
  },
  {
    id: "79edc71b-1c5d-432b-ba9f-c059c74e53ab",
    name: "Health & Wellbeing",
    description: "this is about self help",
  },
  {
    id: "79edc71b-1c5d-432b-ba9f-c059c74e53ab",
    name: "Health & Wellbeing",
    description: "this is about dating",
  },
  {
    id: "b327c31f-6c1b-4ff6-a2ac-538f050469c5",
    name: "Business & Finance",
    description: "this is about investments",
  },
  {
    id: "b327c31f-6c1b-4ff6-a2ac-538f050469c5",
    name: "Business & Finance",
    description: "this is about cryptocurrency",
  },
  {
    id: "b327c31f-6c1b-4ff6-a2ac-538f050469c5",
    name: "Business & Finance",
    description: "this is about business and the economy",
  },
  {
    id: "b327c31f-6c1b-4ff6-a2ac-538f050469c5",
    name: "Business & Finance",
    description: "this is about capitalism",
  },
  {
    id: "b327c31f-6c1b-4ff6-a2ac-538f050469c5",
    name: "Business & Finance",
    description: "this is about Business",
  },
  {
    id: "79edc71b-1c5d-432b-ba9f-c059c74e53ab",
    name: "Health & Wellbeing",
    description: "this is about work life balance",
  },
  {
    id: "763130a4-41f0-4a1c-ac45-841bc56e98a9",
    name: "Science & Education",
    description: "this is about space science",
  },
  {
    id: "763130a4-41f0-4a1c-ac45-841bc56e98a9",
    name: "Science & Education",
    description: "this is about climate science",
  },
  {
    id: "763130a4-41f0-4a1c-ac45-841bc56e98a9",
    name: "Science & Education",
    description: "this is about School and College",
  },
  {
    id: "763130a4-41f0-4a1c-ac45-841bc56e98a9",
    name: "Science & Education",
    description: "this is about Physics",
  },
  {
    id: "763130a4-41f0-4a1c-ac45-841bc56e98a9",
    name: "Science & Education",
    description: "this is about pyschological science",
  },
  {
    id: "763130a4-41f0-4a1c-ac45-841bc56e98a9",
    name: "Science & Education",
    description: "this is about science",
  },
  {
    id: "763130a4-41f0-4a1c-ac45-841bc56e98a9",
    name: "Science & Education",
    description: "this is about science and biology",
  },
  {
    id: "763130a4-41f0-4a1c-ac45-841bc56e98a9",
    name: "Science & Education",
    description: "this is about scientific breakthroughs",
  },
  {
    id: "1d2f51c9-c32e-44c3-9651-334ad7470238",
    name: "Culture",
    description: "this is about Entertainment",
  },
  {
    id: "1d2f51c9-c32e-44c3-9651-334ad7470238",
    name: "Culture",
    description: "this is about Books",
  },
  {
    id: "1d2f51c9-c32e-44c3-9651-334ad7470238",
    name: "Culture",
    description: "this is about fiction",
  },
  {
    id: "1d2f51c9-c32e-44c3-9651-334ad7470238",
    name: "Culture",
    description: "this is about Movies",
  },
  {
    id: "1d2f51c9-c32e-44c3-9651-334ad7470238",
    name: "Culture",
    description: "this is about Sports",
  },
  {
    id: "1d2f51c9-c32e-44c3-9651-334ad7470238",
    name: "Culture",
    description: "this is about Music",
  },
  {
    id: "1d2f51c9-c32e-44c3-9651-334ad7470238",
    name: "Culture",
    description: "this is about TV Programmes",
  },
  {
    id: "1d2f51c9-c32e-44c3-9651-334ad7470238",
    name: "Culture",
    description: "this is about Streaming",
  },
  {
    id: "1d2f51c9-c32e-44c3-9651-334ad7470238",
    name: "Culture",
    description: "this is about video games",
  },
  {
    id: "77e3807b-6d94-43b9-8982-7adb009aacee",
    name: "Shopping",
    description: "Top 10 deals from site",
  },
  {
    id: "77e3807b-6d94-43b9-8982-7adb009aacee",
    name: "Shopping",
    description: "Top deals on products from shop",
  },
  {
    id: "77e3807b-6d94-43b9-8982-7adb009aacee",
    name: "Shopping",
    description: "Top products",
  },
  {
    id: "77e3807b-6d94-43b9-8982-7adb009aacee",
    name: "Shopping",
    description: "Best products list",
  },
];

export const topics$ = fromArrayLike(baseTopics as Topic[]);
