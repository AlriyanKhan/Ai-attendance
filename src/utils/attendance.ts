import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, storage } from '../config/firebase';

/**
 * Marks attendance by uploading an image to Firebase Storage and recording 
 * attendance metadata in Firestore
 */
export async function markAttendance(file: File, name: string) {
  try {
    const filename = `${name}_${Date.now()}.jpg`;
    const storageRef = ref(storage, `attendance/${filename}`);

    // 1. Upload image to Firebase Storage
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Image uploaded successfully');

    // 2. Get the public download URL
    const imageUrl = await getDownloadURL(snapshot.ref);
    console.log('Download URL generated:', imageUrl);

    // 3. Save metadata to Firestore
    const docRef = await addDoc(collection(db, 'attendance'), {
      name: name,
      timestamp: Timestamp.now(),
      imageUrl: imageUrl,
      userId: name.toLowerCase().replace(/\s+/g, '_'), // Create a simple userId from name
    });

    console.log('Attendance marked successfully with ID:', docRef.id);
    return { success: true, id: docRef.id, imageUrl };
  } catch (error) {
    console.error('Error marking attendance:', error);
    return { success: false, error };
  }
} 