// app/utils/image.js
import * as ImageManipulator from "expo-image-manipulator";

export async function compressImage(uri) {
  try {
    const { uri: out } = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1440 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
    );
    return out;
  } catch {
    return uri;
  }
}
