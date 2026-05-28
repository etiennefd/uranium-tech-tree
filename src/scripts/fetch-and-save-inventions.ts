import Airtable from "airtable";
import { FieldSet, Record as AirtableRecord } from "airtable";
import { writeFile } from "fs/promises";
import path from "path";

// Constants
const CONCURRENT_REQUESTS = 5; // Adjusted for a script that runs less frequently
const OUTPUT_FILE_PATH = path.join(
  process.cwd(),
  "src",
  "app",
  "api",
  "inventions",
  "techtree-data.json"
);

// --- Placeholder Helper Functions ---
// You NEED to import these from your actual utils/location.ts file or define them here.
// Example: import { formatLocation, cleanCommaList } from '../app/utils/location'; 
// Adjust the import path based on your project structure.

function formatLocation(city: string, countryHistorical: string): string {
  // Clean and split the input strings
  const cleanList = (str: string): string[] => 
    str.split(',')
       .map(item => item.trim())
       .filter(Boolean);

  const cities = cleanList(city);
  const countries = cleanList(countryHistorical);

  // If no valid data, return empty string
  if (!cities.length && !countries.length) {
    return '';
  }

  // If only countries are present, join them with semicolons
  if (!cities.length) {
    return countries.join('; ');
  }

  // If only one country, show all cities with that country
  if (countries.length === 1) {
    const country = countries[0];
    if (cities.length === 1) {
      return `${cities[0]}, ${country}`;
    } else {
      const citiesString = cities.join(', ');
      return `${citiesString}, ${country}`;
    }
  }

  // If multiple countries, only show countries
  return countries.join('; ');
}

function cleanCommaList(listString: string): string {
  // Placeholder - replace with your actual implementation
  return listString
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .join(', '); // Example: re-joins with comma-space, ensure this matches your needs
}
// --- End Placeholder Helper Functions ---

// Helper function to process items in parallel with controlled concurrency
async function processBatch<T, R>(
  items: T[],
  processFn: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    console.log(`Processing batch: items ${i} to ${Math.min(i + concurrency - 1, items.length - 1)} of ${items.length}`);
    const batchResults = await Promise.all(batch.map(processFn));
    results.push(...batchResults);
  }
  return results;
}

type CustomAirtableRecord = AirtableRecord<FieldSet>;

// Main logic wrapped in an async IIFE
(async () => {
  // Conditionally import and configure dotenv only if not in production
  if (process.env.NODE_ENV !== 'production') {
    // Dynamically import dotenv to avoid issues if it's not installed in production
    try {
      const dotenv = await import('dotenv');
      dotenv.config({ path: path.resolve(process.cwd(), '.env.local') }); // Ensure it loads .env.local if you use that
      console.log("Loaded .env.local for development");
    } catch (e) {
      console.warn("dotenv not found or failed to load, proceeding without it.");
    }
  }

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE_ID ?? ""
  );

  async function fetchAndSaveData() {
    console.log("Starting to fetch data from Airtable...");
    try {
      // 1. Fetch all records from Airtable (detailed)
      console.time("AirtableFetch");
      const [innovationRecords, connectionRecords] = (await Promise.all([
        base("Innovations")
          .select({
            view: "Main view",
            sort: [{ field: "Date", direction: "desc" }],
          })
          .all(),
        base("Connections")
          .select({
            view: "Main view",
          })
          .all(),
      ])) as [CustomAirtableRecord[], CustomAirtableRecord[]];
      console.timeEnd("AirtableFetch");
      console.log(
        `Fetched ${innovationRecords.length} innovations and ${connectionRecords.length} connections from Airtable.`
      );

      // 2. Filter and Process Innovation Records
      console.log("Processing innovation records...");
      console.time("ProcessInnovations");
      const validInnovationRecords = innovationRecords.filter((record) => {
        const dateValue = record.get("Date");
        const year = Number(dateValue);
        return dateValue && !isNaN(year) && year !== 9999;
      });

      // Coerce a field that may be returned as an array (multi-select / linked-record)
      // or as a comma-separated string into a clean string[].
      const toStringArray = (value: unknown): string[] => {
        if (Array.isArray(value)) {
          return value.map((v) => String(v).trim()).filter(Boolean);
        }
        return String(value ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      };

      const processedNodes = await processBatch(
        validInnovationRecords,
        async (record) => {
          const year = Number(record.get("Date"));
          const imageUrl = String(
            record.get("Image URL") || "/placeholder-invention.jpg"
          );

          const city = toStringArray(record.get("City")).join(", ");
          const countryModern = toStringArray(
            record.get("Country (modern borders)")
          ).join(", ");

          try {
            return {
              id: record.id,
              title: String(record.get("Name") || ""),
              subtitle: "",
              tier: "",
              image: imageUrl,
              localImage: String(record.get("Local image") || ""),
              year,
              dateDetails: "",
              type: "",
              fields: toStringArray(record.get("Field(s)")),
              subfields: [],
              inventors: toStringArray(record.get("Inventor(s)")),
              organizations: toStringArray(record.get("Organization")),
              city,
              countryHistorical: "",
              countryModern,
              formattedLocation: formatLocation(city, countryModern),
              wikipedia: String(record.get("Wikipedia") || ""),
              details: "",
              imagePosition: "center",
              dateAdded: String(record.get("Date added") || ""),
            };
          } catch (error) {
            console.error(`Error processing node ${record.get("Name")}:`, error);
            return null; // Allows batch processing to continue
          }
        },
        CONCURRENT_REQUESTS
      );
      console.timeEnd("ProcessInnovations");

      const validNodes = processedNodes.filter(Boolean) as Array<NonNullable<typeof processedNodes[0]>>;
      console.log(`Successfully processed ${validNodes.length} valid nodes.`);

      // 3. Process Connection Records
      console.log("Processing connection records...");
      console.time("ProcessConnections");
      const links = connectionRecords
        .filter((record) => {
          const fromId = record.get("From");
          const toId = record.get("To");
          const fromIdStr =
            Array.isArray(fromId) && fromId.length > 0
              ? fromId[0]
              : String(fromId ?? "");
          const toIdStr =
            Array.isArray(toId) && toId.length > 0 ? toId[0] : String(toId ?? "");
          
          // Ensure linked nodes exist in our processed validNodes set
          return (
            fromIdStr &&
            toIdStr &&
            validNodes.some((node) => node.id === fromIdStr) &&
            validNodes.some((node) => node.id === toIdStr)
          );
        })
        .map((record) => {
          const fromValue = record.get("From");
          const toValue = record.get("To");
          return {
            source:
              Array.isArray(fromValue) && fromValue.length > 0
                ? fromValue[0]
                : String(fromValue ?? ""),
            target:
              Array.isArray(toValue) && toValue.length > 0
                ? toValue[0]
                : String(toValue ?? ""),
            type: "default",
            details: "",
            detailsSource: "",
            dateAdded: String(record.get("Date added") || ""),
          };
        });
      console.timeEnd("ProcessConnections");
      console.log(`Successfully processed ${links.length} valid links.`);

      // 4. Prepare final data structure
      const finalData = {
        nodes: validNodes,
        links: links,
      };

      // 5. Write to JSON file
      console.log(`Writing data to ${OUTPUT_FILE_PATH}...`);
      console.time("WriteFile");
      await writeFile(OUTPUT_FILE_PATH, JSON.stringify(finalData, null, 2));
      console.timeEnd("WriteFile");
      console.log("Successfully fetched and saved data!");

    } catch (error) {
      console.error("Failed to fetch and save Airtable data:", error);
      process.exit(1); // Exit with error code
    }
  }

  await fetchAndSaveData();

})(); 