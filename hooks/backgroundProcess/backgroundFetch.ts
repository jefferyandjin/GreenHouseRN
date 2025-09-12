import BackgroundFetch from "react-native-background-fetch";
import { useDatabaseStore } from "../../store/databaseStore";

// Mock upload function
async function uploadRecords(records: any[]) {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(records),
    });
    const result = await response.json();
    console.log("Uploaded records:", result);
  } catch (error) {
    console.error("Upload failed:", error);
  }
}

// Background task
export const configureBackgroundFetch = () => {
  BackgroundFetch.configure(
    {
      minimumFetchInterval: 15, // minutes
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
    },
    async (taskId) => {
      console.log("[BackgroundFetch] task start:", taskId);

      try {
        // Read recent 10 records
        const getRecentRecords = useDatabaseStore.getState().getRecentRecords;
        const records = await getRecentRecords(10);

        if (records.length > 0) {
          await uploadRecords(records);
        } else {
          console.log("[BackgroundFetch] no records to upload");
        }
      } catch (err) {
        console.error("[BackgroundFetch] error", err);
      }

      BackgroundFetch.finish(taskId);
    },
    (error) => {
      console.error("[BackgroundFetch] failed to configure", error);
    }
  );
};
