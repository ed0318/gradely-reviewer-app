import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/**
 * The profile photo lives only on this phone. It is squared in the picker,
 * resized to 512 px, saved as a JPEG in the app's documents, and the database
 * keeps only its path relative to that folder (the absolute path changes when
 * iOS moves the app's container), never the image itself.
 */
const PHOTO_FOLDER = 'profile';
const PHOTO_SIZE_PX = 512;

export type PhotoSource = 'camera' | 'library';

export class PhotoPermissionError extends Error {
  constructor(readonly source: PhotoSource) {
    super(source === 'camera' ? 'Allow camera access in Settings to take a photo.' : 'Allow photo access in Settings to choose a photo.');
    this.name = 'PhotoPermissionError';
  }
}

/** Resolves to the kept photo's relative path, or null when the person backed out. */
export async function pickProfilePhoto(source: PhotoSource): Promise<string | null> {
  const permission =
    source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new PhotoPermissionError(source);

  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 };
  const picked = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (picked.canceled) return null;

  const rendered = await ImageManipulator.manipulate(picked.assets[0].uri).resize({ width: PHOTO_SIZE_PX, height: PHOTO_SIZE_PX }).renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });

  const folder = new Directory(Paths.document, PHOTO_FOLDER);
  if (!folder.exists) folder.create({ intermediates: true });
  const fileName = `avatar-${Date.now()}.jpg`;
  new File(saved.uri).move(new File(folder, fileName));
  return `${PHOTO_FOLDER}/${fileName}`;
}

/** The photo's current file URI, for <Image>. */
export function resolvePhotoUri(photoPath: string | null): string | null {
  return photoPath ? new File(Paths.document, photoPath).uri : null;
}

export function deletePhotoFile(photoPath: string | null): void {
  if (!photoPath) return;
  try {
    const file = new File(Paths.document, photoPath);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('[reviewer] old profile photo not deleted', error);
  }
}

/** Every profile photo on the phone, for an erase. */
export function deleteAllPhotoFiles(): void {
  try {
    const folder = new Directory(Paths.document, PHOTO_FOLDER);
    if (folder.exists) folder.delete();
  } catch (error) {
    console.warn('[reviewer] profile photos not deleted', error);
  }
}
