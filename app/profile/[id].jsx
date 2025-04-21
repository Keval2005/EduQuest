import { FlatList, Text, View, TouchableOpacity, Image } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import EmptyState from '../../components/EmptyState'
import { getUserPosts, getUserQuizStats, getUserQuizAttempts, getUserById, getPostById } from '../../lib/appwrite'  
import { router, useLocalSearchParams } from 'expo-router'
import VideoCard from '../../components/VideoCard'
import useAppwrite from '../../lib/useAppwrite'
import { icons } from '../../constants'
import InfoBox from '../../components/InfoBox'
import { Stack } from 'expo-router';

const QuizAttemptCard = ({ attempt }) => {
  const [videoTitle, setVideoTitle] = useState("Loading...");

  useEffect(() => {
    const fetchVideoTitle = async () => {
      try {
        const videoData = await getPostById(attempt.videoId);
        setVideoTitle(videoData.title);
      } catch (error) {
        console.error('Error fetching video title:', error);
        setVideoTitle("Untitled Video");
      }
    };

    fetchVideoTitle();
  }, [attempt.videoId]);

  return (
    <View className="bg-black-100 rounded-2xl p-4 mx-4 mb-4">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-white font-psemibold text-lg">
          Quiz Score: {attempt.score}/{attempt.totalQuestions}
        </Text>
        <Text className="text-gray-400">
          {new Date(attempt.timestamp).toLocaleDateString()}
        </Text>
      </View>
      <Text className="text-gray-400 mt-1" numberOfLines={1}>
        {videoTitle}
      </Text>
      <TouchableOpacity 
        className="mt-2"
        onPress={() => router.push(`/video/${attempt.videoId}`)}
      >
        <Text className="text-secondary">View Video →</Text>
      </TouchableOpacity>
    </View>
  );
};

const UserProfile = () => {
  const { id } = useLocalSearchParams();
  const { data: profileUser } = useAppwrite(() => getUserById(id));
  const { data: posts } = useAppwrite(() => getUserPosts(id));
  const { data: quizStats } = useAppwrite(() => getUserQuizStats(id));
  const { data: quizAttempts } = useAppwrite(() => getUserQuizAttempts(id));

  return (

    <>
          <Stack.Screen 
            options={{
              title: "Profile",
              headerShown: true
            }} 
          />

    <SafeAreaView className="bg-primary h-full">
      <FlatList
        data={profileUser?.role === 'educator' ? posts : quizAttempts}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          profileUser?.role === 'educator' ? (
            <VideoCard video={item} />
          ) : (
            <QuizAttemptCard attempt={item} />
          )
        )}
        ListHeaderComponent={() => (
          <View className='w-full justify-center items-center mt-6 mb-12 px-4'>
            <TouchableOpacity className="w-full items-end mb-10" onPress={() => router.back()}>
              <Image source={icons.back} resizeMode='contain' className='w-6 h-6'/>
            </TouchableOpacity>
            <View className='w-16 h-16 rounded-lg border border-secondary justify-center items-center'>
              <Image 
                source={{uri: profileUser?.avatar}} 
                className='w-[98%] h-[98%] rounded-lg' 
                resizeMode='cover'/>
            </View>
            <InfoBox
              title={profileUser?.username}
              containerStyles="mt-5"
              titleStyles="text-lg"
            />

            <View className="mt-5 flex-row justify-center items-center">
              {profileUser?.role === 'educator' ? (
                <InfoBox
                  title={posts?.length || 0}
                  subtitle="Posts"
                  titleStyles="text-xl"
                />
              ) : (
                <InfoBox
                  title={quizStats?.averageScore || '0'}
                  subtitle={`Quiz Score (${quizStats?.totalAttempts || 0} attempts)`}
                  titleStyles="text-xl"
                />
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title={profileUser?.role === 'educator' ? "No videos found" : "No quiz attempts yet"}
            subtitle={
              profileUser?.role === 'educator' 
                ? "No videos uploaded yet"
                : "This student hasn't attempted any quizzes yet"
            }
          />
        )}
      />
    </SafeAreaView>
    </>
  );
};

export default UserProfile;
