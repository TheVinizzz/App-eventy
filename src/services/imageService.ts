import api from './api';

export interface UploadResponse {
  uploadUrl: string;
  objectName: string;
  fileUrl: string;
}

/**
 * Generate a pre-signed URL for image upload
 */
export async function generateUploadUrl(filename = 'image.jpg'): Promise<UploadResponse> {
  try {
    const { data } = await api.post('/events/generate-upload-url', { filename });
    
    return {
      uploadUrl: data.uploadUrl,
      objectName: data.objectName,
      fileUrl: data.fileUrl
    };
  } catch (error) {
    console.error('Erro ao gerar URL de upload:', error);
    throw error;
  }
}

/**
 * Generate a pre-signed URL for video upload
 */
export async function generateVideoUploadUrl(filename = 'video.mp4'): Promise<UploadResponse> {
  try {
    const { data } = await api.post('/events/generate-video-upload-url', { filename });
    
    return {
      uploadUrl: data.uploadUrl,
      objectName: data.objectName,
      fileUrl: data.fileUrl
    };
  } catch (error) {
    console.error('Erro ao gerar URL de upload de vídeo:', error);
    throw error;
  }
}

/**
 * Upload file to presigned URL with progress tracking
 */
export async function uploadToPresignedUrl(
  presignedUrl: string,
  imageUri: string,
  filename: string,
  progressCallback?: (progress: number) => void
): Promise<boolean> {
  try {
    console.log('Fetching file from URI:', imageUri);
    // Read the file as blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    console.log('File blob created:', { size: blob.size, type: blob.type });

    // Determine content type based on filename or blob type
    let contentType = 'image/jpeg';
    if (filename.toLowerCase().endsWith('.png')) {
      contentType = 'image/png';
    } else if (filename.toLowerCase().endsWith('.gif')) {
      contentType = 'image/gif';
    } else if (filename.toLowerCase().endsWith('.webp')) {
      contentType = 'image/webp';
    } else if (blob.type && blob.type.startsWith('image/')) {
      contentType = blob.type;
    }
    console.log('Using content type:', contentType);

    // Upload to presigned URL
    console.log('Uploading to presigned URL:', presignedUrl);
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': contentType,
      },
    });

    console.log('Upload response status:', uploadResponse.status);
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload failed with response:', errorText);
      throw new Error(`Upload failed with status: ${uploadResponse.status}`);
    }

    console.log('Upload successful!');
    return true;
  } catch (error) {
    console.error('Erro ao fazer upload para URL pré-assinada:', error);
    return false;
  }
}

/**
 * Upload video to presigned URL
 */
export async function uploadVideoToPresignedUrl(
  presignedUrl: string,
  videoUri: string,
  filename: string,
  progressCallback?: (progress: number) => void
): Promise<boolean> {
  try {
    console.log('Fetching video from URI:', videoUri);
    // Read the file as blob
    const response = await fetch(videoUri);
    const blob = await response.blob();
    console.log('Video blob created:', { size: blob.size, type: blob.type });

    // Determine content type based on filename or blob type
    let contentType = 'video/mp4';
    if (filename.toLowerCase().endsWith('.mov')) {
      contentType = 'video/quicktime';
    } else if (filename.toLowerCase().endsWith('.avi')) {
      contentType = 'video/x-msvideo';
    } else if (filename.toLowerCase().endsWith('.webm')) {
      contentType = 'video/webm';
    } else if (blob.type && blob.type.startsWith('video/')) {
      contentType = blob.type;
    }
    console.log('Using video content type:', contentType);

    // Upload to presigned URL
    console.log('Uploading video to presigned URL:', presignedUrl);
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': contentType,
      },
    });

    console.log('Video upload response status:', uploadResponse.status);
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Video upload failed with response:', errorText);
      throw new Error(`Video upload failed with status: ${uploadResponse.status}`);
    }

    console.log('Video upload successful!');
    return true;
  } catch (error) {
    console.error('Erro ao fazer upload de vídeo para URL pré-assinada:', error);
    return false;
  }
}

/**
 * Complete image upload process
 */
export async function uploadEventImage(imageUri: string, filename?: string): Promise<string> {
  try {
    console.log('Starting image upload process...', { imageUri, filename });
    
    // Generate filename if not provided
    const finalFilename = filename || `event-${Date.now()}.jpg`;
    console.log('Using filename:', finalFilename);
    
    // Generate pre-signed URL
    console.log('Generating pre-signed URL...');
    const response = await generateUploadUrl(finalFilename);
    console.log('Pre-signed URL generated:', response.uploadUrl);
    
    // Upload file to pre-signed URL
    console.log('Uploading file to pre-signed URL...');
    const uploadSuccess = await uploadToPresignedUrl(response.uploadUrl, imageUri, finalFilename);
    
    if (!uploadSuccess) {
      throw new Error('Failed to upload image');
    }
    
    console.log('Image upload successful! File URL:', response.fileUrl);
    return response.fileUrl;
  } catch (error) {
    console.error('Error uploading event image:', error);
    throw error;
  }
}

/**
 * Complete story media upload process (image or video)
 */
export async function uploadStoryMedia(
  mediaUri: string, 
  mediaType: 'image' | 'video',
  filename?: string
): Promise<string> {
  try {
    console.log('Starting story media upload process...', { mediaUri, mediaType, filename });
    
    const timestamp = Date.now();
    const extension = mediaType === 'video' ? 'mp4' : 'jpg';
    const finalFilename = filename || `story-${timestamp}.${extension}`;
    console.log('Using filename:', finalFilename);
    
    if (mediaType === 'video') {
      console.log('Uploading video...');
      // Generate pre-signed URL for video
      const response = await generateVideoUploadUrl(finalFilename);
      console.log('Video pre-signed URL generated:', response.uploadUrl);
      
      // Upload video to pre-signed URL
      const uploadSuccess = await uploadVideoToPresignedUrl(response.uploadUrl, mediaUri, finalFilename);
      
      if (!uploadSuccess) {
        throw new Error('Failed to upload video');
      }
      
      console.log('Video upload successful! File URL:', response.fileUrl);
      return response.fileUrl;
    } else {
      console.log('Uploading image...');
      // Generate pre-signed URL for image
      const response = await generateUploadUrl(finalFilename);
      console.log('Image pre-signed URL generated:', response.uploadUrl);
      
      // Upload image to pre-signed URL
      const uploadSuccess = await uploadToPresignedUrl(response.uploadUrl, mediaUri, finalFilename);
      
      if (!uploadSuccess) {
        throw new Error('Failed to upload image');
      }
      
      console.log('Image upload successful! File URL:', response.fileUrl);
      return response.fileUrl;
    }
  } catch (error) {
    console.error('Error uploading story media:', error);
    throw error;
  }
}

export default {
  generateUploadUrl,
  generateVideoUploadUrl,
  uploadToPresignedUrl,
  uploadVideoToPresignedUrl,
  uploadEventImage,
  uploadStoryMedia,
}; 