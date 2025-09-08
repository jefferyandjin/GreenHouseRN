// utils/photoQueue.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const PHOTO_QUEUE_KEY = "photo_queue_v1";

export interface QueuedPhoto {
  id: string;
  uri: string;
  createdAt: number;
  uploaded?: boolean;
}

// Load the current queue
export async function getPhotoQueue(): Promise<QueuedPhoto[]> {
  try {
    const raw = await AsyncStorage.getItem(PHOTO_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to load photo queue", err);
    return [];
  }
}

// Add a photo to the queue
export async function addPhotoToQueue(uri: string): Promise<void> {
  const queue = await getPhotoQueue();
  const newItem: QueuedPhoto = {
    id: Date.now().toString(),
    uri,
    createdAt: Date.now(),
    uploaded: false,
  };
  const newQueue = [...queue, newItem];
  await AsyncStorage.setItem(PHOTO_QUEUE_KEY, JSON.stringify(newQueue));
}

// Mark photo as uploaded and remove from queue
export async function removePhotoFromQueue(id: string): Promise<void> {
  const queue = await getPhotoQueue();
  const newQueue = queue.filter((item) => item.id !== id);
  await AsyncStorage.setItem(PHOTO_QUEUE_KEY, JSON.stringify(newQueue));
}

// Example: drain the queue when online
export async function drainQueue(
  uploadFn: (photo: QueuedPhoto) => Promise<void>
): Promise<void> {
  const queue = await getPhotoQueue();
  for (const item of queue) {
    try {
      await uploadFn(item);
      await removePhotoFromQueue(item.id);
    } catch (err) {
      console.warn(`Failed to upload ${item.id}, keeping in queue`);
    }
  }
}
