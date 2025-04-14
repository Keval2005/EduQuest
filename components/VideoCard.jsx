import { View, Text, Image, TouchableOpacity } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'expo-router'
import { icons } from '../constants'
import { Video, ResizeMode } from 'expo-av';
import { useGlobalContext } from '../context/GlobalProvider';

const VideoCard = ({ video }) => {
  const router = useRouter();
  const { currentlyPlayingVideo, setCurrentlyPlayingVideo, user } = useGlobalContext();
  const [play, setPlay] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVideoCompleted, setIsVideoCompleted] = useState(false);
  const videoRef = useRef(null);

  const { title, thumbnail, video: videoUrl, creator, $id } = video;

  // Check if this video is the currently playing one
  useEffect(() => {
    if (currentlyPlayingVideo !== $id && play) {
      setPlay(false);
      // Ensure the video is paused
      if (videoRef.current) {
        videoRef.current.pauseAsync();
      }
    }
  }, [currentlyPlayingVideo, $id]);

  const handlePlay = () => {
    // Set this video as the currently playing one
    setCurrentlyPlayingVideo($id);
    setPlay(true);
    setIsVideoLoaded(true);
    setIsVideoCompleted(false);
  };

  const handleVideoEnd = () => {
    setPlay(false);
    setCurrentlyPlayingVideo(null);
    setIsVideoCompleted(true);
  };

  const handleCardPress = () => {
    // If video is playing, pause it before redirecting
    if (play && videoRef.current) {
      videoRef.current.pauseAsync();
      setPlay(false);
      setCurrentlyPlayingVideo(null);
    }
    
    // Then redirect to the video detail page
    router.push(`/video/${$id}`);
  };

  const handleUserProfilePress = () => {
    // If it's the current user's video, redirect to tabs profile
    if (creator.$id === user?.$id) {
      router.push('/(tabs)/profile');
    } else {
      // If it's another user's video, redirect to their profile page
      router.push(`/profile/${creator.$id}`);
    }
  };

  return (
    <TouchableOpacity 
      className="flex-col items-center mb-12 border border-secondary rounded-xl mx-4 px-4 pt-4 pb-14"
      onPress={handleCardPress}
      activeOpacity={0.9}
    >
      <View className="flex-row gap-3 items-start">
        <View className="justify-center items-center flex-row flex-1">
          <TouchableOpacity onPress={handleUserProfilePress}>
            <View className="w-[46px] h-[46px] rounded-lg border border-secondary justify-center items-center">
              <Image source={{ uri: creator.avatar }} className="w-full h-full rounded-lg" resizeMode='cover'/>
            </View>
          </TouchableOpacity>
          <View className="justify-center gap-y-1 flex-1 ml-3">
            <Text className="text-white font-psemibold text-lg" numberOfLines={1}>{title}</Text>
            <TouchableOpacity onPress={handleUserProfilePress}>
              <Text className="text-gray-100 font-pregular text-sm" numberOfLines={1}>{creator.username}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="pt-2">
          <TouchableOpacity onPress={handleCardPress}>
            <Image source={icons.redirect} className="w-8 h-8" resizeMode='contain' />
          </TouchableOpacity>
        </View>
      </View>
      
      {isVideoLoaded && !isVideoCompleted ? (
        <View className="w-full h-60 rounded-xl mt-3 relative">
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={{
              width: "100%",
              height: 240,
              borderRadius: 12,
              marginTop: 12,
            }}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            shouldPlay={play}
            onPlaybackStatusUpdate={(status) => {
              if (status.didJustFinish) {
                handleVideoEnd();
              }
            }}
          />
          {!play && (
            <TouchableOpacity 
              className="absolute inset-0 justify-center items-center" 
              activeOpacity={0.7}
              onPress={handlePlay}
            >
              <Image source={icons.play} className="w-12 h-12" resizeMode='contain' />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <TouchableOpacity 
          className="w-full h-60 rounded-xl mt-3 relative justify-center items-center" 
          activeOpacity={0.7}
          onPress={handlePlay}
        >
          <Image source={{ uri: thumbnail }} className="w-full h-full rounded-xl mt-3" resizeMode='cover'/>
          <Image source={icons.play} className="w-12 h-12 absolute" resizeMode='contain' />
        </TouchableOpacity> 
      )}
    </TouchableOpacity>
  )
}

export default VideoCard