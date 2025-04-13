import { View, Text, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { ResizeMode, Video } from "expo-av";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { icons } from '../../constants';
import { getPostById } from '../../lib/appwrite';

const VideoPlayer = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(16/9); 

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await getPostById(id);
        setPost(postData);
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-primary justify-center items-center">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View className="flex-1 bg-primary justify-center items-center">
        <Text className="text-white">Video not found</Text>
      </View>
    );
  }

  const { title, video, creator: { username, avatar }, prompt } = post;

  const handleVideoLoad = (status) => {
    if (status?.naturalSize?.width && status?.naturalSize?.height) {
      const ratio = status.naturalSize.width / status.naturalSize.height;
      setAspectRatio(isNaN(ratio) ? 16/9 : ratio);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
        <View className="gap-3 p-4 items-center flex-row">
            <View className="w-[46px] h-[46px] rounded-lg border border-secondary justify-center items-center">
                <Image source={{ uri:avatar }} className="w-full h-full rounded-lg" resizeMode='cover'/>
            </View>
            <View className="justify-center gap-y-1 flex-1 ml-3">
                <Text className="text-white font-psemibold text-xl" numberOfLines={1}>{title}</Text>
                <Text className="text-gray-100 font-pregular text-sm" numberOfLines={1}>{username}</Text>
            </View>
            <View className="pt-2">
                <Image source={icons.menu} className="w-5 h-5" resizeMode='contain' />
            </View>
        </View>
        

      <View className="justify-top">
        <Video
          source={{ uri: video }}
        //   style={{
        //     width: "100%",
        //     height: "50%",
        //   }}
          style={{
            aspectRatio: aspectRatio,
          }}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          shouldPlay
          onReadyForDisplay={handleVideoLoad}
          onError={(error) => console.error('Video Error:', error)}
        />
      </View>
    </SafeAreaView>
  );
};

export default VideoPlayer; 