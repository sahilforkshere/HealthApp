import { Image } from 'react-native';
import React, { ComponentProps, useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

type RemoteImageProps = {
  path?: string;
  fallback: string;
  bucket?: string;
} & Omit<ComponentProps<typeof Image>, 'source'>;

const RemoteImage = ({ path, fallback, bucket = 'avatars', ...imageProps }: RemoteImageProps) => {
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!path) {
      setImage(fallback);
      return;
    }
    
    (async () => {
      setLoading(true);
      setImage('');
      
      try {
        console.log(`🖼️ Loading image from ${bucket}:`, path);
        
        // Try public URL first (faster for public buckets)
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(path);
        
        console.log('🔗 Generated public URL:', publicUrl);
        
        if (publicUrl) {
          setImage(publicUrl);
          return;
        }

        // Fallback to download method
        const { data, error } = await supabase.storage
          .from(bucket)
          .download(path);

        if (error) {
          console.error('❌ Download error:', error);
          setImage(fallback);
          return;
        }

        if (data) {
          const fr = new FileReader();
          fr.readAsDataURL(data);
          fr.onload = () => {
            setImage(fr.result as string);
          };
        }
      } catch (err) {
        console.error('❌ Error loading image:', err);
        setImage(fallback);
      } finally {
        setLoading(false);
      }
    })();
  }, [path, fallback, bucket]);

  return <Image source={{ uri: image || fallback }} {...imageProps} />;
};

export default RemoteImage;
