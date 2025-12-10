import { useState } from 'react';


interface UploadResult {
    uploadImage: (file: File) => Promise<string | null>;
    isUploading: boolean;
    error: string | null;
}

export function useCloudinaryUpload(): UploadResult {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadImage = async (file: File): Promise<string | null> => {
        setIsUploading(true);
        setError(null);

        try {
            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

            if (!cloudName || !uploadPreset) {
                throw new Error('Cloudinary configuration missing. Please check environment variables.');
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error('Failed to upload image to Cloudinary');
            }

            const data = await response.json() as { secure_url: string };
            return data.secure_url;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            console.error('Cloudinary upload error:', err);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    return { uploadImage, isUploading, error };
}
