import { 
  FlatList, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  Alert, 
  Modal, 
  TextInput,
  ScrollView 
} from 'react-native'
import React, { useState, useEffect, useCallback, memo } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import EmptyState from '../../components/EmptyState'
import FormField from '../../components/FormField'
import { getUserPosts, getUserQuizStats, getUserQuizAttempts, signOut, getPostById } from '../../lib/appwrite'
import { router } from 'expo-router'
import VideoCard from '../../components/VideoCard'
import { useGlobalContext } from '../../context/GlobalProvider'
import { icons } from '../../constants'
import InfoBox from '../../components/InfoBox'
import useAppwrite from '../../lib/useAppwrite'
import PasswordChangeModal from '../../components/PasswordResetModal'

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

const Profile = () => {
  const { user, setUser, setIsLogged } = useGlobalContext();
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
  const { data: posts, refetch: refetchPosts } = useAppwrite(() => getUserPosts(user.$id));
  const { data: quizStats, refetch: refetchQuizStats } = useAppwrite(() => getUserQuizStats(user.$id));
  const { data: quizAttempts, refetch: refetchQuizAttempts } = useAppwrite(() => getUserQuizAttempts(user.$id));

  useFocusEffect(
    React.useCallback(() => {
      const refreshData = async () => {
        await Promise.all([
          refetchQuizStats(),
          refetchQuizAttempts(),
          refetchPosts()
        ]);
      };
      
      refreshData();
    }, [])
  );

  const logout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              setIsLogged(false);
              setUser(null);
              router.replace('/sign-in');
            } catch (error) {
              Alert.alert("Error", "Failed to log out. Please try again.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <PasswordChangeModal 
        visible={isPasswordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
      />
      <FlatList
        data={user?.role === 'educator' ? posts : quizAttempts}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          user?.role === 'educator' ? (
            <VideoCard video={item} />
          ) : (
            <QuizAttemptCard attempt={item} />
          )
        )}
        ListHeaderComponent={() => (
          <View className='w-full justify-center items-center mt-6 mb-12 px-4'>
            <View className="w-full flex-row justify-end items-center mb-10 gap-4">
              <TouchableOpacity onPress={() => setPasswordModalVisible(true)}>
                <Image source={icons.password} resizeMode='contain' className='w-9 h-9'/>
              </TouchableOpacity>
              <TouchableOpacity onPress={logout}>
                <Image source={icons.logout} resizeMode='contain' className='w-8 h-8'/>
              </TouchableOpacity>
            </View>
            <View className='w-16 h-16 rounded-lg border border-secondary justify-center items-center'>
              <Image 
                source={{uri: user?.avatar}} 
                className='w-[98%] h-[98%] rounded-lg' 
                resizeMode='cover'/>
            </View>
            <InfoBox
              title={user?.username}
              containerStyles="mt-5"
              titleStyles="text-lg"
            />

            <View className="mt-5 flex-row justify-center items-center">
              {user?.role === 'educator' ? (
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
            title={user?.role === 'educator' ? "No videos found" : "No quiz attempts yet"}
            subtitle={
              user?.role === 'educator' 
                ? "Upload your first educational video"
                : "Watch some educational videos and attempt quizzes to track your progress"
            }
          />
        )}
      />
    </SafeAreaView>
  );
};

export default Profile;
