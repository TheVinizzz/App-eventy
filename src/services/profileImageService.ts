import api from './api';
import { uploadToPresignedUrl, generateUploadUrl } from './imageService';

export interface ProfileImageUploadResponse {
  profileImageUrl: string;
}

/**
 * Upload profile image with automatic resizing and optimization
 */
export async function uploadProfileImage(imageUri: string): Promise<string> {
  try {
    console.log('🚀 ProfileImageService: Starting profile image upload...', { imageUri });
    
    // Generate filename with timestamp for uniqueness
    const timestamp = Date.now();
    const filename = `profile-${timestamp}.jpg`;
    console.log('📁 Using filename:', filename);
    
    // Generate pre-signed URL for upload
    console.log('📤 Generating pre-signed URL...');
    const uploadResponse = await generateUploadUrl(filename);
    console.log('✅ Pre-signed URL generated:', { uploadUrl: uploadResponse.uploadUrl, fileUrl: uploadResponse.fileUrl });
    
    // Upload file to pre-signed URL
    console.log('📦 Uploading file to pre-signed URL...');
    const uploadSuccess = await uploadToPresignedUrl(
      uploadResponse.uploadUrl, 
      imageUri, 
      filename,
      (progress) => {
        console.log(`⏳ Upload progress: ${progress}%`);
      }
    );
    
    if (!uploadSuccess) {
      throw new Error('Failed to upload profile image');
    }
    
    console.log('✅ Profile image upload successful! File URL:', uploadResponse.fileUrl);
    return uploadResponse.fileUrl;
    
  } catch (error: any) {
    console.error('❌ ProfileImageService: Error uploading profile image:', error);
    throw new Error(`Erro ao enviar imagem de perfil: ${error.message}`);
  }
}

/**
 * Upload and update profile image via API
 */
export async function uploadAndUpdateProfileImage(imageUri: string): Promise<string> {
  try {
    console.log('🚀 ProfileImageService: Starting complete profile image update process...');
    
    // Upload the image first
    const imageUrl = await uploadProfileImage(imageUri);
    console.log('📸 Image uploaded, URL:', imageUrl);
    
    // Update user profile with new image URL
    console.log('🔄 Updating user profile with new image...');
    const response = await api.put('/auth/profile', {
      profileImage: imageUrl
    });
    
    if (response.data) {
      console.log('✅ Profile updated successfully with new image');
      return imageUrl;
    } else {
      throw new Error('Failed to update profile with new image');
    }
    
  } catch (error: any) {
    console.error('❌ ProfileImageService: Error in complete update process:', error);
    throw error;
  }
}

export default {
  uploadProfileImage,
  uploadAndUpdateProfileImage,
}; 